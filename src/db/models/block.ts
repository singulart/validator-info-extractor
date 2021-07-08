import db from '../db'
import { DataTypes, Op } from 'sequelize'

const Block = db.define('block', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
  },
  hash: DataTypes.STRING,
  timestamp: DataTypes.DATE,
  blocktime: DataTypes.INTEGER,
})


export const findLastProcessedBlockId = (start: number, end: number): Promise<number> => {
  return Block.max('id', 
    { 
      where: {
        id: {
          [Op.and]: {
            [Op.gte]: start,
            [Op.lt]: end,
          }
        }
      }
  })
}

export default Block
