const Sequelize = require('sequelize')

const dbName = process.env.NODE_ENV
const dbUrl = process.env.DATABASE_URL || `postgres://localhost:5432/${dbName}`
// export default new Sequelize(dbUrl, {logging: console.log})
export default new Sequelize(dbUrl, {logging: () => false})

