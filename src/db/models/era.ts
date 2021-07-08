import db from '../db'
import { DataTypes, Model } from 'sequelize'

class Era extends Model {}

Era.init({
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
}, { modelName: 'era', sequelize: db })

export default Era
