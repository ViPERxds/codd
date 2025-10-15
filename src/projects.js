// Загрузка проектов для главной страницы
class HomeProjectsLoader {
    constructor() {
        this.apiBase = '';
        this.init();
    }

    async init() {
        try {
            await this.loadProjects();
        } catch (error) {
            console.error('Ошибка загрузки проектов:', error);
            this.showFallbackProjects();
        }
    }

    async loadProjects() {
        try {
            const response = await fetch(`${this.apiBase}/api/projects`);
            if (!response.ok) throw new Error('Ошибка загрузки проектов');
            
            const data = await response.json();
            let projects = Array.isArray(data.data) ? data.data : 
                           Array.isArray(data.projects) ? data.projects : 
                           Array.isArray(data) ? data : [];
            // Фильтр: скрываем демо-проекты (хардкод)
            const blacklistProjectTitles = new Set([
                'Модернизация светофорной сети'
            ]);
            projects = projects.filter(p => !blacklistProjectTitles.has(String(p.title || p.name || '').trim()));
            
            const limitedProjects = projects.slice(0, 4);
            this.renderProjects(limitedProjects);
        } catch (error) {
            console.error('Ошибка загрузки проектов из API:', error);
            // Без хардкода: просто показываем сообщение об ошибке
            const container = document.querySelector('.projects-grid');
            if (container) {
                container.innerHTML = '<p class="text-center muted">Не удалось загрузить проекты</p>';
            }
        }
    }

    renderProjects(projects) {
        const container = document.querySelector('.projects-grid');
        if (!container) return;

        if (projects.length === 0) {
            container.innerHTML = '<p class="text-center muted">Проекты не найдены</p>';
            return;
        }

        // Показываем skeleton loading
        this.showSkeletonLoading(container, projects.length);

        // Имитируем задержку загрузки для демонстрации
        setTimeout(() => {
            container.innerHTML = projects.map((project, index) => `
                <article class="project-card card-loading stagger-${(index % 6) + 1}">
                    <div class="project-image">
                        <img src="${project.image || project.cover || 'assets/images/project-default.jpg'}" alt="${project.title || 'Проект'}" loading="lazy">
                    </div>
                    <div class="project-content">
                        <h3 class="project-title">${project.title || 'Проект'}</h3>
                        <p class="project-description">${project.description || 'Описание проекта'}</p>
                        <div class="project-meta">
                            <span class="project-status ${project.status || 'in-progress'}">${this.getStatusText(project.status)}</span>
                            <span class="project-date">${this.formatDate(project.createdAt || project.updatedAt)}</span>
                        </div>
                    </div>
                </article>
            `).join('');

            // Анимируем появление карточек
            this.animateProjectCards();
        }, 800);
    }

    showSkeletonLoading(container, count) {
        container.innerHTML = Array.from({ length: count }, (_, index) => `
            <article class="project-card skeleton-card">
                <div class="skeleton skeleton-card" style="height: 200px; margin-bottom: 1em;"></div>
                <div class="skeleton skeleton-title"></div>
                <div class="skeleton skeleton-text"></div>
                <div class="skeleton skeleton-text" style="width: 60%;"></div>
            </article>
        `).join('');
    }

    animateProjectCards() {
        const cards = document.querySelectorAll('.project-card');
        cards.forEach((card, index) => {
            setTimeout(() => {
                card.classList.remove('card-loading');
                card.classList.add('card-loaded');
            }, index * 100);
        });
    }

    showFallbackProjects() {}

    getStatusText(status) {
        const statusMap = {
            'in-progress': 'В разработке',
            'completed': 'Завершен',
            'planning': 'Планируется',
            'on-hold': 'Приостановлен'
        };
        return statusMap[status] || 'В разработке';
    }

    formatDate(dateString) {
        if (!dateString) return '2024';
        const date = new Date(dateString);
        return date.getFullYear().toString();
    }
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    const projectsContainer = document.querySelector('.projects-grid');
    if (projectsContainer) {
        new HomeProjectsLoader();
    }
});