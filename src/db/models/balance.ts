import db from '../db'
import { DataTypes } from 'sequelize'

const Balance = db.define('balance', {
  available: DataTypes.INTEGER,  
  locked: DataTypes.INTEGER,
  frozen: DataTypes.INTEGER,
  //fee: DataTypes.INTEGER,
})

export default Balance
