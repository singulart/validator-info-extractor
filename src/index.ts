import { addBlockRange, processNext, addBlock } from './joystream';
import { connectUpstream } from './joystream/ws';
import db from './db';
import {
    Block,
    StartBlock
} from './db/models'
import {findLastProcessedBlockId} from './db/models/block'
import { Header } from './types'
  
async function main () {
    const api = await connectUpstream();
    
    if(parseInt(process.env.ERASE_DB)) {
        console.log('DB cleanup');
        await db.sync({ force: true })
    }

    let lastHeader: Header = { number: 0, timestamp: 0, author: '' }
    let firstProcessedBlockLogged = false
    if(parseInt(process.env.NEW_HEADS)) {
        StartBlock.destroy({where: {}})
        api.derive.chain.subscribeNewHeads(async (header: Header) => {
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
            await addBlockRange(api, lastBlock + 1, id - 1); // fills the gap
        }
      })
    }
    
    console.log(`Will work on range ${process.env.START_BLOCK} - ${process.env.END_BLOCK}.`);

    const firstBlock:number = parseInt(process.env.START_BLOCK);
    const lastBlock:number = parseInt(process.env.END_BLOCK);
    
    const lastImportedBlockHeight = await findLastProcessedBlockId(firstBlock, lastBlock);
    if (lastImportedBlockHeight && lastImportedBlockHeight > 0 && lastImportedBlockHeight < lastBlock) {
        console.log(`[Joystream] Found last imported block ${lastImportedBlockHeight}. Resuming processing from the next one`);
        await addBlockRange(api, lastImportedBlockHeight + 1, lastBlock);
    } else {
        console.log(`[Joystream] No imported block found within given range ${firstBlock} - ${lastBlock}.`);
        await addBlockRange(api, firstBlock, lastBlock);
    }
    
    processNext();
}  

main()
