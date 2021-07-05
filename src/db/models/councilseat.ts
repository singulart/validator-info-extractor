import db from '../db'
import { DataTypes } from 'sequelize'

const Seat = db.define('consul', {
  stake: DataTypes.INTEGER,
})

Seat.findAllWithIncludes = function () {
  return this.findAll({
    include: [
      { model: db.models.council },
      { model: db.models.member },
      {
        association: 'votes',
        include: [{ model: db.models.proposal, attributes: ['title'] }],
      },
      {
        association: 'voters',
        include: [{ model: db.models.member, attributes: ['handle'] }],
      },
    ],
  })
}

Seat.findByIdWithIncludes = function (id: number, args?: { where: any }) {
  return this.findByPk(id, {
    ...args,
    include: [
      { model: db.models.council },
      { model: db.models.member },
      {
        association: 'votes',
        include: [{ model: db.models.proposal, attributes: ['title'] }],
      },
      {
        association: 'voters',
        include: [{ model: db.models.member, attributes: ['handle'] }],
      },
    ],
  })
}

Seat.findWithIncludes = function (args: { where: any }) {
  return this.findAll({
    ...args,
    include: [
      { model: db.models.council },
      { model: db.models.member },
      {
        association: 'votes',
        include: [{ model: db.models.proposal, attributes: ['title'] }],
      },
      {
        association: 'voters',
        include: [{ model: db.models.member, attributes: ['handle'] }],
      },
    ],
  })
}

export default Seat
