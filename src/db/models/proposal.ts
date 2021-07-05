import db from '../db'
import { DataTypes } from 'sequelize'

const Proposal = db.define('proposal', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
  },
  createdAt: DataTypes.INTEGER,
  finalizedAt: DataTypes.INTEGER,
  title: DataTypes.STRING,
  type: DataTypes.STRING,
  stage: DataTypes.STRING,
  result: DataTypes.STRING,
  executed: DataTypes.STRING,
  parameters: DataTypes.STRING,
  description: DataTypes.TEXT,
})

Proposal.findAllWithIncludes = function () {
  return this.findAll({
    include: [
      { association: 'author', attributes: ['handle'] },
      {
        association: 'posts',
        include: [{ association: 'author', attributes: ['handle'] }],
      },
      {
        association: 'votes',
        attributes: ['id', 'vote'],
        include: [{ model: db.models.member, attributes: ['id', 'handle'] }],
      },
    ],
  })
}

Proposal.findByIdWithIncludes = function (id: number, args?: { where: any }) {
  return this.findByPk(id, {
    ...args,
    include: [
      { association: 'author', attributes: ['handle'] },
      {
        association: 'posts',
        include: [{ association: 'author', attributes: ['handle'] }],
      },
      {
        association: 'votes',
        attributes: ['id', 'vote'],
        include: [{ model: db.models.member, attributes: ['id', 'handle'] }],
      },
    ],
  })
}

Proposal.findWithIncludes = function (args: { where: any }) {
  return this.findAll({
    ...args,
    include: [
      { association: 'author', attributes: ['handle'] },
      {
        association: 'posts',
        include: [{ association: 'author', attributes: ['handle'] }],
      },
      {
        association: 'votes',
        attributes: ['id', 'vote'],
        include: [{ association: 'author', attributes: ['id', 'handle'] }],
      },
    ],
  })
}

export default Proposal
