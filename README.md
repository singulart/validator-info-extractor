# Validator Info Extractor

Example of how to extract info about eras and validators from the chain state  

 ## Setup
 ```
 yarn && yarn build
 ```

 ## Usage
 ```
node lib/index.js 
 ```

 ## Queries

List of eras where validator was active
 ```
select a.key, "eraId", stake_total, stake_own, points, rewards, commission from validator_stats vs inner join accounts a on a.id = vs."accountId" where a.key = '44444444444444444444444444444' order by "eraId";
 ```

Eras starts and ends (blocks and time)
```
select distinct("eraId") era, min(id) start_height, min(timestamp) start_time, max(id) end_height, max(timestamp) end_time, (max(id) - min(id)) as era_blocks from blocks group by blocks."eraId";
 ```

Ordered list of blocks count produced by validators, per era
```
select distinct(e.id) era, a.key account, count(b.id) blocks_cnt from eras e  join blocks b on b."eraId" = e.id inner join accounts a on a.id = b."validatorId" group by e.id, account order by blocks_cnt desc;
```

Same as above, but for one validator
```
select distinct(e.id) era, a.key account, count(b.id) blocks_cnt from eras e  join blocks b on b."eraId" = e.id inner join accounts a on a.id = b."validatorId" where a.key = '44444444444444444444444444444' group by e.id, account order by blocks_cnt desc;
```