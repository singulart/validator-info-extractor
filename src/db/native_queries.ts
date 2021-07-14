export const pageSize = 50

export const validatorStats = (address: string, startBlock = -1, endBlock = -1, startTime = -1, endTime = -1, page = 1, countQuery = false): string => 
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
        ${startTime > 0 ? ` blocks.timestamp >= ${startTime} and blocks.timestamp <= ${endTime} ` : ''} group by blocks."eraId") subq
        ) ${countQuery ? '' : ` order by id limit 50 offset ${pageSize * (page - 1)} `}`


export const countTotalBlocksProduced = (address: string, startBlock = -1, endBlock = -1, startTime = -1, endTime = -1) => 

`SELECT sum(totalBlocks.blocks_cnt) as "totalBlocks"
FROM
  (SELECT distinct(e.id) era,
          count(b.id) blocks_cnt
   FROM eras e
   JOIN blocks b ON b."eraId" = e.id
   INNER JOIN accounts a ON a.id = b."validatorId"
   WHERE ${address != '' ? `a.key = '${address}' 
     AND ` : ''} ${startBlock > 0 ? ` b.id >= ${startBlock} AND b.id <= ${endBlock} ` : ' 1=1 '} 
     ${startTime > 0 ? ` b.timestamp >= ${startTime} AND b.timestamp <= ${endTime} ` : ' AND 1=1 '}
   GROUP BY e.id) totalBlocks`

export const findBlockByTime = (timestamp: string) => 
`SELECT b.*,
    b.timestamp,
    ABS(EXTRACT(epoch
                FROM (b.timestamp - '${timestamp}'::TIMESTAMP))) timediff
FROM blocks b
ORDER BY timediff
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

export interface IBlockTime {
    id: number
}