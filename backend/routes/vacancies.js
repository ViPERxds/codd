const express = require('express');
const router = express.Router();
const { Vacancy } = require('../models');

// Получить все активные вакансии
router.get('/', async (req, res) => {
    try {
        const vacancies = await Vacancy.findAll({
            where: { is_active: true },
            order: [['created_at', 'DESC']]
        });
        res.json(vacancies);
    } catch (error) {
        console.error('Ошибка загрузки вакансий:', error);
        res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
});

// Получить все вакансии (для админки)
router.get('/admin', async (req, res) => {
    try {
        const vacancies = await Vacancy.findAll({
            order: [['created_at', 'DESC']]
        });
        res.json(vacancies);
    } catch (error) {
        console.error('Ошибка загрузки вакансий для админки:', error);
        res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
});

// Получить вакансию по ID
router.get('/:id', async (req, res) => {
    try {
        const vacancy = await Vacancy.findByPk(req.params.id);
        if (!vacancy) {
            return res.status(404).json({ error: 'Вакансия не найдена' });
        }
        res.json(vacancy);
    } catch (error) {
        console.error('Ошибка загрузки вакансии:', error);
        res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
});

// Создать новую вакансию
router.post('/', async (req, res) => {
    try {
        const vacancyData = req.body;
        console.log('=== СОЗДАНИЕ ВАКАНСИИ ===');
        console.log('Данные вакансии:', vacancyData);

        const vacancy = await Vacancy.create({
            title: vacancyData.title,
            department: vacancyData.department,
            location: vacancyData.location,
            salary: vacancyData.salary || null,
            employment_type: vacancyData.employment_type || 'full-time',
            description: vacancyData.description,
            requirements: vacancyData.requirements,
            responsibilities: vacancyData.responsibilities,
            benefits: vacancyData.benefits || null,
            contact_email: vacancyData.contact_email,
            contact_phone: vacancyData.contact_phone || null,
            is_active: vacancyData.is_active !== undefined ? vacancyData.is_active : true
        });

        console.log('=== ВАКАНСИЯ СОЗДАНА ===');
        console.log('ID:', vacancy.id);
        console.log('Название:', vacancy.title);

        res.json({ success: true, message: 'Вакансия создана', vacancy });
    } catch (error) {
        console.error('Ошибка создания вакансии:', error);
        res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
});

// Обновить вакансию
router.put('/:id', async (req, res) => {
    try {
        const vacancyData = req.body;
        const vacancy = await Vacancy.findByPk(req.params.id);
        
        if (!vacancy) {
            return res.status(404).json({ error: 'Вакансия не найдена' });
        }

        await vacancy.update(vacancyData);
        res.json({ success: true, message: 'Вакансия обновлена', vacancy });
    } catch (error) {
        console.error('Ошибка обновления вакансии:', error);
        res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
});

// Удалить вакансию
router.delete('/:id', async (req, res) => {
    try {
        const vacancy = await Vacancy.findByPk(req.params.id);
        
        if (!vacancy) {
            return res.status(404).json({ error: 'Вакансия не найдена' });
        }

        await vacancy.destroy();
        res.json({ success: true, message: 'Вакансия удалена' });
    } catch (error) {
        console.error('Ошибка удаления вакансии:', error);
        res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
});

// Переключить статус вакансии
router.put('/:id/toggle', async (req, res) => {
    try {
        const vacancy = await Vacancy.findByPk(req.params.id);
        
        if (!vacancy) {
            return res.status(404).json({ error: 'Вакансия не найдена' });
        }

        await vacancy.update({ is_active: !vacancy.is_active });
        res.json({ 
            success: true, 
            message: `Вакансия ${vacancy.is_active ? 'активирована' : 'деактивирована'}`, 
            vacancy 
        });
    } catch (error) {
        console.error('Ошибка переключения статуса вакансии:', error);
        res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
});

module.exports = router;
