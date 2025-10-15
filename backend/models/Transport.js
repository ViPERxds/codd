const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Transport = sequelize.define('Transport', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  year: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 2020,
      max: 2030
    }
  },
  month: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1,
      max: 12
    }
  },
  monthName: {
    type: DataTypes.STRING(20),
    allowNull: false
  },
  route: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  routeStops: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Массив остановок маршрута'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  updatedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'transports'
});

module.exports = Transport;
