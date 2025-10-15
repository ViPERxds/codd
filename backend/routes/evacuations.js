const express = require('express');
const { Op } = require('sequelize');
const { Evacuation, sequelize } = require('../models');
const router = express.Router();

// Получение всех данных по эвакуации
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const offset = (page - 1) * limit;
    
    const { year, month, district } = req.query;
    
    const where = {};
    if (year) where.year = year;
    if (month) where.month = month;
    if (district) where.district = district;
    
    const { count, rows } = await Evacuation.findAndCountAll({
      where,
      order: [['date', 'DESC']],
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
    console.error('Ошибка получения данных по эвакуации:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// Получение статистики по эвакуации
router.get('/statistics', async (req, res) => {
  try {
    const { year, compareYear, fromDate, toDate, compareFromDate, compareToDate } = req.query;

    let whereCurrent = {};
    if (fromDate && toDate) {
      whereCurrent.date = { [Op.between]: [fromDate, toDate] };
    } else if (year) {
      whereCurrent.year = year;
    } else {
      whereCurrent.year = new Date().getFullYear();
    }

    const currentData = await Evacuation.findAll({
      where: whereCurrent,
      order: [['date', 'ASC']]
    });

    let compareData = null;
    if ((compareFromDate && compareToDate) || compareYear) {
      const whereCompare = {};
      if (compareFromDate && compareToDate) {
        whereCompare.date = { [Op.between]: [compareFromDate, compareToDate] };
      } else if (compareYear) {
        whereCompare.year = compareYear;
      }
      compareData = await Evacuation.findAll({
        where: whereCompare,
        order: [['date', 'ASC']]
      });
    }

    const currentStats = aggregateEvacuationData(currentData);
    const compareStats = compareData ? aggregateEvacuationData(compareData) : null;

    res.json({
      period: buildPeriodMeta(whereCurrent, fromDate, toDate, year),
      comparePeriod: compareData ? buildPeriodMeta({}, compareFromDate, compareToDate, compareYear) : null,
      current: currentStats,
      compare: compareStats,
      trends: compareStats ? calculateTrends(currentStats, compareStats) : null
    });
    
  } catch (error) {
    console.error('Ошибка получения статистики эвакуации:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// Создание новой записи об эвакуации
router.post('/', async (req, res) => {
  try {
    const evacuationData = req.body;
    
    if (!evacuationData.date || !evacuationData.year || !evacuationData.month) {
      return res.status(400).json({ error: 'Дата, год и месяц обязательны' });
    }
    
    const evacuation = await Evacuation.create(evacuationData);
    res.status(201).json(evacuation);
    
  } catch (error) {
    console.error('Ошибка создания записи об эвакуации:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// Обновление записи об эвакуации
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    const evacuation = await Evacuation.findByPk(id);
    if (!evacuation) {
      return res.status(404).json({ error: 'Запись не найдена' });
    }
    
    await evacuation.update(updateData);
    res.json(evacuation);
    
  } catch (error) {
    console.error('Ошибка обновления записи об эвакуации:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// Удаление записи об эвакуации
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const evacuation = await Evacuation.findByPk(id);
    if (!evacuation) {
      return res.status(404).json({ error: 'Запись не найдена' });
    }
    
    await evacuation.destroy();
    res.json({ message: 'Запись удалена' });
    
  } catch (error) {
    console.error('Ошибка удаления записи об эвакуации:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// Вспомогательные функции
function aggregateEvacuationData(data) {
  const total = data.reduce((acc, item) => ({
    tripsCount: acc.tripsCount + item.tripsCount,
    evacuationsCount: acc.evacuationsCount + item.evacuationsCount,
    receiptsAmount: acc.receiptsAmount + parseFloat(item.receiptsAmount)
  }), {
    tripsCount: 0,
    evacuationsCount: 0,
    receiptsAmount: 0
  });
  
  return {
    total,
    monthly: data.map(item => ({
      month: item.month,
      date: item.date,
      year: item.year,
      tripsCount: item.tripsCount,
      evacuationsCount: item.evacuationsCount,
      receiptsAmount: parseFloat(item.receiptsAmount)
    }))
  };
}

function calculateTrends(current, compare) {
  return {
    tripsCount: calculatePercentageChange(current.total.tripsCount, compare.total.tripsCount),
    evacuationsCount: calculatePercentageChange(current.total.evacuationsCount, compare.total.evacuationsCount),
    receiptsAmount: calculatePercentageChange(current.total.receiptsAmount, compare.total.receiptsAmount)
  };
}

function calculatePercentageChange(current, previous) {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous * 100).toFixed(1);
}

function buildPeriodMeta(whereCurrent, fromDate, toDate, year) {
  if (fromDate && toDate) {
    return { type: 'range', fromDate, toDate };
  }
  if (year) {
    return { type: 'year', year: parseInt(year) };
  }
  return { type: 'year', year: new Date().getFullYear() };
}

module.exports = router;
