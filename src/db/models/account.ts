import db from '../db'

import { DataTypes, Model } from 'sequelize'

const Account = db.define('account', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  key: DataTypes.STRING,
  format: DataTypes.STRING,
  about: DataTypes.TEXT,
})

export default Account
