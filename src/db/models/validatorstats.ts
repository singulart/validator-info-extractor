import db from '../db'
import { DataTypes, Op } from 'sequelize'

const ValidatorStats = db.define('validator_stats', {
  accountId: DataTypes.INTEGER,
  eraId: DataTypes.INTEGER,
  stake_total: DataTypes.DECIMAL,
  stake_own: DataTypes.DECIMAL,
  points: DataTypes.INTEGER,
  rewards: DataTypes.DECIMAL,
  commission: DataTypes.DECIMAL
})


export const findByAccountAndEra = (account: number, era: number) => {
  return ValidatorStats.findOne( 
    { 
      where: {
        accountId: { [Op.eq]: account },
        eraId: { [Op.eq]: era }
      }
  })
}

export default ValidatorStats
