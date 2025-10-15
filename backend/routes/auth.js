const express = require('express');
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'codd-smolensk-secret-key';

// Регистрация пользователя (админ или при установке)
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, role = 'user', fullName } = req.body;
    if (!username || !password || !email) {
      return res.status(400).json({ error: 'Логин, email и пароль обязательны' });
    }
    const exists = await User.findOne({ where: { username } });
    if (exists) {
      return res.status(409).json({ error: 'Пользователь с таким логином уже существует' });
    }
    const user = await User.create({ username, email, password, role, fullName, isActive: true });
    res.status(201).json(user.toPublicJSON());
  } catch (error) {
    console.error('Ошибка регистрации:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// Вход в систему
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Логин и пароль обязательны' });
    }

    // Находим пользователя
    const user = await User.findOne({ where: { username } });
    if (!user) {
      return res.status(401).json({ error: 'Неверный логин или пароль' });
    }

    // Проверяем пароль
    const isValidPassword = await user.checkPassword(password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Неверный логин или пароль' });
    }

    // Проверяем активность пользователя
    if (!user.isActive) {
      return res.status(401).json({ error: 'Аккаунт заблокирован' });
    }

    // Создаем JWT токен
    const token = jwt.sign(
      { 
        id: user.id, 
        username: user.username, 
        role: user.role 
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: user.toPublicJSON()
    });

  } catch (error) {
    console.error('Ошибка входа:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// Проверка токена
router.get('/verify', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Токен не предоставлен' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findByPk(decoded.id);
    
    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'Недействительный токен' });
    }

    res.json({ user: user.toPublicJSON() });

  } catch (error) {
    res.status(401).json({ error: 'Недействительный токен' });
  }
});

// Получение профиля пользователя
router.get('/profile', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Токен не предоставлен' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findByPk(decoded.id);
    
    if (!user) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }

    res.json({ user: user.toPublicJSON() });

  } catch (error) {
    res.status(401).json({ error: 'Недействительный токен' });
  }
});

// Список пользователей (для админки)
router.get('/users', async (req, res) => {
  try {
    const users = await User.findAll();
    res.json({ data: users.map(u => u.toPublicJSON ? u.toPublicJSON() : u) });
  } catch (error) {
    console.error('Ошибка получения пользователей:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

module.exports = router;
