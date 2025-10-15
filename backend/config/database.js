const { Sequelize } = require('sequelize');
const path = require('path');

// Создаем экземпляр Sequelize для SQLite
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(__dirname, '../../database.sqlite'),
  logging: false, // Отключаем логи SQL запросов в продакшене
  define: {
    timestamps: true, // Автоматически добавляем createdAt и updatedAt
    underscored: true, // Используем snake_case для полей
  }
});

// Функция для подключения к БД
async function connectDatabase() {
  try {
    await sequelize.authenticate();
    console.log('✅ Подключение к базе данных установлено успешно');
    
    // Синхронизируем модели с БД только если таблицы не существуют
    await sequelize.sync({ alter: false });
    console.log('✅ Модели синхронизированы с базой данных');
    
    return sequelize;
  } catch (error) {
    console.error('❌ Ошибка подключения к базе данных:', error);
    throw error;
  }
}

module.exports = {
  sequelize,
  connectDatabase
};
