import db from '../db'
import { DataTypes } from 'sequelize'

const Event = db.define('event', {
  section: DataTypes.STRING,
  method: DataTypes.STRING,
  data: DataTypes.TEXT,
})


export default Event
