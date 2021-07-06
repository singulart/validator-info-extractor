import { Op } from 'sequelize'
import {
  Account,
  Balance,
  Block,
  Category,
  Channel,
  Council,
  Consul,
  ConsulStake,
  Era,
  Event,
  Member,
  Post,
  Proposal,
  ProposalPost,
  ProposalVote,
  Thread,
  Moderation,
} from '../db/models'

import * as get from './lib/getters'
//import {fetchReports} from './lib/github'
import axios from 'axios'
import moment from 'moment'
import chalk from 'chalk'

import { VoteKind } from '@joystream/types/proposals'
import { Seats } from '@joystream/types/council'
import { AccountInfo } from '@polkadot/types/interfaces/system'
import { HeaderExtended } from '@polkadot/api-derive/type/types';
import {
  Api,
  Handles,
  IState,
  MemberType,
  CategoryType,
  ChannelType,
  PostType,
  Seat,
  ThreadType,
  CouncilType,
  ProposalDetail,
  Status,
} from '../types'

import {
  AccountId,
  Moment,
  ActiveEraInfo,
  EventRecord,
} from '@polkadot/types/interfaces'
import { Vec } from '@polkadot/types'

// TODO fetch consts from db/chain
const TERMDURATION = 144000
const VOTINGDURATION = 57601
const CYCLE = VOTINGDURATION + TERMDURATION

const DELAY = 0 // ms
let lastUpdate = 0
let queuedAll = false
let queue: any[] = []
let processing = ''
let busy = false

export const processNext = async () => {
  if (busy) return
  const task = queue.shift()
  if (!task) return
  const result = await task()
  busy = false
  setTimeout(() => processNext(), DELAY)
}

const getBlockHash = (api: Api, blockId: number) =>
  api.rpc.chain.getBlockHash(blockId).then((array: any) => array.toHuman())

const getEraAtHash = (api: Api, hash: string) =>
  api.query.staking.activeEra
    .at(hash)
    .then((era) => era.unwrap().index.toNumber())

const getEraAtBlock = async (api: Api, block: number) =>
  getEraAtHash(api, await getBlockHash(api, block))

const getTimestamp = async (api: Api, hash?: string) => {
  const timestamp = hash
    ? await api.query.timestamp.now.at(hash)
    : await api.query.timestamp.now()
  return moment.utc(timestamp.toNumber()).valueOf()
}

const findCouncilAtBlock = (api: Api, block: number) =>
  Council.findOne({
    where: {
      start: { [Op.lte]: block },
      end: { [Op.gte]: block - VOTINGDURATION },
    },
  })

export const addBlock = async (
  api: Api,
  io: any,
  header: { number: number; author: string },
  status: Status = {
    block: 0,
    era: 0,
    round: 0,
    members: 0,
    channels: 0,
    categories: 0,
    threads: 0,
    posts: 0,
    proposals: 0,
    proposalPosts: 0,
  }
): Promise<Status> => {
  const id = +header.number
  const exists = await Block.findByPk(id)
  if (exists) {
    console.error(`TODO handle fork`, String(header.author))
    return status
  }

  const block = await processBlock(api, id)
  const key = header.author?.toString()
  const [account] = await Account.findOrCreate({ where: { key } })
  await block.setValidator(account.key)
  //account.addBlock(block.id) // TODO needed?
  io.emit('block', await Block.findByIdWithIncludes(id))

  // logging
  const handle = await getHandleOrKey(api, key)
  const q = queue.length ? chalk.green(` [${queue.length}:${processing}]`) : ''
  console.log(`[Joystream] block ${id} ${handle} ${q}`)

  return updateStatus(api, status, id)
}

const processBlock = async (api: Api, id: number) => {

  const exists = await Block.findByPk(id)
  if (exists) return exists

  processing = `block ${id}`
  const last = await Block.findByPk(id - 1)
  let lastBlockTimestamp;
  if (last) {
    lastBlockTimestamp = last.timestamp.getTime();
  } else {
    let lastBlockHash = await getBlockHash(api, id - 1);
    lastBlockTimestamp = await getTimestamp(api, lastBlockHash);
  }

  const [block] = await Block.findOrCreate({ where: { id } })
  block.hash = await getBlockHash(api, id)
  let currentBlockTimestamp = await getTimestamp(api, block.hash);
  const extendedHeader = await api.derive.chain.getHeader(block.hash) as HeaderExtended;
  block.timestamp = new Date(currentBlockTimestamp)
  block.blocktime = (currentBlockTimestamp - lastBlockTimestamp)
  await Account.findOrCreate({ where: { key: extendedHeader.author.toHuman() } })
  block.validatorKey = extendedHeader.author.toHuman();
  console.log(extendedHeader.author.toHuman());
  block.save()

  processEvents(api, id, block.hash)
  await importEraAtBlock(api, id, block.hash)
  return block
}

export const addBlockRange = async (
  api: Api,
  startBlock: number,
  endBlock: number
) => {
  for (let block = startBlock; block <= endBlock; block++) {
    queue.push(() => processBlock(api, block))
  }
}

const updateStatus = async (api: Api, old: Status, block: number) => {
  const status = {
    block,
    era: await getEraAtBlock(api, block),
    round: Number(await api.query.councilElection.round()),
    members: (await api.query.members.nextMemberId()) - 1,
    channels: await get.currentChannelId(api),

    categories: await get.currentCategoryId(api),
    threads: await get.currentThreadId(api),
    posts: await get.currentPostId(api),

    proposals: await get.proposalCount(api),
    proposalPosts: (await api.query.proposalsDiscussion.postCount()).toHuman(),
  }
  if (!queuedAll) fetchAll(api, status)
  else {
    // TODO catch if more than one are added
    status.members > old.members && fetchMember(api, status.members)
    status.posts > old.posts && fetchPost(api, status.posts)
    status.proposals > old.proposals && fetchProposal(api, status.proposals)
    status.channels > old.channels && fetchChannel(api, status.channels)
    status.categories > old.categories && fetchCategory(api, status.categories)
    status.proposalPosts > old.proposalPosts &&
      fetchProposalPosts(api, status.proposalPosts)
  }
  return status
}

const fetchAll = async (api: Api, status: Status) => {
  queue.push(() => fetchAccounts(api, status.block))

  for (let id = status.members; id > 0; id--) {
    queue.push(() => fetchMember(api, id))
  }
  for (let id = status.round; id > 0; id--) {
    queue.push(() => fetchCouncil(api, id))
  }

  for (let id = status.proposals; id > 0; id--) {
    queue.push(() => fetchProposal(api, id))
  }

  for (let id = status.channels; id > 0; id--) {
    queue.push(() => fetchChannel(api, id))
  }
  for (let id = status.categories; id > 0; id--) {
    queue.push(() => fetchCategory(api, id))
  }
  for (let id = status.threads; id > 0; id--) {
    queue.push(() => fetchThread(api, id))
  }
  for (let id = status.posts; id > 0; id--) {
    queue.push(() => fetchPost(api, id))
  }

  queue.push(() => fetchProposalPosts(api, status.proposalPosts))
  queue.push(() => addBlockRange(api, 1, status.block))
  queuedAll = true
  processNext()
}

const processEvents = async (api: Api, blockId: number, hash: string) => {
  processing = `events block ${blockId}`
  try {
    const blockEvents = await api.query.system.events.at(hash)
    blockEvents.forEach(({ event }: EventRecord) => {
      let { section, method, data } = event
      //console.log(data);
      Event.create({ blockId, section, method, data: JSON.stringify(data) })
    })
  } catch (e) {
    console.log(`failed to fetch events for block  ${blockId} ${hash}`)
  }
  // TODO catch votes, posts, proposals?
}

const fetchValidators = async (api: Api, hash: string) =>
  api.query.staking.snapshotValidators.at(hash);

const importEraAtBlock = async (api: Api, blockId: number, hash: string) => {
  const id = await getEraAtHash(api, hash)
  const [era] = await Era.findOrCreate({ where: { id } })
  era.addBlock(blockId)
  if (era.active) return

  processing = `era ${id}`
  try {
    fetchValidators(api, hash).then(
      async (snapshot) => {
        if (snapshot.isEmpty) return
        console.log(`[Joystream] Found validator info for era ${id}`)
        const validatorCount = snapshot.unwrap().length
        era.slots = (await api.query.staking.validatorCount.at(hash)).toNumber()
        era.active = Math.min(era.slots, validatorCount)
        era.waiting =
          validatorCount > era.slots ? validatorCount - era.slots : 0
        era.stake = await api.query.staking.erasTotalStake.at(hash, id)
        const chainTimestamp = (await api.query.timestamp.now.at(
          hash
        )) as Moment
        era.timestamp = moment(chainTimestamp.toNumber())
        // era.update({ slots, active, waiting, stake, timestamp })
        era.blockId = id
        era.save()
        updateBalances(api, hash)
      }
    )
  } catch (e) {
    console.error(`import era ${blockId} ${hash}`, e)
  }
}

const validatorStatus = async (api: Api, blockId: number) => {
  const hash = await getBlockHash(api, blockId)
  let totalValidators = await api.query.staking.snapshotValidators.at(hash)
  if (totalValidators.isEmpty) return {};

  let totalNrValidators = totalValidators.unwrap().length
  const maxSlots = Number(await api.query.staking.validatorCount.at(hash))
  const actives = Math.min(maxSlots, totalNrValidators)
  const waiting =
    totalNrValidators > maxSlots ? totalNrValidators - maxSlots : 0
  let timestamp = await api.query.timestamp.now.at(hash)
  const date = moment(timestamp.toNumber()).valueOf()
  return { blockId, actives, waiting, maxSlots, date }
}

const updateBalances = async (api: Api, blockHash: string) => {
  const currentEra: number = await api.query.staking.currentEra.at(blockHash)
  const era = await Era.findOrCreate({ where: { id: currentEra } })
  try {
    processing = `balances ${era}`
    Account.findAll().then(async (account: any) => {
      const { key } = account
      if (!key) return
      console.log(`updating balance of`, key, key)

      const { data } = await getAccountAtBlock(api, blockHash, key)
      const { free, reserved, miscFrozen, feeFrozen } = data
      const balance = { available: free, reserved, frozen: miscFrozen }
      console.log(`balance ${era}`, balance)
      Balance.create(balance).then((balance: any) => {
        balance.setAccount(key)
        balance.setEra(era.id)
        console.log(`balance`, era.id, key, balance.available)
      })
    })
  } catch (e) {
    console.error(`balances era ${era}`)
  }
}

const fetchTokenomics = async () => {
  console.debug(`Updating tokenomics`)
  const { data } = await axios.get('https://status.joystream.org/status')
  if (!data) return
  // TODO save 'tokenomics', data
}

const fetchChannel = async (api: Api, id: number) => {
  if (id <= 0) return
  const exists = await Channel.findByPk(id)
  if (exists) return exists

  processing = `channel ${id}`
  const data = await api.query.contentWorkingGroup.channelById(id)
  const { handle, title, description, avatar, banner, content, created } = data
  // TODO const accountId = String(data.role_account)
  const channel = {
    id,
    handle: String(handle),
    title: String(title),
    description: String(description),
    avatar: String(avatar),
    banner: String(banner),
    content: String(content),
    publicationStatus: data.publication_status === 'Public' ? true : false,
    curation: String(data.curation_status),
    createdAt: +created,
    principal: Number(data.principal_id),
  }
  const chan = await Channel.create(channel)
  const owner = await fetchMember(api, data.owner)
  chan.setOwner(owner)
  return chan
}

const fetchCategory = async (api: Api, id: number) => {
  if (id <= 0) return
  const exists = await Category.findByPk(+id)
  if (exists) return exists

  processing = `category ${id}`
  const data = await api.query.forum.categoryById(id)

  const { title, description, deleted, archived } = data
  const category = await Category.create({
    id,
    title,
    threadId: +data.thread_id, // TODO needed?
    description,
    createdAt: +data.created_at.block,
    deleted,
    archived,
    subcategories: Number(data.num_direct_subcategories),
    moderatedThreads: Number(data.num_direct_moderated_threads),
    unmoderatedThreads: Number(data.num_direct_unmoderated_threads),
    //position:+data.position_in_parent_category // TODO sometimes NaN,
  })
  createModeration(api, { categoryId: id }, String(data.moderator_id), category)
  return category
}

const fetchPost = async (api: Api, id: number) => {
  if (id <= 0) return
  const exists = await Post.findByPk(id)
  if (exists) return exists

  processing = `post ${id}`
  const data = await api.query.forum.postById(id)

  const author: string = String(data.author_id)
  const member = await fetchMemberByAccount(api, author)
  const authorId = member ? member.id : null

  const threadId = Number(data.thread_id)
  const thread = await fetchThread(api, threadId)

  const text = data.current_text
  const history = data.text_change_history // TODO needed?
  const createdAt = data.created_at.block
  const post = await Post.create({ id, authorId, text, createdAt, threadId })
  if (data.moderation)
    createModeration(api, { postId: id }, data.moderation, post)
  return post
}

const createModeration = async (
  api: Api,
  where: {},
  key: string,
  object: { setModeration: (id: number) => {} }
) => {
  if (key === '') return
  await Account.findOrCreate({ where: { key } })
  const moderation = await Moderation.create({ moderatorKey: key })
  object.setModeration(moderation.id)
  return moderation
}

const fetchThread = async (api: Api, id: number) => {
  if (id <= 0) return
  const exists = await Thread.findByPk(id)
  if (exists) return exists

  processing = `thread ${id}`
  const data = await api.query.forum.threadById(id)
  const { title, moderation, nr_in_category } = data
  const account = String(data.author_id)
  const t = {
    id,
    title,
    nrInCategory: +nr_in_category,
    createdAt: +data.created_at.block,
  }
  const thread = await Thread.create(t)
  const category = await fetchCategory(api, +data.category_id)
  if (category) thread.setCategory(category.id)
  const author = await fetchMemberByAccount(api, account)
  if (author) thread.setCreator(author.id)
  if (moderation) {
    const { moderated_at, moderator_id, rationale } = moderation
    const created = moderated_at.block
    const createdAt = moment.utc(moderated_at.time)
    createModeration(
      api,
      { created, createdAt, rationale },
      moderator_id.toHuman(),
      thread
    )
  }
  return thread
}

const fetchCouncil = async (api: Api, round: number) => {
  if (round <= 0) return console.log(chalk.red(`[fetchCouncil] round:${round}`))

  const exists = await Council.findByPk(round)
  if (exists) return exists

  processing = `council ${round}`
  const start = 57601 + (round - 1) * CYCLE
  const end = start + TERMDURATION
  let council = { round, start, end, startDate: 0, endDate: 0 }
  let seats: Seats
  try {
    const startHash = await getBlockHash(api, start)
    council.startDate = await getTimestamp(api, startHash)
    seats = await api.query.council.activeCouncil.at(startHash)
  } catch (e) {
    return console.log(`council term ${round} lies in the future ${start}`)
  }

  try {
    const endHash = await getBlockHash(api, end)
    council.endDate = await getTimestamp(api, endHash)
  } catch (e) {
    console.warn(`end of council term ${round} lies in the future ${end}`)
  }

  try {
    Council.create(council).then(({ round }: any) =>
      seats.map(({ member, stake, backers }) =>
        fetchMemberByAccount(api, member.toHuman()).then(({ id }: any) =>
          Consul.create({
            stake: Number(stake),
            councilRound: round,
            memberId: id,
          }).then((consul: any) =>
            backers.map(async ({ member, stake }) =>
              fetchMemberByAccount(api, member.toHuman()).then(({ id }: any) =>
                ConsulStake.create({
                  stake: Number(stake),
                  consulId: consul.id,
                  memberId: id,
                })
              )
            )
          )
        )
      )
    )
  } catch (e) {
    console.error(`Failed to save council ${round}`, e)
  }
}

const fetchProposal = async (api: Api, id: number) => {
  if (id <= 0) return
  const exists = await Proposal.findByPk(+id)
  if (exists) {
    fetchProposalVotes(api, exists)
    return exists
  }

  processing = `proposal ${id}`
  const proposal = await get.proposalDetail(api, id)
  await fetchMember(api, proposal.authorId)
  fetchProposalVotes(api, proposal)
  return Proposal.create(proposal)
}

const fetchProposalPost = (api: Api, threadId: number, postId: number) =>
  api.query.proposalsDiscussion.postThreadIdByPostId(threadId, postId)

const fetchProposalPosts = async (api: Api, posts: number) => {
  const threads = (await api.query.proposalsDiscussion.threadCount()).toNumber()
  let proposalId = 1

  for (let id = 1; id <= posts && proposalId <= threads; ) {
    const exists = await ProposalPost.findByPk(id)
    if (exists) {
      id++
      proposalId = 1
      continue
    }

    processing = `proposal post ${id}/${posts} ${proposalId}/${threads}`
    const post = await fetchProposalPost(api, proposalId, id)

    if (!post.text.length) {
      proposalId++
      continue
    }

    const proposal = await Proposal.findByPk(proposalId)
    if (!proposal) {
      console.warn(`[fetchProposalPosts] proposal ${proposalId} not found.`)
      id++
      continue
    }
    ProposalPost.create({
      id,
      text: post.text.toHuman(),
      created: Number(post.created_at),
      updated: Number(post.updated_at),
      edition: Number(post.edition_number),
      authorId: Number(post.author_id),
    }).then((p: any) => proposal.addPost(p))

    id++
    proposalId = 1
  }
}

const fetchProposalVotes = async (api: Api, proposal: ProposalDetail) => {
  if (!proposal) return console.error(`[fetchProposalVotes] empty proposal`)
  processing = `votes proposal ${proposal.id}`
  const { createdAt, finalizedAt } = proposal
  try {
    const start = createdAt ? await findCouncilAtBlock(api, createdAt) : null
    if (start) start.addProposal(proposal.id)
    else
      return console.error(
        `[fetchProposalVotes] no council found for proposal ${proposal.id}`
      )
    // some proposals make it into a second term
    const end = finalizedAt ? await findCouncilAtBlock(api, finalizedAt) : null
    const councils = [start && start.round, end && end.round]
    const consuls = await Consul.findAll({
      where: { councilRound: { [Op.or]: councils } },
    })
    consuls.map(({ id, memberId }: any) =>
      fetchProposalVoteByConsul(api, proposal.id, id, memberId)
    )
  } catch (e) {
    console.log(`failed to fetch votes of proposal ${proposal.id}`, e)
  }
}

const fetchProposalVoteByConsul = async (
  api: Api,
  proposalId: number,
  consulId: number,
  memberId: number
): Promise<any> => {
  processing = `vote by ${consulId} for proposal ${proposalId}`
  const exists = await ProposalVote.findOne({
    where: { proposalId, memberId, consulId },
  })
  if (exists) return exists

  const query = api.query.proposalsEngine
  const args = [proposalId, memberId]

  const hasVoted = await query.voteExistsByProposalByVoter.size(...args)
  if (!hasVoted.toNumber()) return

  const vote = (await query.voteExistsByProposalByVoter(...args)).toHuman()
  await fetchMember(api, memberId) // TODO needed?
  return ProposalVote.create({ vote: vote, proposalId, consulId, memberId })
}

// accounts
const getHandleOrKey = async (api: Api, key: string) => {
  const member = await fetchMemberByAccount(api, key)
  return member ? member.handle : key //abbrKey(key)
}

const abbrKey = (key: string) =>
  `${key.slice(0, 5)}..${key.slice(key.length - 5)}`

const getAccountAtBlock = (
  api: Api,
  hash: string,
  account: string
): Promise<AccountInfo> => api.query.system.account.at(hash, account)

const fetchAccounts = async (api: Api, blockId: number) => {
  processing = `accounts`
  api.query.system.account
    .entries()
    .then((account: any) =>
      Account.findOrCreate({ where: { key: account[0][0].toHuman()[0] } })
    )
}

const fetchMemberByAccount = async (api: Api, rootKey: string) => {
  const member = await Member.findOne({ where: { rootKey } })
  if (member) return member
  const id = Number(await get.memberIdByAccount(api, rootKey))
  if (id) return fetchMember(api, id)
  else Account.findOrCreate({ where: { key: rootKey } })
}

const fetchMember = async (
  api: Api,
  id: number
): Promise<MemberType | undefined> => {
  if (id <= 0) return
  const exists = await Member.findByPk(+id)
  if (exists) return exists

  processing = `member ${id}`
  const membership = await get.membership(api, id)
  const about = String(membership.about)
  const handle = String(membership.handle)
  const createdAt = +membership.registered_at_block
  const rootKey = String(membership.root_account)

  return Member.create({ id, about, createdAt, handle, rootKey }).then(
    (member: any) => {
      Account.findOrCreate({ where: { key: rootKey } }).then(([account]: any) =>
        account.setMember(id)
      )
      return member
    }
  )
}

module.exports = { addBlock, addBlockRange, processNext }
