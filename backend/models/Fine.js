const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Fine = sequelize.define('Fine', {
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
  violationsCount: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: 'Количество нарушений'
  },
  resolutionsCount: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: 'Количество постановлений'
  },
  imposedAmount: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    defaultValue: 0,
    comment: 'Сумма наложенных штрафов'
  },
  collectedAmount: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    defaultValue: 0,
    comment: 'Сумма взысканных штрафов'
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
  violationType: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'Тип нарушения'
  }
}, {
  tableName: 'fines',
});

module.exports = Fine;
