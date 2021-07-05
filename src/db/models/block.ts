import db from '../db'
import { DataTypes } from 'sequelize'

const Block = db.define('block', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
  },
  hash: DataTypes.STRING,
  timestamp: DataTypes.DATE,
  blocktime: DataTypes.INTEGER,
})

Block.findAllWithIncludes = function () {
  return this.findAll({
    include: [
      { model: db.models.era },
      { model: db.models.event },
      { association: 'validator' },
    ],
  })
}

Block.findByIdWithIncludes = function (id: number) {
  return this.findByPk(id, {
    include: [
      { model: db.models.era },
      { model: db.models.event },
      { association: 'validator' },
    ],
  })
}

Block.findWithIncludes = function (args: { where: any }) {
  return this.findAll({
    ...args,
    include: [
      { model: db.models.era },
      { model: db.models.event },
      { association: 'validator' },
    ],
  })
}

export default Block
