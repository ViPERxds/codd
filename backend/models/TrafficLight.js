const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const TrafficLight = sequelize.define('TrafficLight', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  address: {
    type: DataTypes.STRING(255),
    allowNull: false,
    comment: 'Адрес установки светофора'
  },
  type: {
    type: DataTypes.ENUM('pedestrian', 'vehicle', 'combined'),
    allowNull: false,
    comment: 'Тип светофора'
  },
  installationDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    comment: 'Дата установки'
  },
  status: {
    type: DataTypes.ENUM('active', 'maintenance', 'inactive'),
    allowNull: false,
    defaultValue: 'active',
    comment: 'Статус светофора'
  },
  latitude: {
    type: DataTypes.DECIMAL(10, 8),
    allowNull: true,
    comment: 'Широта для карты'
  },
  longitude: {
    type: DataTypes.DECIMAL(11, 8),
    allowNull: true,
    comment: 'Долгота для карты'
  },
  district: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'Район города'
  },
  manufacturer: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'Производитель оборудования'
  },
  model: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'Модель светофора'
  },
  lastMaintenance: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    comment: 'Дата последнего обслуживания'
  },
  nextMaintenance: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    comment: 'Дата следующего обслуживания'
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Дополнительное описание'
  }
}, {
  tableName: 'traffic_lights',
});

module.exports = TrafficLight;
