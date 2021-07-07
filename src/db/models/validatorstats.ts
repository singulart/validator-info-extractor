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


ValidatorStats.findByAccountAndEra = function (account: number, era: number) {
  return this.findOne( 
    { 
      where: {
        accountId: { [Op.eq]: account },
        eraId: { [Op.eq]: era }
      }
  })
}

export default ValidatorStats
