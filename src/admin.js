// Admin Panel JavaScript

class AdminPanel {
    constructor() {
        this.newsData = null;
        this.currentTab = 'list';
        this.editingNewsId = null;
        this.init();
    }

    async init() {
        try {
            await this.loadNewsData();
            this.setupEventListeners();
            this.renderNewsList();
            this.updateStats();
            this.setDefaultDate();
        } catch (error) {
            console.error('Ошибка инициализации панели:', error);
            this.showNotification('Ошибка загрузки данных', 'error');
        }
    }

    async loadNewsData() {
        try {
            const response = await fetch('src/news-data.json');
            if (!response.ok) {
                throw new Error('Не удалось загрузить данные');
            }
            this.newsData = await response.json();
        } catch (error) {
            console.warn('Не удалось загрузить JSON файл, используем встроенные данные:', error);
            // Fallback - встроенные данные
            this.newsData = {
                "news": [
                    {
                        "id": 1,
                        "title": "В Смоленске запущена система умных светофоров",
                        "excerpt": "На 10 перекрёстках города установлены адаптивные светофоры, которые автоматически регулируют время сигналов в зависимости от интенсивности движения. Это позволит сократить время ожидания на 30%.",
                        "content": "Сегодня в Смоленске состоялся запуск инновационной системы адаптивных светофоров. Проект реализован Центром организации дорожного движения Смоленской области в рамках программы \"Умный город\".\n\n## Технические особенности\n\nНовые светофоры оснащены:\n- Датчиками движения для подсчета транспорта в реальном времени\n- Камерами видеонаблюдения с функцией распознавания\n- Системой связи с центральным диспетчерским пунктом\n- Алгоритмами машинного обучения для оптимизации циклов\n\n## Результаты внедрения\n\nЗа первые дни работы система показала отличные результаты:\n- Сокращение времени ожидания на 30%\n- Уменьшение пробок на 25%\n- Снижение выбросов CO2 на 15%\n- Повышение безопасности дорожного движения",
                        "date": "2025-01-15",
                        "category": "Технологии",
                        "tags": ["Умные светофоры", "Технологии", "Смоленск", "Транспорт"],
                        "featured": true,
                        "image": "🚦"
                    },
                    {
                        "id": 2,
                        "title": "Установлены новые камеры на опасных участках",
                        "excerpt": "В рамках программы повышения безопасности дорожного движения установлено 15 новых камер видеонаблюдения на аварийно-опасных участках дорог.",
                        "content": "ЦОДД Смоленской области продолжает работу по повышению безопасности дорожного движения. На этой неделе завершена установка 15 новых камер видеонаблюдения на наиболее аварийно-опасных участках дорог региона.",
                        "date": "2025-01-12",
                        "category": "Безопасность",
                        "tags": ["Камеры", "Безопасность", "Видеонаблюдение"],
                        "featured": false,
                        "image": "📹"
                    }
                ]
            };
        }
    }

    async saveNewsData() {
        try {
            // В реальном проекте здесь был бы запрос к серверу
            // Пока что просто показываем уведомление
            this.showNotification('Данные сохранены локально', 'success');
            console.log('Данные для сохранения:', this.newsData);
        } catch (error) {
            this.showNotification('Ошибка сохранения', 'error');
        }
    }

    setupEventListeners() {
        // Переключение вкладок
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tab = e.target.dataset.tab;
                this.switchTab(tab);
            });
        });

        // Форма добавления новости
        document.getElementById('add-news-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addNews();
        });

        // Форма редактирования новости
        document.getElementById('edit-news-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveEdit();
        });

        // Поиск
        document.getElementById('search-news').addEventListener('input', (e) => {
            this.filterNews(e.target.value);
        });

        // Предпросмотр
        document.getElementById('preview-btn').addEventListener('click', () => {
            this.showPreview();
        });

        // Модальные окна
        document.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', () => {
                this.closeModal();
            });
        });

        // Закрытие модального окна по клику вне его
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeModal();
                }
            });
        });

        // Экспорт/импорт
        document.getElementById('export-btn').addEventListener('click', () => {
            this.exportData();
        });

        document.getElementById('import-btn').addEventListener('click', () => {
            document.getElementById('import-file').click();
        });

        document.getElementById('import-file').addEventListener('change', (e) => {
            this.importData(e.target.files[0]);
        });

        document.getElementById('backup-btn').addEventListener('click', () => {
            this.createBackup();
        });

        // Очистка подсветки ошибок при изменении полей
        document.querySelectorAll('#add-news-form input, #add-news-form textarea, #add-news-form select').forEach(field => {
            field.addEventListener('input', () => {
                field.classList.remove('field-error');
            });
        });
    }

    switchTab(tabName) {
        // Обновляем кнопки вкладок
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

        // Обновляем контент вкладок
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(`${tabName}-tab`).classList.add('active');

        this.currentTab = tabName;

        // Обновляем данные при переключении на список
        if (tabName === 'list') {
            this.renderNewsList();
        } else if (tabName === 'settings') {
            this.updateStats();
        }
    }

    renderNewsList() {
        const newsList = document.getElementById('news-list');
        if (!newsList) return;

        if (!this.newsData.news || this.newsData.news.length === 0) {
            newsList.innerHTML = `
                <div class="empty-state">
                    <h3>📰 Новостей пока нет</h3>
                    <p>Добавьте первую новость, используя вкладку "Добавить новость"</p>
                </div>
            `;
            return;
        }

        newsList.innerHTML = this.newsData.news.map(news => `
            <div class="news-item ${news.featured ? 'featured' : ''}" data-id="${news.id}">
                <div class="news-item-header">
                    <div class="news-item-info">
                        <h3>${news.title}</h3>
                        <div class="news-item-meta">
                            <span class="date">${this.formatDate(news.date)}</span>
                            <span class="category">${news.category}</span>
                            ${news.featured ? '<span class="featured-badge">Главная</span>' : ''}
                        </div>
                    </div>
                </div>
                <div class="news-item-excerpt">${news.excerpt}</div>
                <div class="news-item-actions">
                    <button class="btn btn-primary btn-sm" onclick="adminPanel.editNews(${news.id})">
                        ✏️ Редактировать
                    </button>
                    <button class="btn btn-secondary btn-sm" onclick="adminPanel.duplicateNews(${news.id})">
                        📋 Дублировать
                    </button>
                    <button class="btn btn-danger btn-sm" onclick="adminPanel.deleteNews(${news.id})">
                        🗑️ Удалить
                    </button>
                </div>
            </div>
        `).join('');
    }

    filterNews(searchTerm) {
        const newsItems = document.querySelectorAll('.news-item');
        const term = searchTerm.toLowerCase();

        newsItems.forEach(item => {
            const title = item.querySelector('h3').textContent.toLowerCase();
            const excerpt = item.querySelector('.news-item-excerpt').textContent.toLowerCase();
            
            if (title.includes(term) || excerpt.includes(term)) {
                item.style.display = 'block';
            } else {
                item.style.display = 'none';
            }
        });
    }

    addNews() {
        const formData = this.getFormData('add-news-form');
        
        if (!this.validateFormData(formData)) {
            return;
        }

        const newId = Math.max(...this.newsData.news.map(n => n.id), 0) + 1;
        const newNews = {
            id: newId,
            ...formData,
            tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag)
        };

        this.newsData.news.unshift(newNews);
        this.saveNewsData();
        this.showNotification('Новость успешно добавлена', 'success');
        this.switchTab('list');
        document.getElementById('add-news-form').reset();
        this.setDefaultDate();
    }

    editNews(id) {
        const news = this.newsData.news.find(n => n.id === id);
        if (!news) return;

        this.editingNewsId = id;
        
        // Заполняем форму редактирования
        document.getElementById('edit-news-id').value = news.id;
        document.getElementById('edit-news-title').value = news.title;
        document.getElementById('edit-news-excerpt').value = news.excerpt;
        document.getElementById('edit-news-content').value = news.content;
        document.getElementById('edit-news-date').value = news.date;
        document.getElementById('edit-news-category').value = news.category;
        document.getElementById('edit-news-tags').value = news.tags.join(', ');
        document.getElementById('edit-news-image').value = news.image || '';
        document.getElementById('edit-news-featured').checked = news.featured || false;

        this.openModal('edit-modal');
    }

    saveEdit() {
        const formData = this.getFormData('edit-news-form');
        
        if (!this.validateFormData(formData)) {
            return;
        }

        const newsIndex = this.newsData.news.findIndex(n => n.id === this.editingNewsId);
        if (newsIndex === -1) return;

        this.newsData.news[newsIndex] = {
            ...this.newsData.news[newsIndex],
            ...formData,
            tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag)
        };

        this.saveNewsData();
        this.showNotification('Новость успешно обновлена', 'success');
        this.closeModal();
        this.renderNewsList();
    }

    duplicateNews(id) {
        const news = this.newsData.news.find(n => n.id === id);
        if (!news) return;

        const newId = Math.max(...this.newsData.news.map(n => n.id), 0) + 1;
        const duplicatedNews = {
            ...news,
            id: newId,
            title: `${news.title} (копия)`,
            date: new Date().toISOString().split('T')[0],
            featured: false
        };

        this.newsData.news.unshift(duplicatedNews);
        this.saveNewsData();
        this.showNotification('Новость успешно дублирована', 'success');
        this.renderNewsList();
    }

    deleteNews(id) {
        if (!confirm('Вы уверены, что хотите удалить эту новость?')) {
            return;
        }

        const newsIndex = this.newsData.news.findIndex(n => n.id === id);
        if (newsIndex === -1) return;

        this.newsData.news.splice(newsIndex, 1);
        this.saveNewsData();
        this.showNotification('Новость успешно удалена', 'success');
        this.renderNewsList();
    }

    getFormData(formId) {
        const form = document.getElementById(formId);
        const formData = new FormData(form);
        
        return {
            title: formData.get('news-title') || formData.get('edit-news-title') || '',
            excerpt: formData.get('news-excerpt') || formData.get('edit-news-excerpt') || '',
            content: formData.get('news-content') || formData.get('edit-news-content') || '',
            date: formData.get('news-date') || formData.get('edit-news-date') || '',
            category: formData.get('news-category') || formData.get('edit-news-category') || '',
            tags: formData.get('news-tags') || formData.get('edit-news-tags') || '',
            image: formData.get('news-image') || formData.get('edit-news-image') || '',
            featured: formData.get('news-featured') || formData.get('edit-news-featured') ? true : false
        };
    }

    validateFormData(data) {
        console.log('Валидация данных:', data); // Отладка
        
        const missingFields = [];
        
        if (!data.title || data.title.trim() === '') missingFields.push('Заголовок');
        if (!data.excerpt || data.excerpt.trim() === '') missingFields.push('Краткое описание');
        if (!data.content || data.content.trim() === '') missingFields.push('Полный текст');
        if (!data.date || data.date.trim() === '') missingFields.push('Дата');
        if (!data.category || data.category.trim() === '') missingFields.push('Категория');
        
        console.log('Незаполненные поля:', missingFields); // Отладка
        
        if (missingFields.length > 0) {
            this.showNotification(`Заполните обязательные поля: ${missingFields.join(', ')}`, 'error');
            this.highlightMissingFields(missingFields);
            return false;
        }
        return true;
    }

    highlightMissingFields(missingFields) {
        // Убираем предыдущую подсветку
        document.querySelectorAll('.field-error').forEach(field => {
            field.classList.remove('field-error');
        });

        // Подсвечиваем незаполненные поля
        missingFields.forEach(fieldName => {
            let fieldId = '';
            switch(fieldName) {
                case 'Заголовок':
                    fieldId = 'news-title';
                    break;
                case 'Краткое описание':
                    fieldId = 'news-excerpt';
                    break;
                case 'Полный текст':
                    fieldId = 'news-content';
                    break;
                case 'Дата':
                    fieldId = 'news-date';
                    break;
                case 'Категория':
                    fieldId = 'news-category';
                    break;
            }
            
            if (fieldId) {
                const field = document.getElementById(fieldId);
                if (field) {
                    field.classList.add('field-error');
                    field.focus();
                }
            }
        });
    }

    showPreview() {
        const formData = this.getFormData('add-news-form');
        
        if (!this.validateFormData(formData)) {
            return;
        }

        const previewContent = document.getElementById('preview-content');
        previewContent.innerHTML = `
            <div class="preview-news">
                <div class="preview-header">
                    <h2>${formData.title}</h2>
                    <div class="preview-meta">
                        <span class="date">${this.formatDate(formData.date)}</span>
                        <span class="category">${formData.category}</span>
                        ${formData.featured ? '<span class="featured-badge">Главная новость</span>' : ''}
                    </div>
                </div>
                <div class="preview-excerpt">
                    <p>${formData.excerpt}</p>
                </div>
                <div class="preview-content">
                    ${this.convertMarkdownToHTML(formData.content)}
                </div>
                <div class="preview-tags">
                    ${formData.tags.split(',').map(tag => `<span class="tag">${tag.trim()}</span>`).join('')}
                </div>
            </div>
        `;

        this.openModal('preview-modal');
    }

    convertMarkdownToHTML(text) {
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

    updateStats() {
        if (!this.newsData.news) return;

        document.getElementById('total-news').textContent = this.newsData.news.length;
        document.getElementById('featured-news').textContent = this.newsData.news.filter(n => n.featured).length;
        
        const categories = new Set(this.newsData.news.map(n => n.category));
        document.getElementById('categories-count').textContent = categories.size;
    }

    setDefaultDate() {
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('news-date').value = today;
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('ru-RU', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    openModal(modalId) {
        document.getElementById(modalId).classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    closeModal() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.classList.remove('active');
        });
        document.body.style.overflow = 'auto';
        this.editingNewsId = null;
    }

    showNotification(message, type = 'success') {
        const notifications = document.getElementById('notifications');
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;

        notifications.appendChild(notification);

        setTimeout(() => {
            notification.remove();
        }, 5000);
    }

    exportData() {
        const dataStr = JSON.stringify(this.newsData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `news-backup-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        
        URL.revokeObjectURL(url);
        this.showNotification('Данные экспортированы', 'success');
    }

    importData(file) {
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importedData = JSON.parse(e.target.result);
                if (importedData.news && Array.isArray(importedData.news)) {
                    this.newsData = importedData;
                    this.saveNewsData();
                    this.renderNewsList();
                    this.updateStats();
                    this.showNotification('Данные успешно импортированы', 'success');
                } else {
                    throw new Error('Неверный формат файла');
                }
            } catch (error) {
                this.showNotification('Ошибка импорта файла', 'error');
            }
        };
        reader.readAsText(file);
    }

    createBackup() {
        const backup = {
            ...this.newsData,
            backupDate: new Date().toISOString(),
            version: '1.0'
        };

        const dataStr = JSON.stringify(backup, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `news-backup-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
        link.click();
        
        URL.revokeObjectURL(url);
        this.showNotification('Резервная копия создана', 'success');
    }
}

// Инициализация панели администратора
document.addEventListener('DOMContentLoaded', () => {
    window.adminPanel = new AdminPanel();
});

// Глобальные функции для вызова из HTML
window.editNews = (id) => window.adminPanel.editNews(id);
window.duplicateNews = (id) => window.adminPanel.duplicateNews(id);
window.deleteNews = (id) => window.adminPanel.deleteNews(id);
