const express = require('express');
const router = express.Router();
const { News, Document, Project, Vacancy, Contact } = require('../models');

// Умный поиск по всему сайту
router.get('/', async (req, res) => {
    try {
        const { q: query, type } = req.query;
        
        if (!query || query.trim().length < 2) {
            return res.json({ results: [], total: 0 });
        }

        const searchTerm = query.trim().toLowerCase();
        const results = [];

        // Поиск по новостям
        if (!type || type === 'news') {
            const { Op } = require('sequelize');
            const news = await News.findAll({
                where: {
                    isPublished: true,
                    [Op.or]: [
                        { title: { [Op.like]: `%${searchTerm}%` } },
                        { content: { [Op.like]: `%${searchTerm}%` } },
                        { excerpt: { [Op.like]: `%${searchTerm}%` } }
                    ]
                },
                limit: 5,
                order: [['createdAt', 'DESC']]
            });

            news.forEach(item => {
                results.push({
                    type: 'news',
                    title: item.title,
                    description: item.excerpt || item.content.substring(0, 150) + '...',
                    url: `news-detail.html?id=${item.id}`,
                    date: item.createdAt,
                    category: 'Новости'
                });
            });
        }

        // Поиск по документам
        if (!type || type === 'documents') {
            const { Op } = require('sequelize');
            const documents = await Document.findAll({
                where: {
                    isPublic: true,
                    [Op.or]: [
                        { title: { [Op.like]: `%${searchTerm}%` } },
                        { description: { [Op.like]: `%${searchTerm}%` } },
                        { category: { [Op.like]: `%${searchTerm}%` } }
                    ]
                },
                limit: 5,
                order: [['createdAt', 'DESC']]
            });

            documents.forEach(item => {
                results.push({
                    type: 'document',
                    title: item.title,
                    description: item.description || 'Документ',
                    url: `documents.html#${item.id}`,
                    date: item.createdAt,
                    category: 'Документы'
                });
            });
        }

        // Поиск по проектам
        if (!type || type === 'projects') {
            const { Op } = require('sequelize');
            const projects = await Project.findAll({
                where: {
                    isPublic: true,
                    [Op.or]: [
                        { title: { [Op.like]: `%${searchTerm}%` } },
                        { description: { [Op.like]: `%${searchTerm}%` } },
                        { status: { [Op.like]: `%${searchTerm}%` } }
                    ]
                },
                limit: 5,
                order: [['createdAt', 'DESC']]
            });

            projects.forEach(item => {
                results.push({
                    type: 'project',
                    title: item.title,
                    description: item.description || 'Проект',
                    url: `projects.html#${item.id}`,
                    date: item.createdAt,
                    category: 'Проекты'
                });
            });
        }

        // Поиск по вакансиям
        if (!type || type === 'vacancies') {
            const { Op } = require('sequelize');
            const vacancies = await Vacancy.findAll({
                where: {
                    is_active: true,
                    [Op.or]: [
                        { title: { [Op.like]: `%${searchTerm}%` } },
                        { department: { [Op.like]: `%${searchTerm}%` } },
                        { description: { [Op.like]: `%${searchTerm}%` } }
                    ]
                },
                limit: 5,
                order: [['created_at', 'DESC']]
            });

            vacancies.forEach(item => {
                results.push({
                    type: 'vacancy',
                    title: item.title,
                    description: `${item.department} - ${item.location}`,
                    url: `#vacancies`,
                    date: item.created_at,
                    category: 'Вакансии'
                });
            });
        }

        // Поиск по контактам
        if (!type || type === 'contacts') {
            const { Op } = require('sequelize');
            const contacts = await Contact.findAll({
                where: {
                    is_active: true,
                    [Op.or]: [
                        { name: { [Op.like]: `%${searchTerm}%` } },
                        { description: { [Op.like]: `%${searchTerm}%` } },
                        { phone: { [Op.like]: `%${searchTerm}%` } },
                        { email: { [Op.like]: `%${searchTerm}%` } }
                    ]
                },
                limit: 5,
                order: [['sort_order', 'ASC']]
            });

            contacts.forEach(item => {
                results.push({
                    type: 'contact',
                    title: item.name || 'Контакт',
                    description: `${item.phone || ''} ${item.email || ''}`.trim(),
                    url: `contacts.html#${item.type}`,
                    date: item.createdAt,
                    category: 'Контакты'
                });
            });
        }

        // Сортируем результаты по релевантности
        results.sort((a, b) => {
            const aScore = getRelevanceScore(a, searchTerm);
            const bScore = getRelevanceScore(b, searchTerm);
            return bScore - aScore;
        });

        res.json({
            results: results.slice(0, 10), // Ограничиваем до 10 результатов
            total: results.length,
            query: searchTerm
        });

    } catch (error) {
        console.error('Ошибка поиска:', error);
        res.status(500).json({ error: 'Ошибка поиска' });
    }
});

// Функция для расчета релевантности
function getRelevanceScore(item, searchTerm) {
    let score = 0;
    const title = (item.title || '').toLowerCase();
    const description = (item.description || '').toLowerCase();
    
    // Точное совпадение в заголовке
    if (title.includes(searchTerm)) score += 10;
    
    // Начинается с поискового запроса
    if (title.startsWith(searchTerm)) score += 5;
    
    // Совпадение в описании
    if (description.includes(searchTerm)) score += 3;
    
    // Совпадение по словам
    const searchWords = searchTerm.split(' ');
    searchWords.forEach(word => {
        if (title.includes(word)) score += 2;
        if (description.includes(word)) score += 1;
    });
    
    return score;
}

module.exports = router;
