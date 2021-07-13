export const validatorStats = (address: string, startBlock = -1, endBlock = -1, startTime = -1, endTime = -1, page = 1): string => 
`select 
	vs."eraId", 
    stake_total as "stakeTotal", 
    stake_own as "stakeOwn", 
    points, 
    rewards, 
    commission, 
    subq2.blocks_cnt as "blocksCount"
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
	inner join accounts a on a.id = b."validatorId" ${address != '' ? `and b."validatorId" = (select id from accounts where key = '${address}')` : ''}
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
        where ${startBlock > 0 ? `blocks.id >= ${startBlock} and blocks.id <= ${endBlock}` : '1 = 1'} 
        ${startTime > 0 ? `blocks.timestamp >= ${startTime} and blocks.timestamp <= ${endTime}` : ''} group by blocks."eraId") subq
        ) 
order by "eraId" limit 50 offset ${50 * (page - 1)}`

export interface IValidatorReport {
    nextPage: boolean,
    startBlock: number, 
    startEra: number, 
    endBlock: number,
    endEra: number,
    startTime: number,
    endTime: number,
    totalCount: number,
    report: IReport[]
}

export interface IReport {
    eraId: number,
    stakeTotal: number,
    stakeOwn: number,
    points: number,
    rewards: number,
    commission: number,
    blocksCount: number
}