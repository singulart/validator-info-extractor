import db from '../db'
import { DataTypes, Op, Model } from 'sequelize'

class ValidatorStats extends Model {}

ValidatorStats.init({
  accountId: DataTypes.INTEGER,
  eraId: DataTypes.INTEGER,
  stake_total: DataTypes.DECIMAL,
  stake_own: DataTypes.DECIMAL,
  points: DataTypes.INTEGER,
  rewards: DataTypes.DECIMAL,
  commission: DataTypes.DECIMAL
},
 
{modelName: 'validator_stats', sequelize: db, indexes: [
  {
    unique: true,
    fields: ['accountId', 'eraId']
  }
 ]
})


export const findByAccountAndEra = (account: number, era: number): Promise<ValidatorStats> => {
  return ValidatorStats.findOne( 
    { 
      where: {
        accountId: { [Op.eq]: account },
        eraId: { [Op.eq]: era }
      }
  })
}

export default ValidatorStats
