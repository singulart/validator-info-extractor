import db from '../db'
import { DataTypes } from 'sequelize'

const Member = db.define('member', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
  },
  createdAt: DataTypes.INTEGER,
  handle: DataTypes.STRING,
  about: DataTypes.TEXT,
})

Member.findAllWithIncludes = function () {
  return this.findAll({
    include: [
      { model: db.models.post, include: [{ model: db.models.thread }] },
      { model: db.models.thread, include: [{ model: db.models.category }] },
      { model: db.models.proposal, include: [{ association: 'votes' }] },
      {
        model: db.models.account,
        include: [
          { association: 'validated', attributes: ['id', 'timestamp'] },
        ],
      },

      {
        association: 'terms',
        include: [
          {
            association: 'votes',
            include: [
              {
                model: db.models.proposal,
                include: [{ association: 'author' }],
              },
            ],
          },
          { association: 'voters', include: [{ model: db.models.member }] },
        ],
      },
      {
        association: 'votes',
        include: [
          {
            model: db.models.consul,
            include: [{ model: db.models.member }],
          },
        ],
      },
    ],
  })
}

Member.findByIdWithIncludes = function (id: number, args?: { where: any }) {
  return this.findByPk(id, {
    ...args,
    include: [
      { model: db.models.post, include: [{ model: db.models.thread }] },
      { model: db.models.proposal, include: [{ association: 'votes' }] },
      {
        model: db.models.account,
        include: [
          { association: 'validated', attributes: ['id', 'timestamp'] },
        ],
      },
      {
        association: 'terms',
        include: [
          {
            association: 'votes',
            include: [
              {
                model: db.models.proposal,
                include: [{ association: 'author' }],
              },
            ],
          },
          { association: 'voters', include: [{ model: db.models.member }] },
        ],
      },
      {
        association: 'votes',
        include: [
          {
            model: db.models.consul,
            include: [{ model: db.models.member }],
          },
        ],
      },
    ],
  })
}

Member.findWithIncludes = function (args: { where: any }) {
  return this.findAll({
    ...args,
    include: [
      { model: db.models.post, include: [{ model: db.models.thread }] },
      { model: db.models.proposal, include: [{ association: 'votes' }] },
      {
        model: db.models.account,
        include: [
          { association: 'validated', attributes: ['id', 'timestamp'] },
        ],
      },
      {
        association: 'terms',
        include: [
          {
            association: 'votes',
            include: [
              {
                model: db.models.proposal,
                include: [{ association: 'author' }],
              },
            ],
          },
          { association: 'voters', include: [{ model: db.models.member }] },
        ],
      },
      {
        association: 'votes',
        include: [
          {
            model: db.models.consul,
            include: [{ model: db.models.member }],
          },
        ],
      },
      {
        model: db.models.account,
        include: [
          { association: 'validated', attributes: ['id', 'timestamp'] },
        ],
      },
    ],
  })
}

export default Member
