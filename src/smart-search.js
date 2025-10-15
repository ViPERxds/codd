// Умный поиск по сайту
class SmartSearch {
    constructor() {
        this.apiBase = window.API_BASE || '';
        this.searchInput = null;
        this.suggestionsContainer = null;
        this.isSearching = false;
        this.searchTimeout = null;
        this.init();
    }

    init() {
        this.setupSearchInputs();
        this.setupEventListeners();
    }

    setupSearchInputs() {
        // Основной поиск в хедере
        this.searchInput = document.getElementById('site-search');
        this.suggestionsContainer = document.querySelector('[data-suggestions]');
        
        // Мобильный поиск
        this.mobileSearchInput = document.getElementById('mobile-search');
    }

    setupEventListeners() {
        if (this.searchInput) {
            this.searchInput.addEventListener('input', (e) => this.handleSearch(e));
            this.searchInput.addEventListener('focus', () => this.showSuggestions());
            this.searchInput.addEventListener('blur', (e) => {
                // Задержка для клика по предложению
                setTimeout(() => this.hideSuggestions(), 200);
            });
        }

        if (this.mobileSearchInput) {
            this.mobileSearchInput.addEventListener('input', (e) => this.handleSearch(e));
        }

        // Закрытие поиска по Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.hideSuggestions();
            }
        });

        // Клик вне поиска
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.search')) {
                this.hideSuggestions();
            }
        });
    }

    handleSearch(e) {
        const query = e.target.value.trim();
        
        if (query.length < 2) {
            this.hideSuggestions();
            return;
        }

        // Дебаунс поиска
        clearTimeout(this.searchTimeout);
        this.searchTimeout = setTimeout(() => {
            this.performSearch(query);
        }, 300);
    }

    async performSearch(query) {
        if (this.isSearching) return;
        
        this.isSearching = true;
        this.showLoading();

        try {
            const response = await fetch(`${this.apiBase}/api/search?q=${encodeURIComponent(query)}`);
            if (!response.ok) throw new Error('Ошибка поиска');
            
            const data = await response.json();
            this.displayResults(data.results, query);
        } catch (error) {
            console.error('Ошибка поиска:', error);
            this.showError('Ошибка поиска. Попробуйте позже.');
        } finally {
            this.isSearching = false;
        }
    }

    displayResults(results, query) {
        if (!this.suggestionsContainer) return;

        if (results.length === 0) {
            this.suggestionsContainer.innerHTML = `
                <div class="search-no-results">
                    <div class="search-icon">🔍</div>
                    <div class="search-text">
                        <div class="search-title">Ничего не найдено</div>
                        <div class="search-subtitle">Попробуйте изменить запрос</div>
                    </div>
                </div>
            `;
        } else {
            this.suggestionsContainer.innerHTML = results.map(result => `
                <div class="search-result" data-url="${result.url}">
                    <div class="search-result-icon">${this.getIconForType(result.type)}</div>
                    <div class="search-result-content">
                        <div class="search-result-title">${this.highlightText(result.title, query)}</div>
                        <div class="search-result-description">${this.highlightText(result.description, query)}</div>
                        <div class="search-result-category">${result.category}</div>
                    </div>
                </div>
            `).join('');

            // Добавляем обработчики кликов
            this.suggestionsContainer.querySelectorAll('.search-result').forEach(item => {
                item.addEventListener('click', () => {
                    const url = item.dataset.url;
                    this.navigateToResult(url);
                });
            });
        }

        this.showSuggestions();
    }

    getIconForType(type) {
        const icons = {
            'news': '📰',
            'document': '📄',
            'project': '🏗️',
            'vacancy': '💼',
            'contact': '📞'
        };
        return icons[type] || '📄';
    }

    highlightText(text, query) {
        if (!text) return '';
        
        const regex = new RegExp(`(${query})`, 'gi');
        return text.replace(regex, '<mark>$1</mark>');
    }

    navigateToResult(url) {
        if (url.startsWith('#')) {
            // Якорная ссылка
            const targetId = url.substring(1);
            const element = document.getElementById(targetId);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth' });
            }
        } else if (url.includes('#')) {
            // Ссылка с якорем
            const [page, anchor] = url.split('#');
            window.location.href = page;
            setTimeout(() => {
                const element = document.getElementById(anchor);
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth' });
                }
            }, 100);
        } else {
            // Обычная ссылка
            window.location.href = url;
        }
        
        this.hideSuggestions();
        this.clearSearch();
    }

    showLoading() {
        if (!this.suggestionsContainer) return;
        
        this.suggestionsContainer.innerHTML = `
            <div class="search-loading">
                <div class="search-spinner"></div>
                <div class="search-text">Поиск...</div>
            </div>
        `;
        this.showSuggestions();
    }

    showError(message) {
        if (!this.suggestionsContainer) return;
        
        this.suggestionsContainer.innerHTML = `
            <div class="search-error">
                <div class="search-icon">⚠️</div>
                <div class="search-text">${message}</div>
            </div>
        `;
        this.showSuggestions();
    }

    showSuggestions() {
        if (this.suggestionsContainer) {
            this.suggestionsContainer.hidden = false;
        }
    }

    hideSuggestions() {
        if (this.suggestionsContainer) {
            this.suggestionsContainer.hidden = true;
        }
    }

    clearSearch() {
        if (this.searchInput) {
            this.searchInput.value = '';
        }
        if (this.mobileSearchInput) {
            this.mobileSearchInput.value = '';
        }
    }
}

// Инициализация поиска
document.addEventListener('DOMContentLoaded', () => {
    new SmartSearch();
});
