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

List of eras where validator was active (produced blocks)
 ```
 select distinct(b."eraId") from blocks b where b."validatorKey"='555555555555555555555555';
 ```

Eras starts and ends (blocks and time)
```
select distinct("eraId") era, min(id) start_height, min(timestamp) start_time, max(id) end_height, max(timestamp) end_time, (max(id) - min(id)) as era_blocks from blocks group by blocks."eraId";
 ```

Ordered list of blocks count produced by validators, per era
```
select distinct(e.id) era, b."validatorKey" account, count(b.id) blocks_cnt from eras e join blocks b on b."eraId" = e.id  group by e.id, account order by blocks_cnt desc;
```

Same as above, but for one validator
```
select distinct(e.id) era, b."validatorKey" account, count(b.id) blocks_cnt from eras e join blocks b on b."eraId" = e.id  where b."validatorKey" = '555555555555555555555555' group by e.id, account order by blocks_cnt desc;
```