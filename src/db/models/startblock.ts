import db from '../db'
import { DataTypes } from 'sequelize'

const StartBlock = db.define('start_block', {
  block: DataTypes.INTEGER,
})

export default StartBlock
