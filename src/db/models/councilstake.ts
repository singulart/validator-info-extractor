import db from '../db'
import { DataTypes } from 'sequelize'

const Stake = db.define('consulstake', {
  stake: DataTypes.INTEGER,
})

Stake.findAllWithIncludes = function () {
  return this.findAll({
    include: [{ model: db.models.consul }, { model: db.models.member }],
  })
}

Stake.findByIdWithIncludes = function (id: number, args?: { where: any }) {
  return this.findByPk(id, {
    ...args,
    include: [{ model: db.models.consul }, { model: db.models.member }],
  })
}

Stake.findWithIncludes = function (args: { where: any }) {
  return this.findAll({
    ...args,
    include: [{ model: db.models.consul }, { model: db.models.member }],
  })
}

export default Stake
