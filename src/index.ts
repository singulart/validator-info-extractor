import { WsProvider, ApiPromise } from "@polkadot/api";
import { types } from "@joystream/types";
import socketio from 'socket.io';
import setupSocket from './socket';

// import { BlocksFound, Eras, blocksFound, eraStats } from "./validators"
import { addBlockRange, processNext } from './joystream';
import { connectUpstream } from './joystream/ws';
import db from './db';

async function main () {
    // const provider = new WsProvider('wss://rome-rpc-endpoint.joystream.org:9944');
    // register types before creating the api
    const api = await connectUpstream();
    // await api.isReady;
    // const io: any = socketio(api);
    // setupSocket(io, api);

    await db.sync({ force: true })


    await addBlockRange(api, 717988, 1000000);
    processNext();


    // const firstBlock:number = 1073741
    // const lastBlock = 1276285
    // let era = 807
    // const eraStatsNew: Eras[] = eraStats
    // const authors: string[] = []
    // for (let i = 0; i<blocksFound.length; i++) {
    //     authors.push(blocksFound[i].author)
    // }
    // const blocksFoundNew:BlocksFound[] = blocksFound


    // for (let blockHeight=firstBlock; blockHeight<lastBlock; blockHeight+=1) {
    //     let hash = await api.rpc.chain.getBlockHash(blockHeight)
    //     let newEra = Number((await api.query.staking.activeEra.at(hash)).unwrap().index.toBigInt())
    //     if (newEra > era) {
    //         console.log(era)
    //         const eraPoints = await api.query.staking.erasRewardPoints.at(hash,era)
    //         const timestampStarted = eraStatsNew[eraStatsNew.length-1].timestampEnded
    //         const startHeight = eraStatsNew[eraStatsNew.length-1].endHeight
    //         const timestampEnded = Number((await api.query.staking.activeEra.at(hash)).unwrap().start.unwrap().toBigInt())
    //         eraStatsNew.push({
    //             eraNumber: era,
    //             startHeight,
    //             endHeight: blockHeight,
    //             timestampStarted,
    //             timestampEnded,
    //             totalPoints: Number(eraPoints.total.toBigInt())
    //         })
    //         const individualPoints = eraPoints.individual
    //         individualPoints.forEach((points,author) => {
    //             const index = authors.indexOf(author.toString())
    //             if (index != -1) {
    //                 blocksFoundNew[index].activeEras.push(era)
    //                 blocksFoundNew[index].eraPoints += Number(points.toBigInt())
    //             } else {
    //                 authors.push(author.toString())
    //                 blocksFoundNew.push({
    //                     author: author.toString(),
    //                     activeEras: [era],
    //                     eraPoints: Number(points.toBigInt())
    //                 })
    //             }
    //         });
    //         era = newEra
    //     }
    //     //lastHash = hash
    // }
    // console.log("blocksFoundNew = ",JSON.stringify(blocksFoundNew, null, 4))
    // console.log("eraStatsNew = ",JSON.stringify(eraStatsNew, null, 4))
    // api.disconnect()
}  

main()
