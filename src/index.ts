import { addBlockRange, processNext } from './joystream';
import { connectUpstream } from './joystream/ws';
import db from './db';
import {
    Block
} from './db/models'
  
async function main () {
    const api = await connectUpstream();
    
    if(parseInt(process.env.ERASE_DB)) {
        console.log('DB cleanup');
        await db.sync({ force: true })
    }
    
    console.log(`Will work on range ${process.env.START_BLOCK} - ${process.env.END_BLOCK}.`);

    const firstBlock:number = parseInt(process.env.START_BLOCK);
    const lastBlock:number = parseInt(process.env.END_BLOCK);
    
    const lastImportedBlockHeight = await Block.findLastProcessedBlockId(firstBlock, lastBlock);
    if (lastImportedBlockHeight && parseInt(lastImportedBlockHeight) > 0 && parseInt(lastImportedBlockHeight) < lastBlock) {
        console.log(`Found last imported block ${lastImportedBlockHeight}. Resuming processing from the next one`);
        await addBlockRange(api, lastImportedBlockHeight + 1, lastBlock);
    } else {
        console.log(`No imported block found within given range ${firstBlock} - ${lastBlock}.`);
        await addBlockRange(api, firstBlock, lastBlock);
    }
    processNext();
}  

main()
