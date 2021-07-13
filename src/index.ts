import { addBlock } from './joystream'
import { connectUpstream } from './joystream/ws'
import express from 'express'
import ascii from './ascii'
import db from './db'
import { Sequelize } from 'sequelize'

import {
    Block,
    StartBlock
} from './db/models'
import { Header } from './types'

const PORT: number = process.env.PORT ? +process.env.PORT : 3500

const app = express()
const server = app.listen(PORT, () =>
  console.log(`[Express] Listening on port ${PORT}`, ascii)
)


;(async () => {
  
    const api = await connectUpstream()

    let lastHeader: Header = { number: 0, timestamp: 0, author: '' }
    let firstProcessedBlockLogged = false


    let highId = 0
    Block.max('id').then(
        (highestProcessedBlock: number) => {
            highId = highestProcessedBlock === undefined || isNaN(highestProcessedBlock) ? 0 : highestProcessedBlock
            StartBlock.destroy({where: {}})
            api.rpc.chain.subscribeNewHeads(async (header: Header) => {
                const id = +header.number
                if (id === +lastHeader.number)
                    return console.debug(
                        `[Joystream] Skipping duplicate block ${id} (TODO handleFork)`
                    )
                lastHeader = header
                await addBlock(api, header)
                if(!firstProcessedBlockLogged) {
                    StartBlock.create({block: id})
                    console.log(`[Joystream] Subscribed to new blocks starting from ${id}`)
                    firstProcessedBlockLogged = true
                }
            })
        }
    )
})()


app.use(express.json())
app.use(express.urlencoded({ extended: true }))

import {validatorStats, IValidatorReport, IReport} from './db/native_queries'
const ADDRESS_LENGTH = 48
app.get('/validator-report', async (req: any, res: any, next: any) => {
    try {
        const address = (req.query.addr && req.query.addr.length == ADDRESS_LENGTH) ? req.query.addr : ''
        const page = !isNaN(req.query.page) ? req.query.page : 1
        const startBlock = !isNaN(req.query.start_block) ? req.query.start_block : -1
        const endBlock = !isNaN(req.query.end_block) ? req.query.end_block : -1
        console.log(`Start block = ${startBlock}, end block = ${endBlock}`)
        if(startBlock > 0 && endBlock > 0 && endBlock > startBlock) {
            db.query(validatorStats(address, startBlock, endBlock, -1, -1, page)).then(async (p: any) => {
                const dbBlockStart = (await Block.findOne({where: {id: startBlock}}))?.get({plain: true})
                const dbBlockEnd = (await Block.findOne({where: {id: startBlock}}))?.get({plain: true})
                const validationReport: IValidatorReport = {
                    nextPage: true,
                    startBlock: startBlock,
                    endBlock: endBlock,
                    startTime: dbBlockStart.timestamp,
                    endTime: dbBlockEnd.timestamp,
                    startEra: dbBlockStart.eraId,
                    endEra: dbBlockEnd.eraId,
                    totalCount: 99999999999999,
                    report: p[0]
                }
                return res.json(validationReport)
            })
        } else {
            const startTime = (req.query.start_time && (typeof req.query.start_time) === 'number') ? req.query.start_time : -1
            const endTime = (req.query.end_time && (typeof req.query.end_time) === 'number') ? req.query.end_time : -1
            if(startTime > 0 && endTime > 0 && endTime > startTime) {
                db.query(validatorStats(address, -1, -1, startTime, endTime, page)).then((p: any) => res.json(p[0]))
            } else {
                const dbBlockStart = (await Block.findOne({order: Sequelize.literal('id ASC'), limit: 1, offset: 0}))?.get({plain: true})
                const dbBlockEnd = (await Block.findOne({order: Sequelize.literal('id DESC'), limit: 1, offset: 0}))?.get({plain: true}) 
                db.query(validatorStats(address, -1, -1, -1, -1, page)).then((p: any) => {
                    const validationReport: IValidatorReport = {
                        nextPage: true,
                        startBlock: dbBlockStart.id,
                        endBlock: dbBlockEnd.id,
                        startTime: dbBlockStart.timestamp,
                        endTime: dbBlockEnd.timestamp,
                        startEra: dbBlockStart.eraId,
                        endEra: dbBlockEnd.eraId,
                        totalCount: 99999999999999,
                        report: p[0]
                    }
                    return res.json(validationReport)
                })
              }
            }
    } catch (err) {
      return res.json({})
    }
  })
