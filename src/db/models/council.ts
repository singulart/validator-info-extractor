import db from '../db'
import { DataTypes } from 'sequelize'

const Council = db.define('council', {
  round: {
    type: DataTypes.INTEGER,
    primaryKey: true,
  },
  start: DataTypes.INTEGER,
  startDate: DataTypes.DATE,
  end: DataTypes.INTEGER,
  endDate: DataTypes.DATE,
})

Council.findAllWithIncludes = function () {
  return this.findAll({
    include: [
      {
        model: db.models.consul,
        include: [
          { model: db.models.member, attributes: ['handle'] },
          {
            association: 'votes',
            include: [{ model: db.models.proposal, attributes: ['title'] }],
          },
          {
            association: 'voters',
            include: [{ model: db.models.member, attributes: ['handle'] }],
          },
        ],
      },
    ],
  })
}

Council.findByIdWithIncludes = function (id: number, args?: { where: any }) {
  return this.findByPk(id, {
    ...args,
    include: [
      {
        model: db.models.consul,
        include: [
          { model: db.models.member, attributes: ['handle'] },
          {
            association: 'votes',
            include: [{ model: db.models.proposal, attributes: ['title'] }],
          },
          {
            association: 'voters',
            include: [{ model: db.models.member, attributes: ['handle'] }],
          },
        ],
      },
    ],
  })
}

Council.findWithIncludes = function (args?: { where: any }) {
  return this.findAll({
    ...args,
    include: [
      {
        model: db.models.consul,
        include: [
          { model: db.models.member, attributes: ['handle'] },
          {
            association: 'votes',
            include: [{ model: db.models.proposal, attributes: ['title'] }],
          },
          {
            association: 'voters',
            include: [{ model: db.models.member, attributes: ['handle'] }],
          },
        ],
      },
    ],
  })
}

export default Council
