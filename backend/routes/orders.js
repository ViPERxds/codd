const express = require('express');
const { Order } = require('../models');
const router = express.Router();

// Получение всех заявок
router.get('/', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;
        
        const { status, type, priority } = req.query;
        
        const where = {};
        if (status) where.status = status;
        if (type) where.type = type;
        if (priority) where.priority = priority;
        
        const { count, rows } = await Order.findAndCountAll({
            where,
            order: [['createdAt', 'DESC']],
            limit,
            offset
        });
        
        res.json({
            success: true,
            orders: rows,
            total: count,
            pagination: {
                page,
                limit,
                pages: Math.ceil(count / limit)
            }
        });
    } catch (error) {
        console.error('Ошибка получения заявок:', error);
        res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
});

// Получение заявки по ID
router.get('/:id', async (req, res) => {
    try {
        const orderId = parseInt(req.params.id);
        const order = await Order.findByPk(orderId);
        
        if (!order) {
            return res.status(404).json({ error: 'Заявка не найдена' });
        }
        
        res.json({
            success: true,
            order: order
        });
    } catch (error) {
        console.error('Ошибка получения заявки:', error);
        res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
});

// Создание заявки на аренду автовышки
router.post('/tower-rental', async (req, res) => {
    try {
        const orderData = req.body;
        console.log('Получены данные заявки:', orderData);
        
        const order = await Order.create({
            type: 'tower_rental',
            company: orderData.company,
            contact: orderData.contact,
            phone: orderData.phone,
            email: orderData.email,
            address: orderData.address,
            description: orderData.purpose,
            towerHeight: orderData.height,
            rentalDuration: orderData.days,
            startDate: orderData.date,
            notes: orderData.comments,
            estimatedCost: orderData.calculated_price,
            status: 'pending',
            priority: 'medium'
        });
        
        console.log('Заявка добавлена в БД:', order.id);
        
        res.json({
            success: true,
            message: 'Заявка на аренду автовышки создана',
            order: order
        });
    } catch (error) {
        console.error('Ошибка создания заявки на аренду автовышки:', error);
        res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
});

// Создание заявки на вызов эвакуатора
router.post('/tow-truck', async (req, res) => {
    try {
        const orderData = req.body;
        console.log('=== ДАННЫЕ ЭВАКУАТОРА С КЛИЕНТА ===');
        console.log('Все данные:', orderData);
        
        // Проверяем наличие обязательных полей
        if (!orderData.phone) {
            return res.status(400).json({ error: 'Телефон обязателен для заполнения' });
        }

        const order = await Order.create({
            type: 'evacuation',
            company: orderData.company || 'Не указано',
            contact: orderData.contact || orderData.name || 'Не указано',
            phone: orderData.phone,
            email: orderData.email,
            address: orderData.address || 'Не указано',
            description: orderData.reason || 'Не указано',
            vehicleType: orderData.vehicle_type || 'Не указано',
            licensePlate: orderData.vehicle_model || 'Не указано',
            reason: orderData.reason || 'Не указано',
            notes: orderData.comments || '',
            estimatedCost: orderData.calculated_price || 0,
            status: 'pending',
            priority: orderData.urgency === 'urgent' ? 'high' : 'medium'
        });
        
        console.log('=== СОЗДАНА ЗАЯВКА ЭВАКУАТОРА ===');
        console.log('Заявка ID:', order.id);
        
        res.json({
            success: true,
            message: 'Заявка на вызов эвакуатора создана',
            order: order
        });
    } catch (error) {
        console.error('Ошибка создания заявки на вызов эвакуатора:', error);
        res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
});

// Создание заявки на документацию
router.post('/documentation', async (req, res) => {
    try {
        const orderData = req.body;
        
        const order = await Order.create({
            type: 'other',
            company: orderData.company,
            contact: orderData.contact,
            phone: orderData.phone,
            email: orderData.email,
            address: orderData.address,
            description: orderData.description,
            notes: orderData.comments,
            estimatedCost: orderData.budget,
            status: 'pending',
            priority: 'medium'
        });
        
        console.log('Заявка на документацию добавлена в БД:', order.id);
        
        res.json({
            success: true,
            message: 'Заявка на разработку документации создана',
            order: order
        });
    } catch (error) {
        console.error('Ошибка создания заявки на документацию:', error);
        res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
});

// Обновление статуса заявки
router.put('/:id/status', async (req, res) => {
    try {
        const orderId = parseInt(req.params.id);
        const { status } = req.body;
        
        const order = await Order.findByPk(orderId);
        
        if (!order) {
            return res.status(404).json({ error: 'Заявка не найдена' });
        }
        
        await order.update({ status });
        
        res.json({
            success: true,
            message: 'Статус заявки обновлен',
            order: order
        });
    } catch (error) {
        console.error('Ошибка обновления статуса заявки:', error);
        res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
});

module.exports = router;
