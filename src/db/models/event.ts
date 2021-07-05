import db from '../db'
import { DataTypes } from 'sequelize'

const Event = db.define('event', {
  section: DataTypes.STRING,
  method: DataTypes.STRING,
  data: DataTypes.TEXT,
})

Event.findAllWithIncludes = function () {
  return this.findAll({
    include: [
      { model: db.models.block, include: [{ association: 'validator' }] },
    ],
  })
}

Event.findByIdWithIncludes = function (id: number, args?: { where: any }) {
  return this.findByPk(id, {
    ...args,
    include: [
      { model: db.models.block, include: [{ association: 'validator' }] },
    ],
  })
}

Event.findWithIncludes = function (args?: { where: any }) {
  return this.findAll({
    ...args,
    include: [
      { model: db.models.block, include: [{ association: 'validator' }] },
    ],
  })
}

export default Event
