// Lazy Loading System
class LazyLoader {
    constructor() {
        this.observerOptions = {
            root: null,
            rootMargin: '50px',
            threshold: 0.1
        };
        this.observer = null;
        this.loadedElements = new Set();
        this.init();
    }

    init() {
        // Создаем Intersection Observer
        if ('IntersectionObserver' in window) {
            this.observer = new IntersectionObserver(
                this.handleIntersection.bind(this),
                this.observerOptions
            );
        }

        // Инициализируем загрузку
        this.initPageLoader();
        this.setupLazyElements();
        this.observeElements();
    }

    initPageLoader() {
        // Создаем загрузочный экран
        const loader = document.createElement('div');
        loader.className = 'page-loader';
        loader.innerHTML = `
            <div class="logo">
                <img src="assets/images/logo.webp" alt="ЦОДД" class="logo-img">
            </div>
            <div class="spinner-container">
                <div class="spinner"></div>
            </div>
        `;
        
        document.body.appendChild(loader);

        // Создаем прогресс-бар
        const progressBar = document.createElement('div');
        progressBar.className = 'loading-progress';
        document.body.appendChild(progressBar);

        // Симулируем прогресс загрузки
        this.simulateLoading(progressBar, loader);
    }

    simulateLoading(progressBar, loader) {
        let progress = 0;
        const totalDuration = 2000; // 2 секунды
        const steps = [10, 25, 40, 60, 75, 85, 95, 100];
        const stepDuration = totalDuration / steps.length;
        let currentStep = 0;
        
        const interval = setInterval(() => {
            if (currentStep < steps.length) {
                progress = steps[currentStep];
                progressBar.style.width = progress + '%';
                currentStep++;
            } else {
                clearInterval(interval);
                setTimeout(() => {
                    this.hideLoader(loader);
                }, 200); // Небольшая задержка перед скрытием
            }
        }, stepDuration);
    }

    hideLoader(loader) {
        loader.classList.add('hidden');
        setTimeout(() => {
            if (loader.parentNode) {
                loader.parentNode.removeChild(loader);
            }
        }, 500);
    }

    setupLazyElements() {
        // Добавляем классы загрузки к элементам
        const heroContent = document.querySelector('.hero-content');
        if (heroContent) {
            heroContent.classList.add('loading');
        }

        const heroTitle = document.querySelector('.hero-title');
        if (heroTitle) {
            heroTitle.classList.add('loading');
        }

        const heroSubtitle = document.querySelector('.hero-subtitle');
        if (heroSubtitle) {
            heroSubtitle.classList.add('loading');
        }

        const heroCta = document.querySelector('.hero-cta');
        if (heroCta) {
            heroCta.classList.add('loading');
        }

        const heroStats = document.querySelector('.hero-stats');
        if (heroStats) {
            heroStats.classList.add('loading');
        }

        // Добавляем классы к секциям
        const sections = document.querySelectorAll('section:not(.hero)');
        sections.forEach(section => {
            section.classList.add('section-loading');
        });

        // Добавляем классы к карточкам
        const cards = document.querySelectorAll('.card, .project-card, .news-card, .stat-card');
        cards.forEach(card => {
            card.classList.add('card-loading');
        });
    }

    observeElements() {
        if (!this.observer) return;

        // Наблюдаем за секциями
        const sections = document.querySelectorAll('section');
        sections.forEach(section => {
            section.classList.add('observe-me');
            this.observer.observe(section);
        });

        // Наблюдаем за карточками
        const cards = document.querySelectorAll('.card, .project-card, .news-card, .stat-card');
        cards.forEach((card, index) => {
            card.classList.add('observe-me');
            card.classList.add(`stagger-${(index % 6) + 1}`);
            this.observer.observe(card);
        });
    }

    handleIntersection(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting && !this.loadedElements.has(entry.target)) {
                this.loadedElements.add(entry.target);
                this.animateElement(entry.target);
            }
        });
    }

    animateElement(element) {
        // Убираем классы загрузки
        element.classList.remove('loading', 'section-loading', 'card-loading', 'observe-me');
        
        // Добавляем класс загруженного состояния
        element.classList.add('loaded', 'section-loaded', 'card-loaded', 'visible');

        // Специальная обработка для hero секции
        if (element.classList.contains('hero')) {
            this.animateHeroElements();
        }

        // Добавляем задержку для staggered анимации
        const staggerClass = Array.from(element.classList).find(cls => cls.startsWith('stagger-'));
        if (staggerClass) {
            const delay = parseInt(staggerClass.split('-')[1]) * 100;
            setTimeout(() => {
                element.style.transitionDelay = '0s';
            }, delay);
        }
    }

    animateHeroElements() {
        // Анимируем элементы hero секции с задержкой
        const heroElements = [
            '.hero-content',
            '.hero-title', 
            '.hero-subtitle',
            '.hero-cta',
            '.hero-stats'
        ];

        heroElements.forEach((selector, index) => {
            const element = document.querySelector(selector);
            if (element) {
                setTimeout(() => {
                    element.classList.remove('loading');
                    element.classList.add('loaded');
                }, index * 200);
            }
        });
    }

    // Метод для принудительной загрузки элемента
    forceLoad(element) {
        if (element && !this.loadedElements.has(element)) {
            this.loadedElements.add(element);
            this.animateElement(element);
        }
    }

    // Метод для добавления skeleton loading
    addSkeleton(element, type = 'text') {
        const skeleton = document.createElement('div');
        skeleton.className = `skeleton skeleton-${type}`;
        element.appendChild(skeleton);
        return skeleton;
    }

    // Метод для удаления skeleton loading
    removeSkeleton(element) {
        const skeleton = element.querySelector('.skeleton');
        if (skeleton) {
            skeleton.remove();
        }
    }
}

// Инициализация при загрузке DOM
document.addEventListener('DOMContentLoaded', () => {
    // Небольшая задержка для плавности
    setTimeout(() => {
        new LazyLoader();
    }, 100);
});

// Экспорт для использования в других модулях
window.LazyLoader = LazyLoader;
