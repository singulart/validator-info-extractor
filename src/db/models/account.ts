import db from '../db'
import { DataTypes } from 'sequelize'

const Account = db.define('account', {
  key: {
    type: DataTypes.STRING,
    primaryKey: true,
  },
  format: DataTypes.STRING,
  about: DataTypes.TEXT,
})

Account.findAllWithIncludes = function () {
  return this.findAll({
    include: [
      { association: 'validated', attributes: ['id', 'timestamp'] },
      { model: db.models.member, attributes: ['handle'] },
    ],
  })
}

Account.findByIdWithIncludes = function (id: number) {
  return this.findByPk(id, {
    include: [
      { association: 'validated', attributes: ['id', 'timestamp'] },
      { model: db.models.member, attributes: ['handle'] },
    ],
  })
}

Account.findWithIncludes = function (args: { where: any }) {
  return this.findAll({
    ...args,
    include: [
      { association: 'validated', attributes: ['id', 'timestamp'] },
      { model: db.models.member, attributes: ['handle'] },
    ],
  })
}

export default Account
