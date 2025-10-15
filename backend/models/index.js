const { sequelize } = require('../config/database');

// Импортируем все модели
const User = require('./User');
const Fine = require('./Fine');
const Evacuation = require('./Evacuation');
const TrafficLight = require('./TrafficLight');
const Accident = require('./Accident');
const News = require('./News');
const Document = require('./Document');
const Project = require('./Project');
const Transport = require('./Transport');
const Vacancy = require('./Vacancy');
const Contact = require('./Contact');
const Order = require('./Order');
const Service = require('./Service')(sequelize);

// Определяем связи между моделями
// Пользователь может быть автором новостей
User.hasMany(News, { foreignKey: 'authorId', as: 'news' });
News.belongsTo(User, { foreignKey: 'authorId', as: 'author' });

// Пользователь может загружать документы
User.hasMany(Document, { foreignKey: 'uploadedBy', as: 'documents' });
Document.belongsTo(User, { foreignKey: 'uploadedBy', as: 'uploader' });

// Экспортируем все модели и sequelize
module.exports = {
  sequelize,
  User,
  Fine,
  Evacuation,
  TrafficLight,
  Accident,
  News,
  Document,
  Project,
  Transport,
  Vacancy,
  Contact,
  Order,
  Service
};
