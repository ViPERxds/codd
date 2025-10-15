const { Project } = require('../backend/models');

async function initProjects() {
    try {
        // Проверяем, есть ли уже проекты
        const existingProjects = await Project.count();
        if (existingProjects > 0) {
            console.log('Проекты уже существуют в базе данных');
            return;
        }

        // Создаем тестовые проекты
        const projects = [
            {
                title: 'Схема движения грузовиков',
                description: 'Разработка и внедрение схемы движения грузового транспорта по территории Смоленской области с целью оптимизации логистических маршрутов и снижения нагрузки на дорожную сеть.',
                shortDescription: 'Оптимизация грузовых маршрутов',
                category: 'infrastructure',
                status: 'in_progress',
                startDate: '2024-01-15',
                endDate: '2024-12-31',
                budget: 5000000.00,
                spentAmount: 2500000.00,
                progress: 50,
                district: 'Смоленский район',
                isPublic: true,
                isFeatured: true,
                benefits: ['Снижение нагрузки на дороги', 'Оптимизация логистики', 'Улучшение экологии'],
                responsiblePerson: 'Иванов И.И.',
                contactInfo: 'ivanov@codd-smolensk.ru'
            },
            {
                title: 'Портал о велокультуре',
                description: 'Создание информационного портала для популяризации велосипедного движения в Смоленской области. Включает карты веломаршрутов, информацию о велоинфраструктуре и мероприятиях.',
                shortDescription: 'Популяризация велосипедного движения',
                category: 'social',
                status: 'completed',
                startDate: '2023-06-01',
                endDate: '2024-03-31',
                budget: 1500000.00,
                spentAmount: 1500000.00,
                progress: 100,
                district: 'Вся область',
                isPublic: true,
                isFeatured: true,
                benefits: ['Популяризация ЗОЖ', 'Развитие велоинфраструктуры', 'Улучшение экологии'],
                responsiblePerson: 'Петрова А.А.',
                contactInfo: 'petrova@codd-smolensk.ru'
            },
            {
                title: 'Зеленое кольцо',
                description: 'Создание кольцевого веломаршрута вокруг города Смоленска протяженностью 50 км. Маршрут будет проходить через парки, скверы и живописные места области.',
                shortDescription: 'Кольцевой веломаршрут вокруг Смоленска',
                category: 'environment',
                status: 'planning',
                startDate: '2025-04-01',
                endDate: '2025-10-31',
                budget: 3000000.00,
                spentAmount: 0.00,
                progress: 0,
                district: 'Смоленский район',
                isPublic: true,
                isFeatured: false,
                benefits: ['Развитие туризма', 'Улучшение экологии', 'Популяризация ЗОЖ'],
                responsiblePerson: 'Сидоров В.В.',
                contactInfo: 'sidorov@codd-smolensk.ru'
            },
            {
                title: 'Инновационный центр «Безопасный транспорт»',
                description: 'Создание центра исследований и разработок в области безопасности дорожного движения. Центр будет заниматься разработкой новых технологий и методов повышения безопасности на дорогах.',
                shortDescription: 'Центр исследований безопасности дорожного движения',
                category: 'technology',
                status: 'in_progress',
                startDate: '2024-03-01',
                endDate: '2025-12-31',
                budget: 10000000.00,
                spentAmount: 3000000.00,
                progress: 30,
                district: 'Смоленский район',
                isPublic: true,
                isFeatured: true,
                benefits: ['Повышение безопасности', 'Развитие технологий', 'Создание рабочих мест'],
                responsiblePerson: 'Козлов С.С.',
                contactInfo: 'kozlov@codd-smolensk.ru'
            },
            {
                title: 'Система мониторинга дорожного покрытия',
                description: 'Внедрение системы автоматического мониторинга состояния дорожного покрытия с использованием датчиков и ИИ-анализа для своевременного выявления проблем и планирования ремонта.',
                shortDescription: 'Автоматический мониторинг дорог',
                category: 'technology',
                status: 'in_progress',
                startDate: '2024-02-01',
                endDate: '2024-11-30',
                budget: 8000000.00,
                spentAmount: 4000000.00,
                progress: 60,
                district: 'Вся область',
                isPublic: true,
                isFeatured: false,
                benefits: ['Своевременный ремонт', 'Экономия средств', 'Повышение качества дорог'],
                responsiblePerson: 'Морозов Д.Д.',
                contactInfo: 'morozov@codd-smolensk.ru'
            },
            {
                title: 'Экологически чистый общественный транспорт',
                description: 'Запуск пилотного проекта по внедрению экологически чистого общественного транспорта (электробусы) на маршрутах города Смоленска.',
                shortDescription: 'Внедрение электробусов',
                category: 'environment',
                status: 'planning',
                startDate: '2025-01-01',
                endDate: '2025-12-31',
                budget: 12000000.00,
                spentAmount: 0.00,
                progress: 0,
                district: 'Смоленский район',
                isPublic: true,
                isFeatured: false,
                benefits: ['Снижение выбросов', 'Улучшение экологии', 'Современный транспорт'],
                responsiblePerson: 'Волкова Е.Е.',
                contactInfo: 'volkova@codd-smolensk.ru'
            }
        ];

        // Создаем проекты в базе данных
        for (const projectData of projects) {
            await Project.create(projectData);
        }

        console.log(`Создано ${projects.length} проектов в базе данных`);
    } catch (error) {
        console.error('Ошибка инициализации проектов:', error);
    }
}

module.exports = { initProjects };
