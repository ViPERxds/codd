const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Project = sequelize.define('Project', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: false,
    comment: 'Название проекта'
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false,
    comment: 'Описание проекта'
  },
  shortDescription: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: 'Краткое описание'
  },
  category: {
    type: DataTypes.ENUM('infrastructure', 'safety', 'technology', 'environment', 'social'),
    allowNull: false,
    comment: 'Категория проекта'
  },
  status: {
    type: DataTypes.ENUM('planning', 'in_progress', 'completed', 'suspended'),
    allowNull: false,
    defaultValue: 'planning',
    comment: 'Статус проекта'
  },
  startDate: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    comment: 'Дата начала'
  },
  endDate: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    comment: 'Дата окончания'
  },
  budget: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: true,
    comment: 'Бюджет проекта'
  },
  spentAmount: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: true,
    comment: 'Потраченная сумма'
  },
  image: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: 'Путь к изображению'
  },
  gallery: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Галерея изображений (массив путей)'
  },
  isPublic: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    comment: 'Публичный ли проект'
  },
  isFeatured: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: 'Рекомендуемый проект'
  },
  progress: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: 'Процент выполнения (0-100)'
  },
  district: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'Район реализации'
  },
  benefits: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Преимущества проекта (массив строк)'
  },
  responsiblePerson: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'Ответственное лицо'
  },
  contactInfo: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: 'Контактная информация'
  }
}, {
  tableName: 'projects',
});

module.exports = Project;
