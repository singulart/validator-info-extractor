import db from '../db'
import { DataTypes } from 'sequelize'

const Category = db.define('category', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
  },
  createdAt: DataTypes.INTEGER,
  title: DataTypes.TEXT,
  description: DataTypes.TEXT,
  position: DataTypes.INTEGER,
  deleted: DataTypes.BOOLEAN,
  archived: DataTypes.BOOLEAN,
})

Category.findAllWithIncludes = function () {
  return this.findAll({
    include: [
      {
        model: db.models.thread,
        include: [
          { model: db.models.post, include: [{ association: 'author' }] },
          { association: 'creator' },
        ],
      },
      {
        model: db.models.moderation,
        //include: [{ association: 'moderator', attributes: ['handle'] }],
      },
    ],
  })
}

Category.findByIdWithIncludes = function (id: number, args?: { where: any }) {
  return this.findByPk(id, {
    ...args,
    include: [
      {
        model: db.models.thread,
        include: [
          { model: db.models.post, include: [{ association: 'author' }] },
          { association: 'creator' },
        ],
      },
      {
        model: db.models.moderation,
        //include: [{ association: 'moderator', attributes: ['handle'] }],
      },
    ],
  })
}

Category.findWithIncludes = function (args?: { where: any }) {
  return this.findAll({
    ...args,
    include: [
      {
        model: db.models.thread,
        include: [
          { model: db.models.post, include: [{ association: 'author' }] },
          { association: 'creator' },
        ],
      },
      {
        model: db.models.moderation,
        //include: [{ association: 'moderator', attributes: ['handle'] }],
      },
    ],
  })
}

export default Category
