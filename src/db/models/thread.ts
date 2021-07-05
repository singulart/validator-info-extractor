import db from '../db'
import { DataTypes } from 'sequelize'

const Thread = db.define('thread', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
  },
  createdAt: DataTypes.INTEGER,
  title: DataTypes.TEXT,
  nrInCategory: DataTypes.INTEGER,
})

Thread.findAllWithIncludes = function () {
  return this.findAll({
    include: [
      { model: db.models.category },
      { model: db.models.post, include: [{ association: 'author' }] },
      { association: 'creator' },
      {
        model: db.models.moderation,
        //include: [{ association: 'moderator', attributes: ['handle'] }],
      },
    ],
  })
}

Thread.findByIdWithIncludes = function (id: number, args?: { where: any }) {
  return this.findByPk(id, {
    ...args,
    include: [
      { model: db.models.category },
      { model: db.models.post, include: [{ association: 'author' }] },
      { association: 'creator' },
      {
        model: db.models.moderation,
        //include: [{ association: 'moderator', attributes: ['handle'] }],
      },
    ],
  })
}

Thread.findWithIncludes = function (args?: { where: any }) {
  return this.findAll({
    ...args,
    include: [
      { model: db.models.category },
      { model: db.models.post, include: [{ association: 'author' }] },
      { association: 'creator' },
      {
        model: db.models.moderation,
        //include: [{ association: 'moderator', attributes: ['handle'] }],
      },
    ],
  })
}

export default Thread
