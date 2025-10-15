const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Document = sequelize.define('Document', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: false,
    comment: 'Название документа'
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Описание документа'
  },
  category: {
    type: DataTypes.ENUM('regulations', 'reports', 'forms', 'standards', 'legal'),
    allowNull: false,
    comment: 'Категория документа'
  },
  filePath: {
    type: DataTypes.STRING(255),
    allowNull: false,
    comment: 'Путь к файлу'
  },
  fileName: {
    type: DataTypes.STRING(255),
    allowNull: false,
    comment: 'Имя файла'
  },
  fileSize: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Размер файла в байтах'
  },
  fileType: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: 'Тип файла (PDF, DOCX, etc.)'
  },
  isPublic: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    comment: 'Публичный ли документ'
  },
  downloadCount: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: 'Количество скачиваний'
  },
  version: {
    type: DataTypes.STRING(20),
    allowNull: true,
    comment: 'Версия документа'
  },
  validFrom: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    comment: 'Действует с'
  },
  validTo: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    comment: 'Действует до'
  },
  uploadedBy: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'ID пользователя, загрузившего документ'
  }
}, {
  tableName: 'documents',
});

module.exports = Document;
