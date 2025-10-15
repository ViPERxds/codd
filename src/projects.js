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
            container.innerHTML = projects.map((project, index) => {
                const id = project.id ?? project._id ?? '';
                const title = project.title || 'Проект';
                const cover = project.image || project.cover || 'assets/images/project-default.jpg';
                const shortDesc = project.shortDescription || project.description || 'Описание проекта';
                const budget = this.formatCurrency(project.budget || project.cost || project.price);
                return `
                <a class="news-link-card" href="project-detail.html?id=${encodeURIComponent(id)}" aria-label="Открыть проект: ${title}">
                  <article class="project-card card-loading stagger-${(index % 6) + 1}">
                    <div class="project-image">
                      <img src="${cover}" alt="${title}" loading="lazy">
                    </div>
                    <div class="project-content">
                      <h3 class="project-title">${title}</h3>
                      <p class="project-description">${shortDesc}</p>
                      <div class="project-meta">
                        <span class="project-status ${project.status || 'in-progress'}">${this.getStatusText(project.status)}</span>
                        <span class="project-date">${this.formatDate(project.createdAt || project.updatedAt)}</span>
                        ${budget ? `<span class=\"project-budget-badge\">${budget}</span>` : ''}
                      </div>
                    </div>
                  </article>
                </a>`;
            }).join('');

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

    formatCurrency(value) {
        const num = Number(String(value).toString().replace(/[^0-9.,]/g, '').replace(',', '.'));
        if (!isFinite(num) || num <= 0) return '';
        return num.toLocaleString('ru-RU') + ' ₽';
    }
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    const projectsContainer = document.querySelector('.projects-grid');
    if (projectsContainer) {
        new HomeProjectsLoader();
    }

    if (window.location.pathname.includes('project-detail.html')) {
        loadProjectDetail();
    }
});

// ===== Детальная страница проекта =====
async function loadProjectDetail() {
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id');
    if (!id) return;
    try {
        const res = await fetch(`/api/projects/${encodeURIComponent(id)}?ts=${Date.now()}`);
        const data = await res.json();
        const project = data?.data || data;
        if (!project) return;
        renderProjectDetail(project);
    } catch (e) {
        console.error('Ошибка загрузки проекта:', e);
    }
}

function renderProjectDetail(project) {
    document.title = `${project.title || 'Проект'} - ЦОДД Смоленской области`;
    const titleEl = document.querySelector('.project-title');
    if (titleEl) titleEl.textContent = project.title || 'Проект';

    const metaEl = document.querySelector('.project-meta');
    if (metaEl) {
        const status = project.status || 'in-progress';
        const budget = (new HomeProjectsLoader()).formatCurrency(project.budget || project.cost || project.price);
        metaEl.innerHTML = `
          <span class="project-status ${status}">${(new HomeProjectsLoader()).getStatusText(status)}</span>
          ${budget ? `<span class=\"project-budget-badge\">${budget}</span>` : ''}
        `;
    }

    const imageWrap = document.querySelector('.project-image');
    if (imageWrap) {
        const raw = project.image || project.cover || project.projectCover || project.imageUrl || project.coverUrl;
        const cover = (window.apiUtils && window.apiUtils.resolveMediaUrl) ? window.apiUtils.resolveMediaUrl(raw) : raw;
        if (cover) {
            imageWrap.innerHTML = `<img src="${cover}" alt="${project.title || 'Проект'}" loading="lazy">`;
            imageWrap.style.display = '';
        } else {
            imageWrap.style.display = 'none';
        }
    }

    // Краткое описание на детальной странице не показываем
    const shortEl = document.querySelector('.project-short');
    if (shortEl) shortEl.remove();

    const contentEl = document.querySelector('.project-content-body');
    if (contentEl) {
        const full = project.detailedDescription || project.details || project.content || project.body || project.longDescription || '';
        const html = String(full || '').trim();
        contentEl.innerHTML = html ? html.replace(/\n/g, '<br>') : (project.shortDescription || project.description || '');
    }
}