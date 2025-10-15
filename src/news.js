// News System - Dynamic Loading and Display

// uses window.apiUtils; provide fallback if не подключен utils.js
if (!window.apiUtils) {
    (function(){
        function getApiBase(){ try { return window.API_BASE || ''; } catch(_) { return ''; } }
        async function fetchNoCacheJSON(url){ const ts = Date.now(); const sep = url.includes('?') ? '&' : '?'; const res = await fetch(`${url}${sep}ts=${ts}`, { cache: 'no-store' }); if(!res.ok) throw new Error(`HTTP ${res.status}`); return res.json(); }
        function safeGet(obj, path, fb){ try { return path.split('.').reduce((a,k)=> (a&&a[k]!==undefined?a[k]:undefined), obj) ?? fb; } catch(_) { return fb; } }
        window.apiUtils = { getApiBase, fetchNoCacheJSON, safeGet };
    })();
}

class NewsSystem {
    constructor() {
        this.newsData = null;
        this.currentPage = 1;
        this.newsPerPage = 6;
        this.init();
    }

    async init() {
        try {
            await this.loadNewsData();
            this.renderNews();
            this.setupEventListeners();
        } catch (error) {
            console.error('Ошибка загрузки новостей:', error);
            this.showError();
        }
    }

    async loadNewsData() {
        try {
            const apiBase = window.apiUtils?.getApiBase() || '';
            const apiData = await window.apiUtils.fetchNoCacheJSON(`${apiBase}/api/news`);
            let items = apiData.data || apiData || [];
            // Фильтр: скрываем демо-новости (хардкод)
            const blacklistTitles = new Set([
                'Новые проекты развития дорожной инфраструктуры',
                'Внедрение умных светофоров',
                'Строительство новых парковок',
                '3213'
            ]);
            items = (Array.isArray(items) ? items : []).filter(n => !blacklistTitles.has(String(n.title || '').trim()));
            this.newsData = { news: items };
            console.log('[News] API loaded:', this.newsData);
            return;
        } catch (error) {
            console.error('Ошибка загрузки данных новостей из API:', error);
            this.newsData = { news: [] };
        }
    }

    renderNews() {
        const newsGrid = document.querySelector('.news-grid');
        if (!newsGrid) return;

        console.log('Rendering news, data:', this.newsData);
        
        if (!this.newsData || !this.newsData.news) {
            console.error('No news data available');
            return;
        }

        const startIndex = (this.currentPage - 1) * this.newsPerPage;
        const endIndex = startIndex + this.newsPerPage;
        const newsToShow = this.newsData.news.slice(startIndex, endIndex);

        console.log('News to show:', newsToShow);

        newsGrid.innerHTML = '';

        newsToShow.forEach((news, index) => {
            const newsCard = this.createNewsCard(news, index);
            newsGrid.appendChild(newsCard);
        });

        this.updatePagination();
    }

    createNewsCard(news, index) {
        const article = document.createElement('article');
        article.className = `news-card ${news.isFeatured ? 'featured' : ''}`;
        
        const categoryClass = this.getCategoryClass(news.category);
        const date = news.publishedAt || news.date || new Date().toISOString();
        const tags = news.tags || [];
        const cover = window.apiUtils?.resolveMediaUrl ? window.apiUtils.resolveMediaUrl(news.image || news.cover || news.images || news.imageUrl) : (news.image || news.cover || (Array.isArray(news.images) && news.images[0]) || news.imageUrl || '');
        
        article.innerHTML = `
            <div class="news-image">
                ${cover ? `<img src="${cover}" alt="${news.title || 'Новость'}" loading="lazy">` : ''}
                <div class="news-category ${categoryClass}">${this.getCategoryName(news.category)}</div>
            </div>
            <div class="news-content">
                <div class="news-meta">
                    <time datetime="${date}">${this.formatDate(date)}</time>
                    ${tags.length > 0 ? `<span class="news-tag">${tags[0]}</span>` : ''}
                </div>
                <h3 class="news-title">${news.title}</h3>
                <p class="news-excerpt">${news.excerpt}</p>
                <a href="news-detail.html?id=${news.id}" class="news-link" target="_blank">Читать далее</a>
            </div>
        `;

        // Добавляем анимацию появления
        article.style.animationDelay = `${index * 0.1}s`;

        return article;
    }

    getCategoryClass(category) {
        const categoryMap = {
            'Технологии': 'technology',
            'Безопасность': 'safety',
            'Транспорт': 'transport',
            'Инфраструктура': 'infrastructure',
            'Экология': 'ecology',
            'Мобильные сервисы': 'mobile',
            'Дорожная безопасность': 'safety',
            'Цифровизация': 'digital',
            'technology': 'technology',
            'safety': 'safety',
            'infrastructure': 'infrastructure',
            'general': 'general'
        };
        return categoryMap[category] || 'default';
    }

    getCategoryName(category) {
        const categoryMap = {
            'technology': 'Технологии',
            'safety': 'Безопасность',
            'infrastructure': 'Инфраструктура',
            'transport': 'Транспорт',
            'ecology': 'Экология',
            'mobile': 'Мобильные сервисы',
            'digital': 'Цифровизация',
            'general': 'Общее',
            'Технологии': 'Технологии',
            'Безопасность': 'Безопасность',
            'Инфраструктура': 'Инфраструктура',
            'Транспорт': 'Транспорт',
            'Экология': 'Экология',
            'Мобильные сервисы': 'Мобильные сервисы',
            'Цифровизация': 'Цифровизация',
            'Общее': 'Общее'
        };
        return categoryMap[category] || category || 'Общее';
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        const options = { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        };
        return date.toLocaleDateString('ru-RU', options);
    }

    updatePagination() {
        const totalPages = Math.ceil(this.newsData.news.length / this.newsPerPage);
        const paginationInfo = document.querySelector('.pagination-info');
        const prevBtn = document.querySelector('.pagination-btn:first-child');
        const nextBtn = document.querySelector('.pagination-btn:last-child');

        if (paginationInfo) {
            paginationInfo.textContent = `Страница ${this.currentPage} из ${totalPages}`;
        }

        if (prevBtn) {
            prevBtn.disabled = this.currentPage === 1;
        }

        if (nextBtn) {
            nextBtn.disabled = this.currentPage === totalPages;
        }
    }

    setupEventListeners() {
        const prevBtn = document.querySelector('.pagination-btn:first-child');
        const nextBtn = document.querySelector('.pagination-btn:last-child');

        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                if (this.currentPage > 1) {
                    this.currentPage--;
                    this.renderNews();
                    this.scrollToTop();
                }
            });
        }

        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                const totalPages = Math.ceil(this.newsData.news.length / this.newsPerPage);
                if (this.currentPage < totalPages) {
                    this.currentPage++;
                    this.renderNews();
                    this.scrollToTop();
                }
            });
        }
    }

    scrollToTop() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    }

    showError() {
        const newsGrid = document.querySelector('.news-grid');
        if (newsGrid) {
            newsGrid.innerHTML = `
                <div class="error-message">
                    <h3>Ошибка загрузки новостей</h3>
                    <p>Попробуйте обновить страницу или обратитесь к администратору.</p>
                </div>
            `;
        }
    }

    // Метод для получения новости по ID (для детальной страницы)
    async getNewsById(id) {
        try {
            const apiBase = window.apiUtils?.getApiBase() || '';
            const item = await window.apiUtils.fetchNoCacheJSON(`${apiBase}/api/news/${id}`);
            // поддержка разных форматов ответа
            return item?.data || item;
        } catch (e) {
            return this.newsData?.news?.find(n => String(n.id) === String(id));
        }
    }

    // Метод для получения похожих новостей
    getRelatedNews(currentId, limit = 3) {
        return this.newsData.news
            .filter(news => news.id !== parseInt(currentId))
            .slice(0, limit);
    }
}

// Инициализация системы новостей
document.addEventListener('DOMContentLoaded', () => {
    // Проверяем, находимся ли мы на странице новостей
    if (document.querySelector('.news-grid')) {
        window.newsSystem = new NewsSystem();
    }
});

// Функция для загрузки детальной новости
async function loadNewsDetail() {
    const urlParams = new URLSearchParams(window.location.search);
    const newsId = urlParams.get('id');
    
    if (!newsId) {
        console.error('ID новости не указан');
        return;
    }

    try {
        const apiBase = window.apiUtils?.getApiBase() || '';
        const item = await window.apiUtils.fetchNoCacheJSON(`${apiBase}/api/news/${newsId}`);
        const news = item?.data || item;
        if (!news) {
            console.error('Новость не найдена');
            return;
        }
        console.log('Loaded news data:', news);
        renderNewsDetail(news);
        // Подгрузим похожие новости
        loadRelatedNews(newsId, news.category);
    } catch (error) {
        console.error('Ошибка загрузки новости из API:', error);
    }
}

function renderNewsDetail(news) {
    // Обновляем заголовок страницы
    document.title = `${news.title} - ЦОДД Смоленской области`;
    
    // Обновляем хлебные крошки
    const breadcrumb = document.querySelector('.breadcrumb');
    if (breadcrumb) {
        breadcrumb.innerHTML = `
            <a href="index.html">Главная</a>
            <span>→</span>
            <a href="news.html">Новости</a>
            <span>→</span>
            <span>${news.title}</span>
        `;
    }

    // Обновляем мета-информацию
    const newsMeta = document.querySelector('.news-meta');
    if (newsMeta) {
        const date = news.date || news.publishedAt || news.createdAt;
        const category = news.category || 'Общее';
        newsMeta.innerHTML = `
            <time datetime="${date}">${formatDate(date)}</time>
            <span class="news-category">${category}</span>
            ${news.featured ? '<span class="news-tag">Главная новость</span>' : ''}
        `;
    }

    // Обновляем заголовок
    const newsTitle = document.querySelector('.news-title');
    if (newsTitle) {
        newsTitle.textContent = news.title;
    }

    // Обновляем краткое описание
    const newsExcerpt = document.querySelector('.news-excerpt');
    if (newsExcerpt) {
        newsExcerpt.textContent = news.excerpt;
    }

    // Обновляем изображение
    const newsImageWrap = document.querySelector('.news-image');
    if (newsImageWrap) {
        const cover = window.apiUtils?.resolveMediaUrl ? window.apiUtils.resolveMediaUrl(news.image || news.cover || news.imageUrl) : (news.image || news.cover || news.imageUrl || '');
        if (cover && !cover.startsWith('🚦') && !cover.startsWith('📹')) {
            // если есть реальное изображение, заменим placeholder
            newsImageWrap.innerHTML = `<img src="${cover}" alt="${news.title}" loading="lazy">`;
        } else if (news.image && news.image.startsWith('🚦')) {
            // если это эмодзи, оставляем placeholder
            newsImageWrap.innerHTML = `
                <div class="news-image-placeholder">
                    <span class="image-icon">${news.image}</span>
                    <p>${news.title}</p>
                </div>
            `;
        }
    }

    // Обновляем контент
    const newsContent = document.querySelector('.news-content');
    if (newsContent) {
        newsContent.innerHTML = convertMarkdownToHTML(news.content || news.body || '');
        // Вложения (файлы) убраны по запросу пользователя

        // Галерея изображений убрана по запросу пользователя
    }

    // Обновляем теги
    const newsTags = document.querySelector('.news-tags');
    if (newsTags) {
        newsTags.innerHTML = news.tags.map(tag => 
            `<span class="tag">${tag}</span>`
        ).join('');
    }
}

// Рендер похожих новостей на детальной странице
async function loadRelatedNews(currentId, category) {
    const container = document.querySelector('.related-grid');
    if (!container) return;
    try {
        const apiBase = window.apiUtils?.getApiBase() || '';
        const qs = new URLSearchParams({ limit: '6', sort: '-publishedAt' });
        const res = await window.apiUtils.fetchNoCacheJSON(`${apiBase}/api/news?${qs.toString()}`);
        const list = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []);
        const filtered = list.filter(n => String(n.id) !== String(currentId) && (!category || n.category === category)).slice(0, 3);
        if (filtered.length === 0) {
            container.innerHTML = '<p class="muted">Похожие новости не найдены</p>';
            return;
        }
        const html = filtered.map(n => {
            const dateStr = n.publishedAt || n.createdAt || n.date;
            const date = dateStr ? new Date(dateStr) : null;
            const fmt = date ? date.toLocaleDateString('ru-RU', { year: 'numeric', month: 'long', day: 'numeric' }) : '';
            const cat = n.category || '';
            const title = n.title || 'Новость';
            const excerpt = n.excerpt || '';
            return `
                <article class="related-card">
                    <div class="related-meta">
                        <time datetime="${dateStr || ''}">${fmt}</time>
                        ${cat ? `<span class="related-category">${cat}</span>` : ''}
                    </div>
                    <h3><a href="news-detail.html?id=${n.id}">${title}</a></h3>
                    ${excerpt ? `<p>${excerpt}</p>` : ''}
                </article>
            `;
        }).join('');
        container.innerHTML = html;
    } catch (e) {
        console.warn('Не удалось загрузить похожие новости:', e);
        container.innerHTML = '<p class="muted">Не удалось загрузить похожие новости</p>';
    }
}

function formatDate(dateString) {
    if (!dateString) return 'Дата не указана';
    
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
        return 'Дата не указана';
    }
    
    const options = { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    };
    return date.toLocaleDateString('ru-RU', options);
}

function convertMarkdownToHTML(text) {
    // Простой конвертер Markdown в HTML
    return text
        .replace(/^## (.*$)/gim, '<h2>$1</h2>')
        .replace(/^### (.*$)/gim, '<h3>$1</h3>')
        .replace(/^\- (.*$)/gim, '<li>$1</li>')
        .replace(/^> (.*$)/gim, '<blockquote><p>$1</p></blockquote>')
        .replace(/\n\n/g, '</p><p>')
        .replace(/^(.*)$/gim, '<p>$1</p>')
        .replace(/<p><h2>/g, '<h2>')
        .replace(/<\/h2><\/p>/g, '</h2>')
        .replace(/<p><h3>/g, '<h3>')
        .replace(/<\/h3><\/p>/g, '</h3>')
        .replace(/<p><li>/g, '<li>')
        .replace(/<\/li><\/p>/g, '</li>')
        .replace(/<p><blockquote>/g, '<blockquote>')
        .replace(/<\/blockquote><\/p>/g, '</blockquote>')
        .replace(/<li>(.*?)<\/li>/g, '<ul><li>$1</li></ul>')
        .replace(/<\/ul><ul>/g, '');
}

// Инициализация детальной страницы
document.addEventListener('DOMContentLoaded', () => {
    if (window.location.pathname.includes('news-detail.html')) {
        loadNewsDetail();
    }
});
