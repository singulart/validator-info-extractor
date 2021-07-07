import {
  Account,
  Block,
  Era,
  Event,
  ValidatorStats
} from '../db/models'

import moment from 'moment'
import chalk from 'chalk'

import { HeaderExtended } from '@polkadot/api-derive/type/types';
import {
  Api,
  Status,
} from '../types'


import {
  AccountId,
  Moment,
  EventRecord,
} from '@polkadot/types/interfaces'
import { Vec } from '@polkadot/types'


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

export const addBlock = async (
  api: Api,
  header: { number: number; author: string }
) => {
  const id = +header.number
  const exists = await Block.findByPk(id)
  if (exists) {
    console.error(`TODO handle fork`, String(header.author))
  }

  const block = await processBlock(api, id)
  const key = header.author?.toString()
  const [account] = await Account.findOrCreate({ where: { 'key': key } })
  await block.setValidator(account.id)

  // logging
  //const handle = await getHandleOrKey(api, key)
  const q = queue.length ? chalk.green(` [${queue.length}:${processing}]`) : ''
  console.log(`[Joystream] block ${id} ${q}`)
}

const processBlock = async (api: Api, id: number) => {

  const exists = await Block.findByPk(id)
  if (exists) return exists

  processing = `block ${id}`
  console.log(processing)
  const last = await Block.findByPk(id - 1)
  let lastBlockTimestamp;
  if (last) {
    lastBlockTimestamp = last.timestamp.getTime();
  } else {
    let lastBlockHash = await getBlockHash(api, id - 1);
    lastBlockTimestamp = await getTimestamp(api, lastBlockHash);
  }

  const block = new Block()
  block.id = id
  block.hash = await getBlockHash(api, id)
  let currentBlockTimestamp = await getTimestamp(api, block.hash)
  const extendedHeader = await api.derive.chain.getHeader(block.hash) as HeaderExtended
  block.timestamp = new Date(currentBlockTimestamp)
  block.blocktime = (currentBlockTimestamp - lastBlockTimestamp)
  const [account] = await Account.findOrCreate({ where: { key: extendedHeader.author.toHuman() } })
  block.validatorId = account.id
  //console.log(extendedHeader.author.toHuman())
  block.save()

  //processEvents(api, id, block.hash)
  await importEraAtBlock(api, id, block.hash)

  return block
}

const addValidatorStats = async (
  api: Api,
  eraId: number,
  validator: string,
  blockHash: string,
  points: Map<string, number>
) => {

  const [account] = await Account.findOrCreate({ where: { key: validator } })
  let stats = await ValidatorStats.findByAccountAndEra(account.id, eraId)
  if(!stats) {
    stats = new ValidatorStats()
  }
  stats.eraId = eraId
  stats.accountId = account.id
  const {total, own} = await api.query.staking.erasStakers.at(blockHash, eraId, validator)
  stats.stake_own = own
  stats.stake_total = total
  for(const [key, value] of points.entries()) {
    if(key == validator) {
      stats.points = value
    }
  }
  //TODO reward?
  stats.commission = (await api.query.staking.erasValidatorPrefs.at(blockHash, eraId, validator)).commission
  stats.commission /= 10000000
  stats.save()
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


const importEraAtBlock = async (api: Api, blockId: number, hash: string) => {
  const id = await getEraAtHash(api, hash)
  const [era] = await Era.findOrCreate({ where: { id } })
  era.addBlock(blockId)
  if (era.active) return

  processing = `era ${id}`
  try {
    const snapshot = await api.query.staking.snapshotValidators.at(hash);
    if (snapshot.isEmpty) return
    console.log(`[Joystream] Found validator info for era ${id}`)

    const {total, individual} = await api.query.staking.erasRewardPoints.at(hash, id)

    const validators = snapshot.unwrap() as Vec<AccountId>;
    for (let validator of validators) {
      await addValidatorStats(api, id, validator.toHuman(), hash, individual);
    }

    const validatorCount = validators.length
    era.slots = (await api.query.staking.validatorCount.at(hash)).toNumber()
    era.active = Math.min(era.slots, validatorCount)
    era.waiting = validatorCount > era.slots ? validatorCount - era.slots : 0
    era.stake = await api.query.staking.erasTotalStake.at(hash, id)
    era.eraPoints = total

    let noms = 0
    for (let validator of validators) {
      const nom = await api.query.staking.erasStakers.at(hash, id, validator)
      if(nom.total) {
        noms += 1;
      }
    }

    era.nominatorz = noms
    era.validatorz = validatorCount
    const chainTimestamp = (await api.query.timestamp.now.at(hash)) as Moment
    era.timestamp = moment(chainTimestamp.toNumber())
    // era.update({ slots, active, waiting, stake, timestamp })
    era.blockId = id
    era.save()
  } catch (e) {
    console.error(`import era ${blockId} ${hash}`, e)
  }
}


module.exports = { addBlock, addBlockRange, processNext }
