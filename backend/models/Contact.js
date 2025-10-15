const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Contact = sequelize.define('Contact', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    type: {
        type: DataTypes.STRING(50),
        allowNull: false,
        comment: 'Тип контакта: main, documents, emergency, department'
    },
    name: {
        type: DataTypes.STRING(255),
        allowNull: true,
        comment: 'Название отдела или контакта'
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Описание отдела'
    },
    phone: {
        type: DataTypes.STRING(50),
        allowNull: true,
        comment: 'Телефон'
    },
    email: {
        type: DataTypes.STRING(255),
        allowNull: true,
        comment: 'Email'
    },
    address: {
        type: DataTypes.STRING(500),
        allowNull: true,
        comment: 'Адрес'
    },
    working_hours: {
        type: DataTypes.STRING(100),
        allowNull: true,
        comment: 'Часы работы'
    },
    is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        comment: 'Активен ли контакт'
    },
    sort_order: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        comment: 'Порядок сортировки'
    }
}, {
    tableName: 'contacts',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

module.exports = Contact;
