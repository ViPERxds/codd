  const express = require('express');
const { Project } = require('../models');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Загрузка файлов (обложка/галерея)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(process.cwd(), 'uploads');
    try { if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true }); } catch (e) {}
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random()*1e9);
    const ext = path.extname(file.originalname || '');
    cb(null, `${unique}${ext}`);
  }
});
const upload = multer({ storage });

// Получение всех проектов (публичных)
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const offset = (page - 1) * limit;
    
    const { status, category, district, featured } = req.query;
    
    const where = { isPublic: true };
    if (status) where.status = status;
    if (category) where.category = category;
    if (district) where.district = district;
    if (featured === 'true') where.isFeatured = true;
    
    const { count, rows } = await Project.findAndCountAll({
      where,
      order: [['createdAt', 'DESC']],
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
    console.error('Ошибка получения проектов:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// Получение проекта по ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const project = await Project.findOne({
      where: { 
        id,
        isPublic: true 
      }
    });
    
    if (!project) {
      return res.status(404).json({ error: 'Проект не найден' });
    }
    
    res.json(project);
    
  } catch (error) {
    console.error('Ошибка получения проекта:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// Создание нового проекта
router.post('/', upload.fields([
  { name: 'projectCover', maxCount: 1 },
  { name: 'projectImages', maxCount: 20 }
]), async (req, res) => {
  try {
    const projectData = req.body || {};
    
    if (!projectData.title || !projectData.description) {
      return res.status(400).json({ error: 'Название и описание обязательны' });
    }
    
    if (req.files && req.files.projectCover && req.files.projectCover[0]) {
      projectData.image = `/uploads/${req.files.projectCover[0].filename}`;
    }
    if (req.files && req.files.projectImages && req.files.projectImages.length) {
      projectData.gallery = req.files.projectImages.map(f => `/uploads/${f.filename}`);
    }
    const project = await Project.create(projectData);
    res.status(201).json(project);
    
  } catch (error) {
    console.error('Ошибка создания проекта:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// Обновление проекта
router.put('/:id', upload.fields([
  { name: 'projectCover', maxCount: 1 },
  { name: 'projectImages', maxCount: 20 }
]), async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body || {};
    if (req.files && req.files.projectCover && req.files.projectCover[0]) {
      updateData.image = `/uploads/${req.files.projectCover[0].filename}`;
    }
    if (req.files && req.files.projectImages && req.files.projectImages.length) {
      updateData.gallery = req.files.projectImages.map(f => `/uploads/${f.filename}`);
    }
    
    const project = await Project.findByPk(id);
    if (!project) {
      return res.status(404).json({ error: 'Проект не найден' });
    }
    
    await project.update(updateData);
    res.json(project);
    
  } catch (error) {
    console.error('Ошибка обновления проекта:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// Удаление проекта
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const project = await Project.findByPk(id);
    if (!project) {
      return res.status(404).json({ error: 'Проект не найден' });
    }
    
    await project.destroy();
    res.json({ message: 'Проект удален' });
    
  } catch (error) {
    console.error('Ошибка удаления проекта:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// Получение рекомендуемых проектов
router.get('/featured/list', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 6;
    
    const featuredProjects = await Project.findAll({
      where: { 
        isPublic: true,
        isFeatured: true 
      },
      order: [['createdAt', 'DESC']],
      limit
    });
    
    res.json(featuredProjects);
    
  } catch (error) {
    console.error('Ошибка получения рекомендуемых проектов:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// Получение статистики по проектам
router.get('/statistics/overview', async (req, res) => {
  try {
    const stats = await Project.findAll({
      attributes: [
        'status',
        'category',
        'district',
        [Project.sequelize.fn('COUNT', Project.sequelize.col('id')), 'count'],
        [Project.sequelize.fn('SUM', Project.sequelize.col('budget')), 'totalBudget'],
        [Project.sequelize.fn('SUM', Project.sequelize.col('spentAmount')), 'totalSpent']
      ],
      group: ['status', 'category', 'district'],
      raw: true
    });
    
    // Группируем статистику
    const groupedStats = {
      byStatus: {},
      byCategory: {},
      byDistrict: {},
      total: 0,
      totalBudget: 0,
      totalSpent: 0
    };
    
    stats.forEach(stat => {
      const count = parseInt(stat.count);
      const budget = parseFloat(stat.totalBudget) || 0;
      const spent = parseFloat(stat.totalSpent) || 0;
      
      groupedStats.total += count;
      groupedStats.totalBudget += budget;
      groupedStats.totalSpent += spent;
      
      // По статусу
      if (!groupedStats.byStatus[stat.status]) {
        groupedStats.byStatus[stat.status] = { count: 0, budget: 0, spent: 0 };
      }
      groupedStats.byStatus[stat.status].count += count;
      groupedStats.byStatus[stat.status].budget += budget;
      groupedStats.byStatus[stat.status].spent += spent;
      
      // По категории
      if (!groupedStats.byCategory[stat.category]) {
        groupedStats.byCategory[stat.category] = { count: 0, budget: 0, spent: 0 };
      }
      groupedStats.byCategory[stat.category].count += count;
      groupedStats.byCategory[stat.category].budget += budget;
      groupedStats.byCategory[stat.category].spent += spent;
      
      // По району
      if (stat.district) {
        if (!groupedStats.byDistrict[stat.district]) {
          groupedStats.byDistrict[stat.district] = { count: 0, budget: 0, spent: 0 };
        }
        groupedStats.byDistrict[stat.district].count += count;
        groupedStats.byDistrict[stat.district].budget += budget;
        groupedStats.byDistrict[stat.district].spent += spent;
      }
    });
    
    res.json(groupedStats);
    
  } catch (error) {
    console.error('Ошибка получения статистики проектов:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

module.exports = router;
