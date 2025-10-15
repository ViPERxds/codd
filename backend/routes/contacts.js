const express = require('express');
const router = express.Router();
const { Contact } = require('../models');
const auth = require('../middleware/auth');

// Получить все контакты
router.get('/', async (req, res) => {
    try {
        const contacts = await Contact.findAll({
            where: { is_active: true },
            order: [['sort_order', 'ASC'], ['created_at', 'DESC']]
        });
        res.json(contacts);
    } catch (error) {
        console.error('Ошибка получения контактов:', error);
        res.status(500).json({ error: 'Ошибка получения контактов' });
    }
});

// Получить контакты по типу
router.get('/departments', async (req, res) => {
    try {
        const departments = await Contact.findAll({
            where: { 
                type: 'department',
                is_active: true 
            },
            order: [['sort_order', 'ASC'], ['created_at', 'DESC']]
        });
        res.json(departments);
    } catch (error) {
        console.error('Ошибка получения отделов:', error);
        res.status(500).json({ error: 'Ошибка получения отделов' });
    }
});

// Получить контакт по ID
router.get('/:id', async (req, res) => {
    try {
        const contact = await Contact.findByPk(req.params.id);
        if (!contact) {
            return res.status(404).json({ error: 'Контакт не найден' });
        }
        res.json(contact);
    } catch (error) {
        console.error('Ошибка получения контакта:', error);
        res.status(500).json({ error: 'Ошибка получения контакта' });
    }
});

// Создать новый контакт (только для админов)
router.post('/', async (req, res) => {
    try {
        const { type, name, description, phone, email, address, working_hours, sort_order } = req.body;
        
        const contact = await Contact.create({
            type,
            name,
            description,
            phone,
            email,
            address,
            working_hours,
            sort_order: sort_order || 0
        });
        
        res.status(201).json(contact);
    } catch (error) {
        console.error('Ошибка создания контакта:', error);
        res.status(500).json({ error: 'Ошибка создания контакта' });
    }
});

// Обновить контакт (только для админов)
router.put('/:id', async (req, res) => {
    try {
        const { type, name, description, phone, email, address, working_hours, sort_order, is_active } = req.body;
        
        const contact = await Contact.findByPk(req.params.id);
        if (!contact) {
            return res.status(404).json({ error: 'Контакт не найден' });
        }
        
        await contact.update({
            type,
            name,
            description,
            phone,
            email,
            address,
            working_hours,
            sort_order: sort_order || contact.sort_order,
            is_active: is_active !== undefined ? is_active : contact.is_active
        });
        
        res.json(contact);
    } catch (error) {
        console.error('Ошибка обновления контакта:', error);
        res.status(500).json({ error: 'Ошибка обновления контакта' });
    }
});

// Удалить контакт (только для админов)
router.delete('/:id', async (req, res) => {
    try {
        const contact = await Contact.findByPk(req.params.id);
        if (!contact) {
            return res.status(404).json({ error: 'Контакт не найден' });
        }
        
        await contact.destroy();
        res.json({ message: 'Контакт удален' });
    } catch (error) {
        console.error('Ошибка удаления контакта:', error);
        res.status(500).json({ error: 'Ошибка удаления контакта' });
    }
});

// Переключить статус контакта (только для админов)
router.put('/:id/toggle', async (req, res) => {
    try {
        const contact = await Contact.findByPk(req.params.id);
        if (!contact) {
            return res.status(404).json({ error: 'Контакт не найден' });
        }
        
        await contact.update({ is_active: !contact.is_active });
        res.json(contact);
    } catch (error) {
        console.error('Ошибка переключения статуса контакта:', error);
        res.status(500).json({ error: 'Ошибка переключения статуса контакта' });
    }
});

module.exports = router;
