const express = require('express');
const router = express.Router();

// Mock data for evacuation routes
let evacuationRoutesData = [
    {
        id: 1,
        year: 2024,
        month: 'Январь',
        route: 'ул. Большая Советская (д.1-25) → ул. Ленина (д.10-40) → пр-т Гагарина (д.5-35) → ул. Николаева (д.3-22) → ул. Багратиона (д.7-18)'
    },
    {
        id: 2,
        year: 2024,
        month: 'Февраль',
        route: 'ул. Дзержинского (д.1-15) → ул. Маршала Конева (д.4-28) → ул. Ново-Ленинградская (д.6-32) → ул. Рыленкова (д.2-19) → ул. Кашена (д.8-24)'
    },
    {
        id: 3,
        year: 2024,
        month: 'Март',
        route: 'ул. Кирова (д.2-20) → ул. Октябрьской Революции (д.5-30) → ул. Смоленская (д.1-25) → ул. Пушкина (д.3-18) → ул. Гоголя (д.7-22)'
    },
    {
        id: 4,
        year: 2025,
        month: 'Январь',
        route: 'ул. Большая Советская (д.1-25) → ул. Ленина (д.10-40) → пр-т Гагарина (д.5-35) → ул. Николаева (д.3-22) → ул. Багратиона (д.7-18)'
    },
    {
        id: 5,
        year: 2025,
        month: 'Февраль',
        route: 'ул. Дзержинского (д.1-15) → ул. Маршала Конева (д.4-28) → ул. Ново-Ленинградская (д.6-32) → ул. Рыленкова (д.2-19) → ул. Кашена (д.8-24)'
    }
];

// GET all evacuation routes
router.get('/', async (req, res) => {
    try {
        res.json({
            success: true,
            data: evacuationRoutesData
        });
    } catch (error) {
        console.error('Ошибка получения маршрутов эвакуации:', error);
        res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
});

// POST new evacuation route
router.post('/', async (req, res) => {
    try {
        const newRoute = {
            id: evacuationRoutesData.length + 1,
            ...req.body,
            createdAt: new Date(),
            updatedAt: new Date()
        };
        
        evacuationRoutesData.push(newRoute);
        
        res.status(201).json({
            success: true,
            data: newRoute
        });
    } catch (error) {
        console.error('Ошибка создания маршрута эвакуации:', error);
        res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
});

// GET statistics
router.get('/statistics', async (req, res) => {
    try {
        const total = evacuationRoutesData.length;
        
        // Group by year
        const byYear = evacuationRoutesData.reduce((acc, route) => {
            if (!acc[route.year]) acc[route.year] = 0;
            acc[route.year]++;
            return acc;
        }, {});
        
        // Group by month
        const byMonth = evacuationRoutesData.reduce((acc, route) => {
            if (!acc[route.month]) acc[route.month] = 0;
            acc[route.month]++;
            return acc;
        }, {});
        
        res.json({
            total,
            byYear,
            byMonth,
            data: evacuationRoutesData
        });
    } catch (error) {
        console.error('Ошибка получения статистики маршрутов эвакуации:', error);
        res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
});

module.exports = router;
