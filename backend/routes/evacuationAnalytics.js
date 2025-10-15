const express = require('express');
const router = express.Router();

// Mock data for evacuation analytics
let evacuationAnalyticsData = [
    {
        id: 1,
        period: '2024 (с 01.01.2024 по 31.07.2024)',
        tripsCount: 1084,
        evacuationsCount: 901,
        receiptsAmount: 4505000
    },
    {
        id: 2,
        period: '2025 (с 01.01.2025 по 31.07.2025)',
        tripsCount: 1102,
        evacuationsCount: 919,
        receiptsAmount: 4533000
    }
];

// GET all evacuation analytics
router.get('/', async (req, res) => {
    try {
        res.json({
            success: true,
            data: evacuationAnalyticsData
        });
    } catch (error) {
        console.error('Ошибка получения аналитики эвакуации:', error);
        res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
});

// POST new evacuation analytics
router.post('/', async (req, res) => {
    try {
        const newAnalytics = {
            id: evacuationAnalyticsData.length + 1,
            ...req.body,
            createdAt: new Date(),
            updatedAt: new Date()
        };
        
        evacuationAnalyticsData.push(newAnalytics);
        
        res.status(201).json({
            success: true,
            data: newAnalytics
        });
    } catch (error) {
        console.error('Ошибка создания аналитики эвакуации:', error);
        res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
});

// GET statistics
router.get('/statistics', async (req, res) => {
    try {
        const total = evacuationAnalyticsData.length;
        
        res.json({
            total,
            data: evacuationAnalyticsData
        });
    } catch (error) {
        console.error('Ошибка получения статистики аналитики эвакуации:', error);
        res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
});

module.exports = router;
