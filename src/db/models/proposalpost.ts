import db from '../db'
import { DataTypes } from 'sequelize'

const ProposalPost = db.define('proposalpost', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
  },
  created: DataTypes.INTEGER,
  updated: DataTypes.INTEGER,
  edition: DataTypes.INTEGER,
  text: DataTypes.TEXT,
})

ProposalPost.findAllWithIncludes = function () {
  return this.findAll({
    include: [{ association: 'author', attributes: ['handle'] }],
  })
}

ProposalPost.findByIdWithIncludes = function (
  id: number,
  args?: { where: any }
) {
  return this.findByPk(id, {
    ...args,
    include: [{ association: 'author', attributes: ['handle'] }],
  })
}

ProposalPost.findWithIncludes = function (args: { where: any }) {
  return this.findAll({
    ...args,
    include: [{ association: 'author', attributes: ['handle'] }],
  })
}

export default ProposalPost
