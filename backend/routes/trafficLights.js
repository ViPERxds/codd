const express = require('express');
const { TrafficLight, sequelize } = require('../models');
const router = express.Router();

// Получение всех светофоров
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 100;
    const offset = (page - 1) * limit;
    
    const { status, type, district } = req.query;
    
    const where = {};
    if (status) where.status = status;
    if (type) where.type = type;
    if (district) where.district = district;
    
    const { count, rows } = await TrafficLight.findAndCountAll({
      where,
      order: [['address', 'ASC']],
      limit,
      offset
    });
    
    res.json({
      data: rows,
      pagination: {
        page,
        limit,
        total: count,
        pages: Math.ceil(count / limit)
      }
    });
    
  } catch (error) {
    console.error('Ошибка получения светофоров:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// Получение статистики по светофорам
router.get('/statistics', async (req, res) => {
  try {
    const stats = await TrafficLight.findAll({
      attributes: [
        'status',
        'type',
        'district',
        [TrafficLight.sequelize.fn('COUNT', TrafficLight.sequelize.col('id')), 'count']
      ],
      group: ['status', 'type', 'district'],
      raw: true
    });
    
    // Группируем статистику
    const groupedStats = {
      byStatus: {},
      byType: {},
      byDistrict: {},
      total: 0
    };
    
    stats.forEach(stat => {
      const count = parseInt(stat.count);
      groupedStats.total += count;
      
      // По статусу
      if (!groupedStats.byStatus[stat.status]) {
        groupedStats.byStatus[stat.status] = 0;
      }
      groupedStats.byStatus[stat.status] += count;
      
      // По типу
      if (!groupedStats.byType[stat.type]) {
        groupedStats.byType[stat.type] = 0;
      }
      groupedStats.byType[stat.type] += count;
      
      // По району
      if (stat.district) {
        if (!groupedStats.byDistrict[stat.district]) {
          groupedStats.byDistrict[stat.district] = 0;
        }
        groupedStats.byDistrict[stat.district] += count;
      }
    });
    
    res.json(groupedStats);
    
  } catch (error) {
    console.error('Ошибка получения статистики светофоров:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// Получение светофора по ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const trafficLight = await TrafficLight.findByPk(id);
    if (!trafficLight) {
      return res.status(404).json({ error: 'Светофор не найден' });
    }
    
    res.json(trafficLight);
    
  } catch (error) {
    console.error('Ошибка получения светофора:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// Создание нового светофора
router.post('/', async (req, res) => {
  try {
    const trafficLightData = req.body;
    
    if (!trafficLightData.address || !trafficLightData.type || !trafficLightData.installationDate) {
      return res.status(400).json({ error: 'Адрес, тип и дата установки обязательны' });
    }
    
    const trafficLight = await TrafficLight.create(trafficLightData);
    res.status(201).json(trafficLight);
    
  } catch (error) {
    console.error('Ошибка создания светофора:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// Обновление светофора
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    const trafficLight = await TrafficLight.findByPk(id);
    if (!trafficLight) {
      return res.status(404).json({ error: 'Светофор не найден' });
    }
    
    await trafficLight.update(updateData);
    res.json(trafficLight);
    
  } catch (error) {
    console.error('Ошибка обновления светофора:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// Удаление светофора
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const trafficLight = await TrafficLight.findByPk(id);
    if (!trafficLight) {
      return res.status(404).json({ error: 'Светофор не найден' });
    }
    
    await trafficLight.destroy();
    res.json({ message: 'Светофор удален' });
    
  } catch (error) {
    console.error('Ошибка удаления светофора:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// Статистика светофоров
router.get('/statistics', async (req, res) => {
  try {
    const total = await TrafficLight.count();
    
    const byStatus = await TrafficLight.findAll({
      attributes: [
        'status',
        [sequelize.fn('COUNT', '*'), 'count']
      ],
      group: ['status'],
      raw: true
    });
    
    const byType = await TrafficLight.findAll({
      attributes: [
        'type',
        [sequelize.fn('COUNT', '*'), 'count']
      ],
      group: ['type'],
      raw: true
    });
    
    const byDistrict = await TrafficLight.findAll({
      attributes: [
        'district',
        [sequelize.fn('COUNT', '*'), 'count']
      ],
      group: ['district'],
      raw: true
    });
    
    // Преобразуем данные в удобный формат
    const statusData = {};
    byStatus.forEach(item => {
      statusData[item.status] = parseInt(item.count);
    });
    
    const typeData = {};
    byType.forEach(item => {
      typeData[item.type] = parseInt(item.count);
    });
    
    const districtData = {};
    byDistrict.forEach(item => {
      districtData[item.district] = parseInt(item.count);
    });
    
    res.json({
      total,
      byStatus: statusData,
      byType: typeData,
      byDistrict: districtData
    });
    
  } catch (error) {
    console.error('Ошибка получения статистики светофоров:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

module.exports = router;
