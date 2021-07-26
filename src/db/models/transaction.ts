import db from '../db'
import { DataTypes, Model } from 'sequelize'

class Transaction extends Model {}

Transaction.init({
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
    from: DataTypes.STRING,
    to: DataTypes.STRING,
    amount: DataTypes.INTEGER,  
    block: DataTypes.INTEGER,
}, {modelName: 'transaction', sequelize: db})

export default Transaction
