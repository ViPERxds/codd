const express = require('express');
const { Op } = require('sequelize');
const { Fine } = require('../models');
const router = express.Router();

// Получение всех штрафов (с пагинацией)
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const offset = (page - 1) * limit;
    
    const { year, month, district } = req.query;
    
    // Строим условия фильтрации
    const where = {};
    if (year) where.year = year;
    if (month) where.month = month;
    if (district) where.district = district;
    
    const { count, rows } = await Fine.findAndCountAll({
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
    console.error('Ошибка получения штрафов:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// Получение статистики по штрафам
router.get('/statistics', async (req, res) => {
  try {
    const { year, compareYear, fromDate, toDate, compareFromDate, compareToDate } = req.query;

    // Основной период
    let whereCurrent = {};
    if (fromDate && toDate) {
      whereCurrent.date = { [Op.between]: [fromDate, toDate] };
    } else if (year) {
      whereCurrent.year = year;
    } else {
      whereCurrent.year = new Date().getFullYear();
    }

    const currentData = await Fine.findAll({
      where: whereCurrent,
      order: [['date', 'ASC']]
    });

    // Сравнительный период
    let compareData = null;
    if ((compareFromDate && compareToDate) || compareYear) {
      const whereCompare = {};
      if (compareFromDate && compareToDate) {
        whereCompare.date = { [Op.between]: [compareFromDate, compareToDate] };
      } else if (compareYear) {
        whereCompare.year = compareYear;
      }
      compareData = await Fine.findAll({
        where: whereCompare,
        order: [['date', 'ASC']]
      });
    }

    const currentStats = aggregateFinesData(currentData);
    const compareStats = compareData ? aggregateFinesData(compareData) : null;

    res.json({
      period: buildPeriodMeta(whereCurrent, fromDate, toDate, year),
      comparePeriod: compareData ? buildPeriodMeta({}, compareFromDate, compareToDate, compareYear) : null,
      current: currentStats,
      compare: compareStats,
      trends: compareStats ? calculateTrends(currentStats, compareStats) : null
    });
    
  } catch (error) {
    console.error('Ошибка получения статистики штрафов:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// Создание новой записи о штрафах
router.post('/', async (req, res) => {
  try {
    const fineData = req.body;
    
    // Валидация обязательных полей
    if (!fineData.date || !fineData.year || !fineData.month) {
      return res.status(400).json({ error: 'Дата, год и месяц обязательны' });
    }
    
    const fine = await Fine.create(fineData);
    res.status(201).json(fine);
    
  } catch (error) {
    console.error('Ошибка создания записи о штрафах:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// Обновление записи о штрафах
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    const fine = await Fine.findByPk(id);
    if (!fine) {
      return res.status(404).json({ error: 'Запись не найдена' });
    }
    
    await fine.update(updateData);
    res.json(fine);
    
  } catch (error) {
    console.error('Ошибка обновления записи о штрафах:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// Удаление записи о штрафах
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const fine = await Fine.findByPk(id);
    if (!fine) {
      return res.status(404).json({ error: 'Запись не найдена' });
    }
    
    await fine.destroy();
    res.json({ message: 'Запись удалена' });
    
  } catch (error) {
    console.error('Ошибка удаления записи о штрафах:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// Вспомогательные функции
function aggregateFinesData(data) {
  const total = data.reduce((acc, item) => ({
    violationsCount: acc.violationsCount + item.violationsCount,
    resolutionsCount: acc.resolutionsCount + item.resolutionsCount,
    imposedAmount: acc.imposedAmount + parseFloat(item.imposedAmount),
    collectedAmount: acc.collectedAmount + parseFloat(item.collectedAmount)
  }), {
    violationsCount: 0,
    resolutionsCount: 0,
    imposedAmount: 0,
    collectedAmount: 0
  });
  
  return {
    total,
    monthly: data.map(item => ({
      month: item.month,
      date: item.date,
      year: item.year,
      violationsCount: item.violationsCount,
      resolutionsCount: item.resolutionsCount,
      imposedAmount: parseFloat(item.imposedAmount),
      collectedAmount: parseFloat(item.collectedAmount)
    }))
  };
}

function calculateTrends(current, compare) {
  return {
    violationsCount: calculatePercentageChange(current.total.violationsCount, compare.total.violationsCount),
    resolutionsCount: calculatePercentageChange(current.total.resolutionsCount, compare.total.resolutionsCount),
    imposedAmount: calculatePercentageChange(current.total.imposedAmount, compare.total.imposedAmount),
    collectedAmount: calculatePercentageChange(current.total.collectedAmount, compare.total.collectedAmount)
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
