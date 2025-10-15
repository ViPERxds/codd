const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const News = sequelize.define('News', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: false,
    comment: 'Заголовок новости'
  },
  excerpt: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Краткое описание'
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false,
    comment: 'Полный текст новости'
  },
  category: {
    type: DataTypes.ENUM('general', 'safety', 'technology', 'construction', 'events'),
    allowNull: false,
    defaultValue: 'general',
    comment: 'Категория новости'
  },
  tags: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Теги новости (массив строк)'
  },
  image: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: 'Путь к изображению'
  },
  isPublished: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: 'Опубликована ли новость'
  },
  isFeatured: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: 'Рекомендуемая новость'
  },
  publishedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Дата публикации'
  },
  authorId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'ID автора новости'
  },
  viewsCount: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: 'Количество просмотров'
  }
}, {
  tableName: 'news',
});

module.exports = News;
