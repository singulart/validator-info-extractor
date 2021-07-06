const Sequelize = require('sequelize')
const pkg = require('../../package.json')

const dbName = pkg.name + (process.env.NODE_ENV === 'test' ? '-test' : '')
const dbUrl = process.env.DATABASE_URL || `postgres://localhost:5432/${dbName}`
export default new Sequelize(dbUrl, {logging: false})
