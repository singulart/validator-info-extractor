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
  rewards: DataTypes.DECIMAL,
  validatorz: DataTypes.INTEGER,
  nominatorz: DataTypes.INTEGER,
})

Era.findAllWithIncludes = function () {
  return this.findAll({
    include: [
      {
        model: db.models.block,
        attributes: ['id', 'blocktime', 'timestamp'],
        include: [
          {
            association: 'validator',
            attributes: ['key'],
            include: [
              { model: db.models.member, attributes: ['id', 'handle'] },
            ],
          },
          { model: db.models.event },
        ],
      },
    ],
  })
}

Era.findByIdWithIncludes = function (id: number) {
  return this.findByPk(id, {
    include: [
      {
        model: db.models.block,
        attributes: ['id', 'blocktime', 'timestamp'],
        include: [
          {
            association: 'validator',
            attributes: ['key'],
            include: [
              { model: db.models.member, attributes: ['id', 'handle'] },
            ],
          },
          { model: db.models.event },
        ],
      },
    ],
  })
}

Era.findWithIncludes = function (args: { where: any }) {
  return this.findAll({
    ...args,
    include: [
      {
        model: db.models.block,
        attributes: ['id', 'blocktime', 'timestamp'],
        include: [
          {
            association: 'validator',
            attributes: ['key'],
            include: [
              { model: db.models.member, attributes: ['id', 'handle'] },
            ],
          },
          { model: db.models.event },
        ],
      },
    ],
  })
}

export default Era
