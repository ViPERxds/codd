// Documents Page JavaScript

class DocumentsPage {
    constructor() {
        this.currentCategory = 'all';
        this.documentsData = [];
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadDocuments();
    }

    async loadDocuments(){
        try{
            // ensure apiUtils exists (fallback)
            if (!window.apiUtils) {
                (function(){
                    function getApiBase(){ try { return window.API_BASE || ''; } catch(_) { return ''; } }
                    async function fetchNoCacheJSON(url){ const ts = Date.now(); const sep = url.includes('?') ? '&' : '?'; const res = await fetch(`${url}${sep}ts=${ts}`, { cache: 'no-store' }); if(!res.ok) throw new Error(`HTTP ${res.status}`); return res.json(); }
                    function safeGet(obj, path, fb){ try { return path.split('.').reduce((a,k)=> (a&&a[k]!==undefined?a[k]:undefined), obj) ?? fb; } catch(_) { return fb; } }
                    window.apiUtils = { getApiBase, fetchNoCacheJSON, safeGet };
                })();
            }
            const apiBase = window.apiUtils.getApiBase() || '';
            const res = await window.apiUtils.fetchNoCacheJSON(`${apiBase}/api/documents?limit=100`);
            this.documentsData = res?.data || res || [];
            this.renderDocuments();
        }catch(e){
            console.warn('Не удалось загрузить документы из API:', e);
            this.showNoDocumentsMessage();
        }
    }

    showNoDocumentsMessage() {
        const grid = document.querySelector('#documentsContainer');
        if(!grid) return;
        grid.innerHTML = '<div class="error-message"><h3>Документы не найдены</h3><p>Попробуйте обновить страницу позже</p></div>';
    }

    renderDocuments(){
        const grid = document.querySelector('#documentsContainer');
        if(!grid) return;
        const items = Array.isArray(this.documentsData) ? this.documentsData : [];
        if(items.length === 0){
            grid.innerHTML = '<div class="error-message"><h3>Документы не найдены</h3><p>В данный момент документы отсутствуют</p></div>';
            return;
        }
        grid.innerHTML = items.map(d => {
            const title = d.title || d.name || 'Документ';
            const desc = d.description || d.category || '';
            const size = d.fileSize ? `${Math.round(d.fileSize/1024)} КБ` : '';
            const dateStr = d.publishedAt || d.createdAt || d.updatedAt || d.date;
            const date = dateStr ? new Date(dateStr).toLocaleDateString('ru-RU') : '';
            const href = `${window.apiUtils?.getApiBase() || ''}/api/documents/${d.id}/download`;
            const cat = d.category || 'general';
            const type = d.fileType || '';
            return `
                <article class="document-card" data-category="${cat}">
                  <div class="document-icon">📄</div>
                  <div class="document-content">
                    <h3 class="document-title">${title}</h3>
                    <p class="document-description">${desc}</p>
                    <div class="document-meta">
                      <span class="document-date">${date}</span>
                      <span class="document-type">${type}</span>
                      <span class="document-size">${size}</span>
                    </div>
                    <div class="document-actions">
                      <a class="btn btn-primary download-btn" href="#" data-document-id="${d.id}">📥 Скачать</a>
                      <a class="btn btn-outline" href="#" data-document-id="${d.id}">👁️ Просмотр</a>
                    </div>
                  </div>
                </article>`;
        }).join('');
        // применим текущую категорию
        this.switchCategory(this.currentCategory);
    }

    setupEventListeners() {
        // Обработчики для вкладок категорий
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const category = e.target.dataset.category;
                this.switchCategory(category);
            });
        });

        // Обработчики для кнопок скачивания и просмотра
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('download-btn')) {
                e.preventDefault();
                const documentId = e.target.dataset.documentId;
                if (documentId) {
                    this.downloadDocument(documentId);
                }
            } else if (e.target.classList.contains('btn-outline') && e.target.textContent.includes('Просмотр')) {
                e.preventDefault();
                const documentId = e.target.dataset.documentId;
                if (documentId) {
                    this.viewDocument(documentId);
                }
            }
        });
    }

    async downloadDocument(documentId) {
        try {
            const apiBase = window.apiUtils?.getApiBase() || '';
            const downloadUrl = `${apiBase}/api/documents/${documentId}/download`;
            
            // Создаем временную ссылку для скачивания
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.download = '';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
        } catch (error) {
            console.error('Ошибка скачивания документа:', error);
            alert('Ошибка скачивания документа');
        }
    }

    async viewDocument(documentId) {
        try {
            const apiBase = window.apiUtils?.getApiBase() || '';
            const viewUrl = `${apiBase}/api/documents/${documentId}/view`;
            
            // Открываем документ в новой вкладке для просмотра
            window.open(viewUrl, '_blank');
            
        } catch (error) {
            console.error('Ошибка просмотра документа:', error);
            alert('Ошибка просмотра документа');
        }
    }

    switchCategory(category) {
        // Обновляем активную вкладку
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-category="${category}"]`).classList.add('active');

        // Фильтруем документы
        const documentCards = document.querySelectorAll('.document-card');
        
        documentCards.forEach(card => {
            const cardCategory = card.dataset.category;
            
            if (category === 'all' || cardCategory === category) {
                card.classList.remove('hidden');
                card.style.animation = 'fadeInUp 0.6s ease forwards';
            } else {
                card.classList.add('hidden');
            }
        });

        this.currentCategory = category;
    }
}

// Инициализация страницы документов
document.addEventListener('DOMContentLoaded', () => {
    if (document.querySelector('.documents-section')) {
        window.documentsPage = new DocumentsPage();
    }
});