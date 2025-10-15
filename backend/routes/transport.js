const express = require('express');
const { Transport } = require('../models');
const router = express.Router();

// Получить все маршруты
router.get('/', async (req, res) => {
  try {
    const { year, month, limit = 50, offset = 0 } = req.query;
    
    const where = { isActive: true };
    if (year) where.year = year;
    if (month) where.month = month;
    
    const transports = await Transport.findAndCountAll({
      where,
      order: [['year', 'DESC'], ['month', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
    
    res.json({
      data: transports.rows,
      total: transports.count,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    console.error('Ошибка получения маршрутов:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// Получить маршрут по ID
router.get('/:id', async (req, res) => {
  try {
    const transport = await Transport.findByPk(req.params.id);
    
    if (!transport) {
      return res.status(404).json({ error: 'Маршрут не найден' });
    }
    
    res.json(transport);
  } catch (error) {
    console.error('Ошибка получения маршрута:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// Создать новый маршрут
router.post('/', async (req, res) => {
  try {
    const { year, month, monthName, route, routeStops } = req.body;
    
    if (!year || !month || !monthName || !route) {
      return res.status(400).json({ error: 'Год, месяц, название месяца и маршрут обязательны' });
    }
    
    const transport = await Transport.create({
      year,
      month,
      monthName,
      route,
      routeStops: routeStops || null
    });
    
    res.status(201).json(transport);
  } catch (error) {
    console.error('Ошибка создания маршрута:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// Обновить маршрут
router.put('/:id', async (req, res) => {
  try {
    const { year, month, monthName, route, routeStops, isActive } = req.body;
    
    const transport = await Transport.findByPk(req.params.id);
    if (!transport) {
      return res.status(404).json({ error: 'Маршрут не найден' });
    }
    
    await transport.update({
      year: year || transport.year,
      month: month || transport.month,
      monthName: monthName || transport.monthName,
      route: route || transport.route,
      routeStops: routeStops !== undefined ? routeStops : transport.routeStops,
      isActive: isActive !== undefined ? isActive : transport.isActive
    });
    
    res.json(transport);
  } catch (error) {
    console.error('Ошибка обновления маршрута:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// Удалить маршрут (мягкое удаление)
router.delete('/:id', async (req, res) => {
  try {
    const transport = await Transport.findByPk(req.params.id);
    if (!transport) {
      return res.status(404).json({ error: 'Маршрут не найден' });
    }
    
    await transport.update({ isActive: false });
    res.json({ message: 'Маршрут успешно удален' });
  } catch (error) {
    console.error('Ошибка удаления маршрута:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// Получить статистику по маршрутам
router.get('/stats/overview', async (req, res) => {
  try {
    const totalRoutes = await Transport.count({ where: { isActive: true } });
    
    const routesByYear = await Transport.findAll({
      attributes: [
        'year',
        [Transport.sequelize.fn('COUNT', Transport.sequelize.col('id')), 'count']
      ],
      where: { isActive: true },
      group: ['year'],
      order: [['year', 'DESC']]
    });
    
    const routesByMonth = await Transport.findAll({
      attributes: [
        'month',
        'monthName',
        [Transport.sequelize.fn('COUNT', Transport.sequelize.col('id')), 'count']
      ],
      where: { isActive: true },
      group: ['month', 'monthName'],
      order: [['month', 'ASC']]
    });
    
    res.json({
      totalRoutes,
      routesByYear,
      routesByMonth
    });
  } catch (error) {
    console.error('Ошибка получения статистики:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

module.exports = router;
