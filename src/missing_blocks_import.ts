import { connectUpstream } from './joystream/ws';
import db from './db'
import { Header } from './types'
import {missingBlocks} from './db/native_queries'
import { addBlockToQueue, processNext } from './joystream';


async function main () {

    const api = await connectUpstream()

    let lastBlock = 1
    let processing = false

    const unsubscribe = api.rpc.chain.subscribeNewHeads((header: Header) => {
        lastBlock = +header.number
    })


    setTimeout(() => {
        unsubscribe.then( () => {
            console.log('Unsubscribed');
            if(!processing) {
                processing = true
                console.log(`Current height is ${lastBlock}`)
            
                db.query(missingBlocks(lastBlock)).then( (missing) => {
                    console.log(`Detected ${missing[0].length} missing blocks`)
                    missing[0].map( (block: any) => {
                        addBlockToQueue(api, block.m)
                    })
                    processNext()
                })  
            }
        })
    }, 1000)
}  

main()
