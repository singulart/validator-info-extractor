import {
  Account,
  Block,
  Era,
  Event,
  ValidatorStats
} from '../db/models'
import { Op } from 'sequelize'

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
  BlockHash,
} from '@polkadot/types/interfaces'
import { Vec } from '@polkadot/types'
import { ApiPromise } from '@polkadot/api';


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

const getBlockHash = (api: ApiPromise, blockId: number) =>
  api.rpc.chain.getBlockHash(blockId).then((hash: BlockHash) => hash.toString())

const getEraAtHash = (api: ApiPromise, hash: string) =>
  api.query.staking.activeEra
    .at(hash)
    .then((era) => era.unwrap().index.toNumber())

const getEraAtBlock = async (api: ApiPromise, block: number) =>
  getEraAtHash(api, await getBlockHash(api, block))

const getTimestamp = async (api: ApiPromise, hash?: string) => {
  const timestamp = hash
    ? await api.query.timestamp.now.at(hash)
    : await api.query.timestamp.now()
  return moment.utc(timestamp.toNumber()).valueOf()
}

export const addBlock = async (
  api: ApiPromise,
  header: { number: number; author: string }
) => {
  const id = +header.number
  const exists = await Block.findByPk(id) 
  if (exists) {
    console.error(`TODO handle fork`, String(header.author))
  }

  await processBlock(api, id)
  
  // logging
  //const handle = await getHandleOrKey(api, key)
  const q = queue.length ? chalk.green(` [${queue.length}:${processing}]`) : ''
  console.log(`[Joystream] block ${id} ${q}`)
}

const processBlock = async (api: ApiPromise, id: number) => {

  const exists = (await Block.findByPk(id))
  if (exists) return exists.get({plain: true})

  processing = `block ${id}`
  console.log(processing)
  const last = (await Block.findByPk(id - 1))
  let lastBlockTimestamp;
  if (last) {
    lastBlockTimestamp = last.get({plain: true}).timestamp.getTime();
  } else {
    let lastBlockHash = await getBlockHash(api, id - 1);
    lastBlockTimestamp = await getTimestamp(api, lastBlockHash);
  }

  const hash = await getBlockHash(api, id)
  const currentBlockTimestamp = await getTimestamp(api, hash)
  const extendedHeader = await api.derive.chain.getHeader(hash) as HeaderExtended

  const eraId = await getEraAtHash(api, hash)
  const [era, created] = await Era.findOrCreate({ where: { id: eraId } })

  const block = Block.create({
    id: id, 
    hash: hash,
    timestamp: new Date(currentBlockTimestamp),
    blocktime: (currentBlockTimestamp - lastBlockTimestamp),
    eraId: era.get({plain: true}).id,
    validatorId: (await Account.findOrCreate({ where: { key: extendedHeader.author.toHuman() } }))[0].get({plain: true}).id
  }, {returning: true})

  await importEraAtBlock(api, id, hash, era)
  processEvents(api, id, eraId, hash)

  return block
}

const addValidatorStats = async (
  api: ApiPromise,
  eraId: number,
  validator: string,
  blockHash: string,
  points: Map<string, number>
) => {

  const accountModel = await Account.findOrCreate({ where: { key: validator } })
  const account = accountModel[0].get({plain: true})
  const {total, own} = await api.query.staking.erasStakers.at(blockHash, eraId, validator)
  let pointVal = 0;
  for(const [key, value] of points.entries()) {
    if(key == validator) {
      pointVal = value
      break
    }
  }
  ValidatorStats.upsert({
    eraId: eraId, 
    accountId: account.id, 
    stake_own: own, 
    stake_total: total, 
    points: pointVal,
    rewards: 0,
    commission: (await api.query.staking.erasValidatorPrefs.at(blockHash, eraId, validator)).commission.toNumber() / 10000000
  })
}

export const addBlockRange = async (
  api: ApiPromise,
  startBlock: number,
  endBlock: number
) => {
  for (let block = startBlock; block <= endBlock; block++) {
    queue.push(() => processBlock(api, block))
  }
}

const processEvents = async (api: ApiPromise, blockId: number, eraId: number, hash: string) => {
  processing = `events block ${blockId}`
  try {
    const blockEvents = await api.query.system.events.at(hash)
    blockEvents.forEach(({ event }: EventRecord) => {
      let { section, method, data } = event
      if(section == 'staking' && method == 'Reward') {
        Event.create({ blockId, section, method, data: JSON.stringify(data) })
        Account.findOne(
          {
            where: {
              key: data[0].toString()
            }
          }
        ).then((beneficiaryAccount: Account) => {
          if (beneficiaryAccount == null) {
            console.log(`Rewarded address ${data[0].toString()} is probably a nominator. Skipping it..`)
            return;
          }
          ValidatorStats.increment(
            {
              'rewards': Number(data[1])
            }, 
            {
              where: {
                [Op.and]: {eraId: eraId, accountId: beneficiaryAccount.get({plain: true}).id}
              }
            }
          )
        })
      }
    })
  } catch (e) {
    console.log(`failed to fetch events for block  ${blockId} ${hash}`)
  }
  // TODO catch votes, posts, proposals?
}


const importEraAtBlock = async (api: Api, blockId: number, hash: string, eraModel: Era) => {
  const era = eraModel.get({plain: true})
  if (era.active) return
  const id = era.id
  processing = `era ${id}`
  try {
    const snapshotValidators = await api.query.staking.snapshotValidators.at(hash);
    if (!snapshotValidators.isEmpty) {
      console.log(`[Joystream] Found validator info for era ${id}`)

      const {total, individual} = await api.query.staking.erasRewardPoints.at(hash, id)
  
      const validators = snapshotValidators.unwrap() as Vec<AccountId>;
      const validatorCount = validators.length
  
      for (let validator of validators) {
        await addValidatorStats(api, id, validator.toHuman(), hash, individual);
      }
  
  
      const slots = (await api.query.staking.validatorCount.at(hash)).toNumber()
      const chainTimestamp = (await api.query.timestamp.now.at(hash)) as Moment
      const chainTime = moment(chainTimestamp.toNumber())
  
      Era.upsert({
        id: id,
        slots: slots,
        allValidators: validatorCount,
        waitingValidators: validatorCount > slots ? validatorCount - slots : 0,
        stake: await api.query.staking.erasTotalStake.at(hash, id),
        eraPoints: total,
        timestamp: chainTime
      })  
    }

    const snapshotNominators = await api.query.staking.snapshotNominators.at(hash);
    if (!snapshotNominators.isEmpty) {
      const nominators = snapshotNominators.unwrap() as Vec<AccountId>;
      Era.upsert({
        id: id,
        nominators: nominators.length
      })  
    }
    return id;

  } catch (e) {
    console.error(`import era ${blockId} ${hash}`, e)
  }
}


module.exports = { addBlock, addBlockRange, processNext }
