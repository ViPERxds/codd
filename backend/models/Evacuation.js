const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Evacuation = sequelize.define('Evacuation', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    comment: 'Дата статистики'
  },
  tripsCount: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: 'Количество выездов эвакуаторов'
  },
  evacuationsCount: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: 'Количество эвакуаций'
  },
  receiptsAmount: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    defaultValue: 0,
    comment: 'Поступления от штрафстоянок'
  },
  year: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'Год статистики'
  },
  month: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'Месяц статистики (1-12)'
  },
  district: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'Район города'
  },
  vehicleType: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: 'Тип транспорта (легковой, грузовой, мотоцикл)'
  },
  reason: {
    type: DataTypes.STRING(200),
    allowNull: true,
    comment: 'Причина эвакуации'
  }
}, {
  tableName: 'evacuations',
});

module.exports = Evacuation;
