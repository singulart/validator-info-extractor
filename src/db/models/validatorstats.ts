import db from '../db'
import { DataTypes } from 'sequelize'

const ValidatorStats = db.define('validator_stats', {
  accountId: DataTypes.INTEGER,
  eraId: DataTypes.INTEGER,
  stake_own: DataTypes.DECIMAL,
  stake_other: DataTypes.DECIMAL,
  points: DataTypes.INTEGER,
  rewards: DataTypes.DECIMAL,
  commission: DataTypes.DECIMAL
})

export default ValidatorStats
