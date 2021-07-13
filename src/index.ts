import { addBlock } from './joystream'
import { connectUpstream } from './joystream/ws'
import express from 'express'
import ascii from './ascii'

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

