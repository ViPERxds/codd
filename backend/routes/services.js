const express = require('express');
const { Service } = require('../models');
const router = express.Router();

// Получение всех услуг
router.get('/', async (req, res) => {
  try {
    const { category, active } = req.query;
    
    const where = {};
    if (category) where.category = category;
    if (active !== undefined) where.isActive = active === 'true';
    
    const services = await Service.findAll({
      where,
      order: [['order', 'ASC'], ['createdAt', 'DESC']]
    });
    
    res.json({
      data: services,
      total: services.length
    });
    
  } catch (error) {
    console.error('Ошибка получения услуг:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// Получение услуги по ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const service = await Service.findByPk(id);
    
    if (!service) {
      return res.status(404).json({ error: 'Услуга не найдена' });
    }
    
    res.json(service);
    
  } catch (error) {
    console.error('Ошибка получения услуги:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// Создание новой услуги
router.post('/', async (req, res) => {
  try {
    const serviceData = req.body;
    
    if (!serviceData.title) {
      return res.status(400).json({ error: 'Название услуги обязательно' });
    }
    
    const service = await Service.create(serviceData);
    res.status(201).json(service);
    
  } catch (error) {
    console.error('Ошибка создания услуги:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// Обновление услуги
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    const service = await Service.findByPk(id);
    if (!service) {
      return res.status(404).json({ error: 'Услуга не найдена' });
    }
    
    await service.update(updateData);
    res.json(service);
    
  } catch (error) {
    console.error('Ошибка обновления услуги:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// Удаление услуги
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const service = await Service.findByPk(id);
    if (!service) {
      return res.status(404).json({ error: 'Услуга не найдена' });
    }
    
    await service.destroy();
    res.json({ message: 'Услуга удалена' });
    
  } catch (error) {
    console.error('Ошибка удаления услуги:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// Заказ услуги
router.post('/:id/order', async (req, res) => {
  try {
    const { id } = req.params;
    const orderData = req.body;
    
    const service = await Service.findByPk(id);
    if (!service) {
      return res.status(404).json({ error: 'Услуга не найдена' });
    }
    
    // Здесь можно добавить логику сохранения заказа в базу данных
    // Пока просто логируем заказ
    console.log('Новый заказ услуги:', {
      serviceId: id,
      serviceTitle: service.title,
      orderData: orderData,
      timestamp: new Date().toISOString()
    });
    
    res.json({ 
      message: 'Заявка принята',
      orderId: Date.now() // Временный ID заказа
    });
    
  } catch (error) {
    console.error('Ошибка обработки заказа:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// Получение статистики по услугам
router.get('/statistics/overview', async (req, res) => {
  try {
    const stats = await Service.findAll({
      attributes: [
        'category',
        [Service.sequelize.fn('COUNT', Service.sequelize.col('id')), 'count']
      ],
      group: ['category'],
      raw: true
    });
    
    const totalServices = await Service.count();
    const activeServices = await Service.count({ where: { isActive: true } });
    
    res.json({
      byCategory: stats.reduce((acc, stat) => {
        acc[stat.category] = parseInt(stat.count);
        return acc;
      }, {}),
      total: totalServices,
      active: activeServices
    });
    
  } catch (error) {
    console.error('Ошибка получения статистики услуг:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

module.exports = router;
