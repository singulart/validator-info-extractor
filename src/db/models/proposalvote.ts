import db from '../db'
import { DataTypes } from 'sequelize'

const ProposalVote = db.define('proposalvote', {
  vote: DataTypes.STRING,
})

ProposalVote.findAllWithIncludes = function () {
  return this.findAll({
    include: [
      { model: db.models.member, attributes: ['handle'] },
      { model: db.models.consul },
      { model: db.models.proposal, attributes: ['title'] },
    ],
  })
}

ProposalVote.findByIdWithIncludes = function (
  id: number,
  args?: { where: any }
) {
  return this.findByPk(id, {
    ...args,
    include: [
      { model: db.models.member, attributes: ['handle'] },
      { model: db.models.consul },
      { model: db.models.proposal, attributes: ['title'] },
    ],
  })
}

ProposalVote.findWithIncludes = function (args: { where: any }) {
  return this.findAll({
    ...args,
    include: [
      { model: db.models.member, attributes: ['handle'] },
      { model: db.models.consul },
      { model: db.models.proposal, attributes: ['title'] },
    ],
  })
}

export default ProposalVote
