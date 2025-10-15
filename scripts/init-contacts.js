const { Contact } = require('../backend/models');

async function initContacts() {
    try {
        // Проверяем, есть ли уже контакты
        const existingContacts = await Contact.count();
        
        if (existingContacts > 0) {
            console.log('✅ Контакты уже существуют в базе данных');
            return;
        }

        // Добавляем основные контакты
        const contacts = [
            {
                type: 'main',
                name: 'Основной контакт',
                phone: '+7 (4812) 12-34-56',
                email: 'info@codd-smolensk.ru',
                address: 'г. Смоленск, ул. Requests, 1',
                working_hours: 'пн-пт: 9:00-18:00',
                is_active: true,
                sort_order: 1
            },
            {
                type: 'documents',
                name: 'Документооборот',
                phone: '+7 (4812) 12-34-56',
                email: 'docs@codd-smolensk.ru',
                working_hours: 'пн-пт 9:00-18:00',
                is_active: true,
                sort_order: 2
            },
            {
                type: 'emergency',
                name: 'Экстренная линия',
                phone: '+7 (4812) 12-34-57',
                email: 'emergency@codd-smolensk.ru',
                working_hours: 'Круглосуточно',
                is_active: true,
                sort_order: 3
            },
            {
                type: 'department',
                name: 'Отдел документооборота',
                description: 'Обработка и регистрация документов',
                phone: '+7 (4812) 12-34-58',
                email: 'documents@codd-smolensk.ru',
                working_hours: 'пн-пт: 9:00-17:00',
                is_active: true,
                sort_order: 4
            },
            {
                type: 'department',
                name: 'Техническая поддержка',
                description: 'Поддержка информационных систем',
                phone: '+7 (4812) 12-34-59',
                email: 'support@codd-smolensk.ru',
                working_hours: 'пн-пт: 8:00-20:00',
                is_active: true,
                sort_order: 5
            },
            {
                type: 'department',
                name: 'Отдел кадров',
                description: 'Вопросы трудоустройства и кадров',
                phone: '+7 (4812) 12-34-60',
                email: 'hr@codd-smolensk.ru',
                working_hours: 'пн-пт: 9:00-18:00',
                is_active: true,
                sort_order: 6
            }
        ];

        // Добавляем контакты
        for (const contact of contacts) {
            await Contact.create(contact);
            console.log(`✅ Добавлен контакт: ${contact.name}`);
        }

        console.log('🎉 Все контакты успешно инициализированы в БД!');
    } catch (error) {
        console.error('❌ Ошибка инициализации контактов:', error);
    }
}

module.exports = { initContacts };
