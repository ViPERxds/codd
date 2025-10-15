const express = require('express');
const router = express.Router();

// Mock data for fines analytics
let finesAnalyticsData = [
    {
        id: 1,
        period: '2024 (с 01.01.2024 по 31.07.2024)',
        violationsRecorded: 284555,
        resolutionsIssued: 263455,
        imposedFinesAmount: 238535916,
        collectedFinesAmount: 111240416
    },
    {
        id: 2,
        period: '2025 (с 01.01.2025 по 31.07.2025)',
        violationsRecorded: 297279,
        resolutionsIssued: 274748,
        imposedFinesAmount: 229417668,
        collectedFinesAmount: 108572585
    }
];

// GET all fines analytics
router.get('/', async (req, res) => {
    try {
        res.json({
            success: true,
            data: finesAnalyticsData
        });
    } catch (error) {
        console.error('Ошибка получения аналитики штрафов:', error);
        res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
});

// POST new fines analytics
router.post('/', async (req, res) => {
    try {
        const newAnalytics = {
            id: finesAnalyticsData.length + 1,
            ...req.body,
            createdAt: new Date(),
            updatedAt: new Date()
        };
        
        finesAnalyticsData.push(newAnalytics);
        
        res.status(201).json({
            success: true,
            data: newAnalytics
        });
    } catch (error) {
        console.error('Ошибка создания аналитики штрафов:', error);
        res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
});

// GET statistics
router.get('/statistics', async (req, res) => {
    try {
        const total = finesAnalyticsData.length;
        
        res.json({
            total,
            data: finesAnalyticsData
        });
    } catch (error) {
        console.error('Ошибка получения статистики аналитики штрафов:', error);
        res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
});

module.exports = router;
