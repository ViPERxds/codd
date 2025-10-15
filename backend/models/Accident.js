const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Accident = sequelize.define('Accident', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    comment: 'Дата ДТП'
  },
  time: {
    type: DataTypes.TIME,
    allowNull: true,
    comment: 'Время ДТП'
  },
  accidentsCount: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: 'Количество ДТП'
  },
  deathsCount: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: 'Количество погибших'
  },
  injuredCount: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: 'Количество пострадавших'
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
  dayOfWeek: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'День недели (1-7, где 1=понедельник)'
  },
  hour: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Час дня (0-23)'
  },
  district: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'Район города'
  },
  street: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: 'Улица'
  },
  accidentType: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'Тип ДТП'
  },
  weather: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: 'Погодные условия'
  },
  roadConditions: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'Состояние дороги'
  }
}, {
  tableName: 'accidents',
});

module.exports = Accident;
