const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Order = sequelize.define('Order', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  type: {
    type: DataTypes.ENUM('tower_rental', 'evacuation', 'other'),
    allowNull: false,
    comment: 'Тип заявки'
  },
  company: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: 'Название компании'
  },
  contact: {
    type: DataTypes.STRING(255),
    allowNull: false,
    comment: 'Контактное лицо'
  },
  phone: {
    type: DataTypes.STRING(20),
    allowNull: false,
    comment: 'Телефон'
  },
  email: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'Email'
  },
  address: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Адрес'
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Описание заявки'
  },
  status: {
    type: DataTypes.ENUM('pending', 'in_progress', 'completed', 'cancelled'),
    allowNull: false,
    defaultValue: 'pending',
    comment: 'Статус заявки'
  },
  priority: {
    type: DataTypes.ENUM('low', 'medium', 'high', 'urgent'),
    allowNull: false,
    defaultValue: 'medium',
    comment: 'Приоритет заявки'
  },
  // Дополнительные поля для автовышки
  towerHeight: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Высота автовышки'
  },
  rentalDuration: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Продолжительность аренды (дни)'
  },
  startDate: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Дата начала'
  },
  endDate: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Дата окончания'
  },
  // Дополнительные поля для эвакуации
  vehicleType: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'Тип транспортного средства'
  },
  licensePlate: {
    type: DataTypes.STRING(20),
    allowNull: true,
    comment: 'Госномер'
  },
  reason: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: 'Причина эвакуации'
  },
  // Общие поля
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Дополнительные заметки'
  },
  assignedTo: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'Назначено кому'
  },
  estimatedCost: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    comment: 'Предварительная стоимость'
  }
}, {
  tableName: 'orders',
  timestamps: true
});

module.exports = Order;
