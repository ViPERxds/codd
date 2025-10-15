const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Vacancy = sequelize.define('Vacancy', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    title: {
        type: DataTypes.STRING,
        allowNull: false
    },
    department: {
        type: DataTypes.STRING,
        allowNull: false
    },
    location: {
        type: DataTypes.STRING,
        allowNull: false
    },
    salary: {
        type: DataTypes.STRING,
        allowNull: true
    },
    employment_type: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'full-time'
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    requirements: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    responsibilities: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    benefits: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    contact_email: {
        type: DataTypes.STRING,
        allowNull: false
    },
    contact_phone: {
        type: DataTypes.STRING,
        allowNull: true
    },
    is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    updated_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
}, {
    tableName: 'vacancies',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

module.exports = Vacancy;
