import db from '../db'
import { DataTypes } from 'sequelize'

const Moderation = db.define('moderation', {
  created: DataTypes.INTEGER,
  createdAt: DataTypes.DATE,
  rationale: DataTypes.TEXT,
})

Moderation.findAllWithIncludes = function () {
  return this.findAll({
    include: [
      { model: db.models.category },
      { model: db.models.post, include: [{ association: 'author' }] },
      { association: 'creator' },
      { association: 'moderator' },
    ],
  })
}

Moderation.findByIdWithIncludes = function (id: number, args?: { where: any }) {
  return this.findByPk(id, {
    ...args,
    include: [
      { model: db.models.category },
      { model: db.models.post, include: [{ association: 'author' }] },
      { association: 'creator' },
      { association: 'moderator' },
    ],
  })
}

Moderation.findWithIncludes = function (args?: { where: any }) {
  return this.findAll({
    ...args,
    include: [
      { model: db.models.category },
      { model: db.models.post, include: [{ association: 'author' }] },
      { association: 'creator' },
      { association: 'moderator' },
    ],
  })
}

export default Moderation
