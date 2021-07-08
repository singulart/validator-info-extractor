import db from '../db'
import { DataTypes, Model } from 'sequelize'

class Event extends Model {}

Event.init({
  available: DataTypes.INTEGER,  
  locked: DataTypes.INTEGER,
  frozen: DataTypes.INTEGER,
}, { modelName: 'balance', sequelize: db })

export default Event
