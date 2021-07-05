import db from '../db'
import { DataTypes } from 'sequelize'

const Channel = db.define('channel', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
  },
  createdAt: DataTypes.INTEGER,
  handle: DataTypes.STRING,
  title: DataTypes.STRING,
  description: DataTypes.TEXT,
  avatar: DataTypes.TEXT,
  banner: DataTypes.TEXT,
  content: DataTypes.STRING,
  curation: DataTypes.STRING,
  principal: DataTypes.INTEGER,
  publicationStatus: DataTypes.BOOLEAN,
})

export default Channel
