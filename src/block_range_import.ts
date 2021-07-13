import { addBlockRange, processNext } from './joystream';
import { connectUpstream } from './joystream/ws';
import {findLastProcessedBlockId} from './db/models/block'
  
async function main () {
    const api = await connectUpstream();

    console.log(`[Joystream] Importing block range [${process.env.START_BLOCK} - ${process.env.END_BLOCK}] started`);

    const firstBlock:number = parseInt(process.env.START_BLOCK);
    const lastBlock:number = parseInt(process.env.END_BLOCK);
    
    const lastImportedBlockHeight = await findLastProcessedBlockId(firstBlock, lastBlock);
    if (lastImportedBlockHeight && lastImportedBlockHeight > 0 && lastImportedBlockHeight < lastBlock) {
        console.log(`[Joystream] Found last imported block ${lastImportedBlockHeight}. Resuming processing from the next one`);
        await addBlockRange(api, lastImportedBlockHeight + 1, lastBlock);
    } else {
        await addBlockRange(api, firstBlock, lastBlock);
    }
    
    processNext();
}  

main()
