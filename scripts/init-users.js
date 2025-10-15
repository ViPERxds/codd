const { User } = require('../backend/models');

async function initUsers() {
    try {
        // Проверяем, есть ли уже пользователи
        const existingUsers = await User.count();
        if (existingUsers > 0) {
            console.log('Пользователи уже существуют в базе данных');
            return;
        }

        // Создаем тестовых пользователей
        const users = [
            {
                username: 'admin',
                email: 'admin@codd-smolensk.ru',
                password: 'admin123',
                role: 'admin',
                fullName: 'Администратор системы',
                isActive: true
            },
            {
                username: 'editor',
                email: 'editor@codd-smolensk.ru',
                password: 'editor123',
                role: 'editor',
                fullName: 'Редактор контента',
                isActive: true
            }
        ];

        // Создаем пользователей в базе данных
        for (const userData of users) {
            await User.create(userData);
        }

        console.log(`Создано ${users.length} пользователей в базе данных`);
        console.log('Администратор: admin / admin123');
        console.log('Редактор: editor / editor123');
    } catch (error) {
        console.error('Ошибка инициализации пользователей:', error);
    }
}

module.exports = { initUsers };
