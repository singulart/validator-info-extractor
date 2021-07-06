import { addBlockRange, processNext } from './joystream';
import { connectUpstream } from './joystream/ws';
import db from './db';

async function main () {
    const api = await connectUpstream();
    await db.sync({ force: true })

    const firstBlock:number = parseInt(process.env.START_BLOCK);
    const lastBlock:number = parseInt(process.env.END_BLOCK);

    await addBlockRange(api, firstBlock, lastBlock);

    processNext();
}  

main()
