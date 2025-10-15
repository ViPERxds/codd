const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Service = sequelize.define('Service', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        title: {
            type: DataTypes.STRING,
            allowNull: false,
            comment: 'Название услуги'
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true,
            comment: 'Описание услуги'
        },
        category: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: 'other',
            comment: 'Категория услуги'
        },
        price: {
            type: DataTypes.STRING,
            allowNull: true,
            comment: 'Цена услуги'
        },
        isActive: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true,
            comment: 'Активна ли услуга'
        },
        formFields: {
            type: DataTypes.JSON,
            allowNull: true,
            comment: 'Поля формы для заказа услуги',
            defaultValue: []
        },
        icon: {
            type: DataTypes.STRING,
            allowNull: true,
            comment: 'Иконка услуги'
        },
        order: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
            comment: 'Порядок сортировки'
        }
    }, {
        tableName: 'services',
        timestamps: true,
        comment: 'Услуги ЦОДД'
    });

    return Service;
};
