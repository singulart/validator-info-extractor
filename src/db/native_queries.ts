import {Moment} from 'moment'
export const pageSize = 50

export const validatorStats = (address: string, startBlock = -1, endBlock = -1, startTime: Moment, endTime: Moment, page = 1, countQuery = false): string => 
`select 
	${countQuery ? ' count(vs."eraId")::integer as "totalCount" ' : ` vs."eraId" as id, 
    stake_total as "stakeTotal", 
    stake_own as "stakeOwn", 
    points, 
    rewards, 
    commission, 
    subq2.blocks_cnt as "blocksCount" `}
from 
	validator_stats vs 
inner join 
	accounts a on a.id = vs."accountId" 
inner join 
	(select 
		"eraId", count(b.id) blocks_cnt 
	from 
		eras e 
	join 
		blocks b on b."eraId" = e.id 
	inner join accounts a on a.id = b."validatorId" ${address != '' ? ` and b."validatorId" = (select id from accounts where key = '${address}') ` : ''}
	    and e.id = "eraId" group by "eraId") subq2 
	on 
		subq2."eraId" = vs."eraId" 
where ${address != '' ? `a.key = '${address}' and ` : ''}
	vs."eraId" in 
	(select 
        subq.era 
    from 
        (select 
            distinct("eraId") era, 
            min(id) start_height, 
            min(timestamp) start_time, 
            max(id) end_height, 
            max(timestamp) end_time, 
            (max(id) - min(id)) as era_blocks 
        from blocks 
        where ${startBlock > 0 ? ` blocks.id >= ${startBlock} and blocks.id <= ${endBlock} ` : '1 = 1'} 
        ${startTime ? ` AND blocks.timestamp >= '${startTime.toISOString()}'::date and blocks.timestamp <= '${endTime.toISOString()}'::date ` : ''} group by blocks."eraId") subq
        ) ${countQuery ? '' : ` order by id limit 50 offset ${pageSize * (page - 1)} `}`


export const countTotalBlocksProduced = (address: string, startBlock = -1, endBlock = -1, startTime: Moment = null, endTime: Moment = null) => 

`SELECT sum(totalBlocks.blocks_cnt) as "totalBlocks"
FROM
  (SELECT distinct(e.id) era,
          count(b.id) blocks_cnt
   FROM eras e
   JOIN blocks b ON b."eraId" = e.id
   INNER JOIN accounts a ON a.id = b."validatorId"
   WHERE ${address != '' ? `a.key = '${address}' 
     AND ` : ''} ${startBlock > 0 ? ` b.id >= ${startBlock} AND b.id <= ${endBlock} ` : ' 1=1 '} 
     ${startTime ? ` AND b.timestamp >= '${startTime.toISOString()}'::date AND b.timestamp <= '${endTime.toISOString()}'::date ` : ' AND 1=1 '}
   GROUP BY e.id) totalBlocks`

export const findBlockByTime = (timeMoment: Moment) => 
`SELECT b.*
FROM blocks b
ORDER BY (ABS(EXTRACT(epoch
    FROM (b.timestamp - '${timeMoment.toISOString()}'::date))))
LIMIT 1`

export const findFirstAuthoredBlock = (blockIdStart: number, blockIdEnd: number, addr: string) => 
`SELECT b.*
FROM blocks b
INNER JOIN accounts a ON a.id = b."validatorId" AND a.key = '${addr}' 
WHERE b.id >= ${blockIdStart} AND b.id <= ${blockIdEnd}
ORDER BY b.id
LIMIT 1`

export const findLastAuthoredBlock = (blockIdStart: number, blockIdEnd: number, addr: string) => 
`SELECT b.*
FROM blocks b
INNER JOIN accounts a ON a.id = b."validatorId" AND a.key = '${addr}' 
WHERE b.id >= ${blockIdStart} AND b.id <= ${blockIdEnd}
ORDER BY b.id DESC
LIMIT 1`

export interface IValidatorReport {
    startBlock: number, 
    startEra: number, 
    endBlock: number,
    endEra: number,
    startTime: number,
    endTime: number,
    totalBlocks: number,
    totalCount: number,
    pageSize: number,
    report: IValidatorEraStats[]
}

export interface IValidatorEraStats {
    id: number,
    stakeTotal: number,
    stakeOwn: number,
    points: number,
    rewards: number,
    commission: number,
    blocksCount: number
}

export interface ITotalCount {
    totalCount: number
}

export interface ITotalBlockCount {
    totalBlocks: number
}