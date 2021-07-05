import db from '../db'
import { DataTypes } from 'sequelize'

const Post = db.define('post', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
  },
  text: DataTypes.TEXT,
  createdAt: DataTypes.INTEGER,
})

Post.findAllWithIncludes = function () {
  return this.findAll({
    include: [
      { model: db.models.thread, include: [{ model: db.models.category }] },
      { association: 'author' },
      { association: 'moderator' },
    ],
  })
}

Post.findByIdWithIncludes = function (id: number, args?: { where: any }) {
  return this.findByPk(id, {
    ...args,
    include: [
      { model: db.models.thread, include: [{ model: db.models.category }] },
      { association: 'moderator' },
    ],
  })
}

Post.findWithIncludes = function (args: { where: any }) {
  return this.findAll({
    ...args,
    include: [
      { model: db.models.thread, include: [{ model: db.models.category }] },
      { model: db.models.thread },
      { association: 'moderator' },
    ],
  })
}

export default Post
