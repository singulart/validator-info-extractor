import db from '../db'
import { DataTypes } from 'sequelize'

const Era = db.define('era', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
  },
  waiting: DataTypes.INTEGER,
  active: DataTypes.INTEGER,
  slots: DataTypes.INTEGER,
  timestamp: DataTypes.DATE,
  stake: DataTypes.DECIMAL,
  eraPoints: DataTypes.DECIMAL,
  validatorz: DataTypes.INTEGER,
  nominatorz: DataTypes.INTEGER,
})

export default Era
