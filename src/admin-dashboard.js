// Admin Dashboard JavaScript
class AdminDashboard {
    constructor() {
        this.apiBase = window.API_BASE || '';
        this.currentUser = null;
        this.userRole = localStorage.getItem('userRole') || 'guest';
        this.finesAllRows = null;
        this.evacuationsAllRows = null;
        this.currentSection = 'dashboard';
        this.charts = {};
        this.isInitialized = false;
        this.init();
    }

    renderCustomReportChart(stats, opts) {
        const canvas = document.getElementById('customReportChart');
        if (!canvas) return;
        const ctx = canvas.getContext && canvas.getContext('2d');
        if (!ctx) return;

        const monthly = Array.isArray(stats?.current?.monthly) ? stats.current.monthly : [];
        const cmpMonthly = Array.isArray(stats?.compare?.monthly) ? stats.compare.monthly : [];
        const monthLabels = ['Янв','Фев','Мар','Апр','Май','Июн','Июл','Авг','Сен','Окт','Ноя','Дек'];
        const buildSeries = (arr, field) => {
            const res = new Array(12).fill(0);
            arr.forEach(item => {
                const m = (item?.month ? Number(item.month) : (item?.date ? (new Date(item.date).getMonth()+1) : 0)) - 1;
                if (m >= 0 && m < 12) res[m] = Number(item[field] || 0);
            });
            return res;
        };

        const valuesField = opts.metric;
        const currentVals = buildSeries(monthly, valuesField);
        const compareVals = buildSeries(cmpMonthly, valuesField);

        if (this.charts.custom) { this.charts.custom.destroy(); }

        const datasets = [
            {
                label: `${opts.dataset === 'fines' ? 'Штрафы' : 'Эвакуации'} ${stats?.period?.year || ''}`,
                data: currentVals,
                borderColor: '#2b7a78',
                backgroundColor: 'rgba(43, 122, 120, .15)',
                borderWidth: 2,
                tension: 0.35,
                fill: true
            }
        ];
        if (this.dashboardFiltersState?.compareEnabled) {
            datasets.push({
                label: `${opts.dataset === 'fines' ? 'Штрафы' : 'Эвакуации'} ${stats?.comparePeriod?.year || (Number(stats?.period?.year)-1) || ''}`,
                data: compareVals,
                borderColor: '#ef476f',
                backgroundColor: 'rgba(239, 71, 111, .12)',
                borderWidth: 2,
                tension: 0.35,
                fill: false
            });
        }

        const isCurrency = ['imposedAmount','collectedAmount','receiptsAmount'].includes(valuesField);
        const title = `Отчет: ${opts.dataset === 'fines' ? 'Штрафы' : 'Эвакуации'} — ${valuesField}`;

        this.charts.custom = new Chart(ctx, {
            type: opts.chartType || 'line',
            data: { labels: monthLabels, datasets },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: true, position: 'top' },
                    title: { display: true, text: title }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: isCurrency ? { callback: v => new Intl.NumberFormat('ru-RU').format(v) + ' ₽' } : {}
                    }
                },
                interaction: { intersect: false, mode: 'index' }
            }
        });
    }

    exportCustomReportToXLSX(stats, opts) {
        const monthly = Array.isArray(stats?.current?.monthly) ? stats.current.monthly : [];
        const cmpMonthly = Array.isArray(stats?.compare?.monthly) ? stats.compare.monthly : [];
        const field = opts.metric;

        const rows = [['Месяц', 'Текущий период', 'Сравнительный период']];
        for (let i = 1; i <= 12; i++) {
            const cur = monthly.find(m => Number(m.month) === i);
            const cmp = cmpMonthly.find(m => Number(m.month) === i);
            rows.push([i, cur ? Number(cur[field]||0) : 0, cmp ? Number(cmp[field]||0) : 0]);
        }

        const sheetName = `Отчет_${opts.dataset}_${field}`;
        const fileName = `${sheetName}.xlsx`;

        try {
            if (typeof XLSX === 'undefined') throw new Error('XLSX library not loaded');
            const ws = XLSX.utils.aoa_to_sheet(rows);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, sheetName.substring(0,31));
            XLSX.writeFile(wb, fileName);
        } catch (err) {
            console.error('XLSX export failed, falling back to CSV:', err);
            this.exportCustomReportToCSV(rows, sheetName);
        }
    }

    exportCustomReportToCSV(rows, sheetName) {
        const csv = rows.map(r => r.map(v => {
            const s = String(v ?? '');
            return /[",;\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
        }).join(';')).join('\n');
        const blob = new Blob(["\ufeff" + csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${sheetName}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    createEvacuationsChart(data) {
        const canvas = document.getElementById('evacuationsChart');
        if (!canvas) return;
        const ctx = canvas.getContext && canvas.getContext('2d');
        if (!ctx) return;

        const monthlyData = Array.isArray(data?.current?.monthly) ? data.current.monthly : [];
        const cmpMonthly = Array.isArray(data?.compare?.monthly) ? data.compare.monthly : [];

        const monthLabels = ['Янв','Фев','Мар','Апр','Май','Июн','Июл','Авг','Сен','Окт','Ноя','Дек'];
        const buildSeries = (arr, field) => {
            const res = new Array(12).fill(0);
            if (Array.isArray(arr)) {
                arr.forEach(item => {
                    const m = (item?.month ? Number(item.month) : (item?.date ? (new Date(item.date).getMonth()+1) : 0)) - 1;
                    if (m >= 0 && m < 12) res[m] = Number(item[field] || 0);
                });
            }
            return res;
        };
        const currentVals = buildSeries(monthlyData, 'evacuationsCount');
        const compareVals = buildSeries(cmpMonthly, 'evacuationsCount');

        if (this.charts.evac) { this.charts.evac.destroy(); }

        const datasets = [
            {
                label: `Эвакуации ${data?.period?.year || ''}`,
                data: currentVals,
                borderColor: '#1f78b4',
                backgroundColor: 'rgba(31, 120, 180, 0.12)',
                borderWidth: 2,
                tension: 0.4,
                fill: true
            }
        ];
        if (this.dashboardFiltersState?.compareEnabled) {
            datasets.push({
                label: `Эвакуации ${data?.comparePeriod?.year || (Number(data?.period?.year)-1) || ''}`,
                data: compareVals,
                borderColor: '#e31a1c',
                backgroundColor: 'rgba(227, 26, 28, 0.12)',
                borderWidth: 2,
                tension: 0.4,
                fill: false
            });
        }

        // KPI subtitle from trends
        const t = data?.trends || null;
        const sign = (v) => (v > 0 ? `+${v}` : `${v}`);
        const subtitleText = t ? `KPI: рейсы ${sign(Number(t.tripsCount||0))}%, эвакуации ${sign(Number(t.evacuationsCount||0))}%, поступления ${sign(Number(t.receiptsAmount||0))}%` : '';

        this.charts.evac = new Chart(ctx, {
            type: 'line',
            data: { labels: monthLabels, datasets },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: true, position: 'top' },
                    title: { display: true, text: 'Количество эвакуаций по месяцам' },
                    subtitle: { display: !!subtitleText, text: subtitleText }
                },
                scales: {
                    y: { beginAtZero: true },
                    x: { }
                }
            }
        });
    }

    async init() {
        console.log('AdminDashboard init started');
        await this.checkAuth();
        console.log('Auth check complete');
        this.setupEventListeners();
        console.log('Event listeners setup complete');
        this.setupRoleBasedAccess();
        console.log('Role-based access setup complete');
        this.showSection('dashboard');
        this.isInitialized = true;
    }

    setupEventListeners() {
        console.log('Setting up event listeners...');
        
        // Navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const section = e.currentTarget.dataset.section;
                this.showSection(section);
            });
        });

        // Logout
        document.getElementById('logoutBtn').addEventListener('click', () => {
            this.logout();
        });

        // Modal
        document.getElementById('modalClose').addEventListener('click', () => {
            this.hideModal();
        });

        document.getElementById('modalCancel').addEventListener('click', () => {
            this.hideModal();
        });

        document.getElementById('modalSave').addEventListener('click', () => {
            this.saveModalData();
        });

        // Add buttons
        document.getElementById('addFineBtn').addEventListener('click', () => {
            console.log('Add fine button clicked!');
            this.showAddModal('fine');
        });

        document.getElementById('addEvacuationBtn').addEventListener('click', () => {
            console.log('Add evacuation button clicked!');
            this.showAddModal('evacuation');
        });

        document.getElementById('addTrafficLightBtn').addEventListener('click', () => {
            console.log('Add traffic light button clicked!');
            this.showAddModal('traffic-light');
        });

        document.getElementById('addAccidentBtn').addEventListener('click', () => {
            console.log('Add accident button clicked!');
            this.showAddModal('accident');
        });

        // Vacancy button
        const addVacancyBtn = document.getElementById('addVacancyBtn');
        if (addVacancyBtn) {
            addVacancyBtn.addEventListener('click', () => {
                console.log('Add vacancy button clicked!');
                this.showVacancyModal();
            });
        }

        // View data button
        document.getElementById('viewData').addEventListener('click', () => {
            console.log('View data button clicked!');
            this.viewImportedData();
        });

        document.getElementById('addNewsBtn').addEventListener('click', () => {
            console.log('Add news button clicked!');
            this.showAddModal('news');
        });

        document.getElementById('addDocumentBtn').addEventListener('click', () => {
            console.log('Add document button clicked!');
            this.showAddModal('document');
        });

        document.getElementById('addProjectBtn').addEventListener('click', () => {
            console.log('Add project button clicked!');
            this.showAddModal('project');
        });

        document.getElementById('addServiceBtn').addEventListener('click', () => {
            console.log('Add service button clicked!');
            this.showAddModal('service');
        });

        // Обработчики для динамических полей формы услуги
        document.addEventListener('click', (e) => {
            if (e.target.id === 'addFormField') {
                this.addFormField();
            } else if (e.target.classList.contains('remove-field')) {
                e.target.closest('.form-field-item').remove();
            }
        });

        document.getElementById('addUserBtn').addEventListener('click', () => {
            console.log('Add user button clicked!');
            this.showAddModal('user');
        });

        document.getElementById('addTransportBtn').addEventListener('click', () => {
            console.log('Add transport button clicked!');
            this.addTransport();
        });

        // Import functionality
        this.setupImportHandlers();

        // Fines filters events
        const finesFilterBtn = document.getElementById('finesFilterBtn');
        const finesYearSel = document.getElementById('finesYearFilter');
        const finesMonthSel = document.getElementById('finesMonthFilter');
        if (finesFilterBtn) {
            finesFilterBtn.addEventListener('click', () => this.applyFinesFilters());
        }
        if (finesYearSel) {
            finesYearSel.addEventListener('change', () => this.applyFinesFilters());
        }
        if (finesMonthSel) {
            finesMonthSel.addEventListener('change', () => this.applyFinesFilters());
        }

        // Evacuations filters events
        const evacFilterBtn = document.getElementById('evacuationsFilterBtn');
        const evacYearSel = document.getElementById('evacuationsYearFilter');
        const evacMonthSel = document.getElementById('evacuationsMonthFilter');
        if (evacFilterBtn) {
            evacFilterBtn.addEventListener('click', () => this.applyEvacuationsFilters());
        }
        if (evacYearSel) {
            evacYearSel.addEventListener('change', () => this.applyEvacuationsFilters());
        }
        if (evacMonthSel) {
            evacMonthSel.addEventListener('change', () => this.applyEvacuationsFilters());
        }

        // Vacancy modal handlers
        this.setupVacancyModalHandlers();
        
        // Contact handlers
        this.setupContactEventListeners();
    }

    applyFinesFilters() {
        const year = (document.getElementById('finesYearFilter') || {}).value || '';
        const month = (document.getElementById('finesMonthFilter') || {}).value || '';
        this.loadFines({ year, month });
    }

    applyEvacuationsFilters() {
        const year = (document.getElementById('evacuationsYearFilter') || {}).value || '';
        const month = (document.getElementById('evacuationsMonthFilter') || {}).value || '';
        this.loadEvacuations({ year, month });
    }

    async checkAuth() {
        const token = localStorage.getItem('adminToken');
        if (!token) {
            window.location.href = 'admin.html';
            return;
        }

        try {
            const response = await fetch(`${this.apiBase}/api/auth/verify`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Invalid token');
            }

            const data = await response.json();
            this.currentUser = data.user;
            this.userRole = data.user.role;
            document.getElementById('userInfo').textContent = 
                `${data.user.fullName || data.user.username} (${data.user.role})`;
        } catch (error) {
            console.error('Auth error:', error);
            this.logout();
        }
    }

    logout() {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('userRole');
        localStorage.removeItem('userName');
        window.location.href = 'admin.html';
    }

    showNotification(message, type = 'info') {
        // Создаем уведомление
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        // Стили для уведомления
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 20px;
            border-radius: 8px;
            color: white;
            font-weight: 500;
            z-index: 10000;
            max-width: 300px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            animation: slideIn 0.3s ease;
        `;
        
        // Цвета в зависимости от типа
        const colors = {
            success: '#28a745',
            error: '#dc3545',
            warning: '#ffc107',
            info: '#17a2b8'
        };
        
        notification.style.backgroundColor = colors[type] || colors.info;
        
        // Добавляем анимацию
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
        `;
        document.head.appendChild(style);
        
        // Добавляем в DOM
        document.body.appendChild(notification);
        
        // Автоматически удаляем через 4 секунды
        setTimeout(() => {
            notification.style.animation = 'slideIn 0.3s ease reverse';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 4000);
    }

    setupRoleBasedAccess() {
        console.log('Setting up role-based access for role:', this.userRole);
        
        // Настраиваем доступ для редактора
        if (this.userRole === 'editor') {
            // Ограничиваем доступ к разделам аналитики и управления
            const restrictedSections = [
                'users',      // Пользователи
                'import',     // Импорт данных
                'dashboard'   // Дашборд с аналитикой
            ];
            
            restrictedSections.forEach(section => {
                const navLink = document.querySelector(`[data-section="${section}"]`);
                if (navLink) {
                    // Делаем вкладку серой и некликабельной
                    navLink.classList.add('disabled');
                    navLink.style.pointerEvents = 'none';
                    navLink.style.opacity = '0.5';
                    navLink.style.cursor = 'not-allowed';
                    
                    // Добавляем иконку замка
                    const icon = navLink.querySelector('.icon');
                    if (icon) {
                        icon.textContent = '🔒';
                    }
                }
                
                // Скрываем содержимое секций
                const sectionElement = document.getElementById(section);
                if (sectionElement) {
                    sectionElement.style.display = 'none';
                }
            });
            
            // Если редактор попал на дашборд, перенаправляем на новости
            if (this.currentSection === 'dashboard') {
                this.showSection('news');
            }
        }
    }

    showSection(section) {
        // Проверяем права доступа для редактора
        if (this.userRole === 'editor') {
            const restrictedSections = ['users', 'import', 'dashboard'];
            if (restrictedSections.includes(section)) {
                console.log('Access denied for editor to section:', section);
                this.showNotification('У вас нет прав доступа к этому разделу', 'warning');
                // Перенаправляем на доступную секцию
                section = 'news';
            }
        }

        // Update navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        const navLink = document.querySelector(`[data-section="${section}"]`);
        if (navLink) {
            navLink.classList.add('active');
        }

        // Update content
        document.querySelectorAll('.content-section').forEach(sec => {
            sec.classList.remove('active');
        });
        const sectionElement = document.getElementById(section);
        if (sectionElement) {
            sectionElement.classList.add('active');
        }

        this.currentSection = section;

        // Load section data
        this.loadSectionData(section);
    }

    async loadSectionData(section) {
        switch (section) {
            case 'dashboard':
                await this.loadDashboardData();
                break;
            case 'fines':
                await this.loadFines();
                break;
            case 'evacuations':
                await this.loadEvacuations();
                break;
            case 'traffic-lights':
                await this.loadTrafficLights();
                break;
            case 'accidents':
                await this.loadAccidents();
                break;
            case 'news':
                await this.loadNews();
                break;
            case 'documents':
                await this.loadDocuments();
                break;
            case 'projects':
                await this.loadProjects();
                break;
            case 'users':
                await this.loadUsers();
                break;
            case 'transport':
                await this.loadTransportData();
                break;
            case 'contacts':
                await this.loadContacts();
                break;
        case 'vacancies':
            await this.loadVacancies();
            break;
            case 'services':
                await this.loadServices();
                break;
            case 'orders':
                await this.loadOrders();
                break;
        }
    }

    async loadDashboardData() {
        try {
            this.showLoading();

            // Ensure filters are rendered and read state
            this.ensureDashboardFilters();
            const params = this.buildStatsParams();
            const ts = Date.now().toString();
            params.ts = ts;
            const statsQS = new URLSearchParams(params).toString();

            // Load statistics (disable cache to avoid 304 without body)
            const fetchNoCache = (url) => fetch(url, { cache: 'no-store', headers: { 'Cache-Control': 'no-cache' } });
            const [finesRes, accidentsRes, trafficLightsRes, newsRes, accidentsListRes, evacuationsStatsRes] = await Promise.all([
                fetchNoCache(`${this.apiBase}/api/fines/statistics?${statsQS}`),
                fetchNoCache(`${this.apiBase}/api/accidents/statistics?ts=${ts}`),
                fetchNoCache(`${this.apiBase}/api/traffic-lights/statistics?ts=${ts}`),
                fetchNoCache(`${this.apiBase}/api/news?ts=${ts}`),
                fetchNoCache(`${this.apiBase}/api/accidents?limit=100000&ts=${ts}`),
                fetchNoCache(`${this.apiBase}/api/evacuations/statistics?${statsQS}`)
            ]);

            const safeJson = async (res) => {
                try { return res.ok ? await res.json() : {}; } catch { return {}; }
            };
            let [finesData, accidentsData, trafficLightsData, newsData, accidentsList, evacuationsStats] = await Promise.all([
                safeJson(finesRes),
                safeJson(accidentsRes),
                safeJson(trafficLightsRes),
                safeJson(newsRes),
                safeJson(accidentsListRes),
                safeJson(evacuationsStatsRes)
            ]);

            // Fallback: если сравнение отсутствует — дотягиваем отдельно данные сравниваемого года
            if (!finesData?.compare?.monthly?.length && finesData?.period?.year) {
                const currentYearVal = parseInt(params.year || finesData.period.year || new Date().getFullYear(), 10);
                const cmpYear = (parseInt(params.compareYear || '', 10)) || (currentYearVal - 1);
                try {
                    const cmpRes = await fetchNoCache(`${this.apiBase}/api/fines/statistics?year=${cmpYear}&ts=${ts}`);
                    const cmpJson = await safeJson(cmpRes);
                    if (cmpJson?.current?.monthly?.length) {
                        finesData = {
                            ...finesData,
                            comparePeriod: { type: 'year', year: cmpYear },
                            compare: cmpJson.current
                        };
                    }
                } catch {}
            }

            // Update stats cards
            document.getElementById('totalFines').textContent = 
                this.formatCurrency(finesData.current?.total?.imposedAmount || 0);
            document.getElementById('totalAccidents').textContent = 
                accidentsData.current?.total?.accidentsCount || 0;
            document.getElementById('totalTrafficLights').textContent = 
                trafficLightsData.total || 0;
            document.getElementById('totalNews').textContent = 
                newsData.data?.length || 0;

            // Create charts
            this.createFinesChart(finesData);
            this.createAccidentsChart(accidentsData, accidentsList?.data || []);
            this.createEvacuationsChart(evacuationsStats);

        } catch (error) {
            console.error('Error loading dashboard:', error);
            this.showError('Ошибка загрузки данных дашборда');
        } finally {
            this.hideLoading();
        }
    }

    ensureDashboardFilters() {
        if (!this.dashboardFiltersState) {
            const y = new Date().getFullYear();
            this.dashboardFiltersState = {
                mode: 'year',
                year: y,
                fromDate: '',
                toDate: '',
                compareEnabled: true,
                compareMode: 'year',
                compareYear: y - 1,
                compareFromDate: '',
                compareToDate: ''
            };
        }

        let container = document.getElementById('dashboardFilters');
        if (!container) {
            container = document.createElement('div');
            container.id = 'dashboardFilters';
            container.className = 'dashboard-filters';
            const host = document.getElementById('dashboard') || document.querySelector('.content-section.active') || document.body;
            host.prepend(container);
        }

        const s = this.dashboardFiltersState;
        container.innerHTML = `
            <div class="filters-row">
                <div class="filter-block">
                    <label>Период</label>
                    <div class="filter-inline">
                        <select id="df-mode">
                            <option value="year">Год</option>
                            <option value="range">Диапазон</option>
                        </select>
                        <input id="df-year" type="number" min="2000" max="2100" value="${s.year}">
                        <input id="df-from" type="date" value="${s.fromDate}">
                        <input id="df-to" type="date" value="${s.toDate}">
                    </div>
                </div>
                <div class="filter-block">
                    <label><input id="df-compare-enabled" type="checkbox" ${s.compareEnabled ? 'checked' : ''}> Сравнить с</label>
                    <div class="filter-inline">
                        <select id="df-cmp-mode">
                            <option value="year">Год</option>
                            <option value="range">Диапазон</option>
                        </select>
                        <input id="df-cmp-year" type="number" min="2000" max="2100" value="${s.compareYear}">
                        <input id="df-cmp-from" type="date" value="${s.compareFromDate}">
                        <input id="df-cmp-to" type="date" value="${s.compareToDate}">
                    </div>
                </div>
                <div class="filter-actions">
                    <button id="df-apply" class="btn btn-primary">Применить</button>
                    <button id="df-reset" class="btn btn-ghost">Сброс</button>
                </div>
            </div>
            <div class="filters-row" style="margin-top:8px">
                <div class="filter-block" style="flex:1 1 100%">
                    <div id="rb-controls" class="report-builder">
                        <div class="rb-field">
                            <label for="rb-dataset">Набор данных</label>
                            <select id="rb-dataset">
                                <option value="fines">Штрафы</option>
                                <option value="evacuations">Эвакуации</option>
                            </select>
                        </div>
                        <div class="rb-field">
                            <label for="rb-metric">Метрика</label>
                            <select id="rb-metric">
                                <option value="imposedAmount">Сумма наложенных (₽)</option>
                                <option value="collectedAmount">Сумма взысканных (₽)</option>
                                <option value="violationsCount">Нарушения</option>
                                <option value="resolutionsCount">Постановления</option>
                                <option value="evacuationsCount">Эвакуации</option>
                                <option value="tripsCount">Выезды</option>
                            </select>
                        </div>
                        <div class="rb-field">
                            <label>Период отчета</label>
                            <div>
                                <select id="rb-mode">
                                    <option value="year">Год</option>
                                    <option value="range">Диапазон</option>
                                </select>
                                <input id="rb-year" type="number" min="2000" max="2100" value="${s.year}">
                                <input id="rb-from" type="date" value="${s.fromDate}">
                                <input id="rb-to" type="date" value="${s.toDate}">
                            </div>
                        </div>
                        <div class="rb-field">
                            <label><input id="rb-compare-enabled" type="checkbox" ${s.compareEnabled ? 'checked' : ''}> Сравнить</label>
                            <div>
                                <select id="rb-cmp-mode">
                                    <option value="year">Год</option>
                                    <option value="range">Диапазон</option>
                                </select>
                                <input id="rb-cmp-year" type="number" min="2000" max="2100" value="${s.compareYear}">
                                <input id="rb-cmp-from" type="date" value="${s.compareFromDate}">
                                <input id="rb-cmp-to" type="date" value="${s.compareToDate}">
                            </div>
                        </div>
                        <div class="rb-field">
                            <label for="rb-chart">Тип графика</label>
                            <select id="rb-chart">
                                <option value="line">Линия</option>
                                <option value="bar">Столбцы</option>
                            </select>
                        </div>
                        <div class="rb-actions">
                            <button id="rb-generate" class="btn btn-secondary">Сформировать отчет</button>
                            <button id="rb-export" class="btn btn-primary">Экспорт в Excel</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        const qs = (sel) => container.querySelector(sel);
        const applyVisibility = () => {
            qs('#df-mode').value = s.mode;
            qs('#df-cmp-mode').value = s.compareMode;
            qs('#df-year').style.display = s.mode === 'year' ? '' : 'none';
            qs('#df-from').style.display = s.mode === 'range' ? '' : 'none';
            qs('#df-to').style.display = s.mode === 'range' ? '' : 'none';
            qs('#df-cmp-year').style.display = s.compareMode === 'year' ? '' : 'none';
            qs('#df-cmp-from').style.display = s.compareMode === 'range' ? '' : 'none';
            qs('#df-cmp-to').style.display = s.compareMode === 'range' ? '' : 'none';
            qs('#df-cmp-mode').disabled = !s.compareEnabled;
            qs('#df-cmp-year').disabled = !s.compareEnabled || s.compareMode !== 'year';
            qs('#df-cmp-from').disabled = !s.compareEnabled || s.compareMode !== 'range';
            qs('#df-cmp-to').disabled = !s.compareEnabled || s.compareMode !== 'range';
        };

        container.onchange = (e) => {
            const t = e.target;
            if (t.id === 'df-mode') s.mode = t.value;
            if (t.id === 'df-year') s.year = parseInt(t.value || s.year, 10);
            if (t.id === 'df-from') s.fromDate = t.value;
            if (t.id === 'df-to') s.toDate = t.value;
            if (t.id === 'df-compare-enabled') s.compareEnabled = t.checked;
            if (t.id === 'df-cmp-mode') s.compareMode = t.value;
            if (t.id === 'df-cmp-year') s.compareYear = parseInt(t.value || s.compareYear, 10);
            if (t.id === 'df-cmp-from') s.compareFromDate = t.value;
            if (t.id === 'df-cmp-to') s.compareToDate = t.value;
            applyVisibility();
        };

        qs('#df-apply').onclick = () => {
            // Форсируем полное обновление
            if (this.charts.fines) { this.charts.fines.destroy(); this.charts.fines = null; }
            if (this.charts.accidents) { this.charts.accidents.destroy(); this.charts.accidents = null; }
            this.loadDashboardData();
        };
        qs('#df-reset').onclick = () => {
            const y = new Date().getFullYear();
            this.dashboardFiltersState = {
                mode: 'year', year: y, fromDate: '', toDate: '',
                compareEnabled: false, compareMode: 'year', compareYear: y-1,
                compareFromDate: '', compareToDate: ''
            };
            this.ensureDashboardFilters();
            this.loadDashboardData();
        };

        applyVisibility();

        // Report Builder: generate custom chart
        const applyRbVisibility = () => {
            const m = qs('#rb-mode').value;
            qs('#rb-year').style.display = m === 'year' ? '' : 'none';
            qs('#rb-from').style.display = m === 'range' ? '' : 'none';
            qs('#rb-to').style.display = m === 'range' ? '' : 'none';
            const ce = qs('#rb-compare-enabled').checked;
            qs('#rb-cmp-mode').disabled = !ce;
            const cm = qs('#rb-cmp-mode').value;
            qs('#rb-cmp-year').style.display = (ce && cm === 'year') ? '' : 'none';
            qs('#rb-cmp-from').style.display = (ce && cm === 'range') ? '' : 'none';
            qs('#rb-cmp-to').style.display = (ce && cm === 'range') ? '' : 'none';
        };

        ['rb-mode','rb-cmp-mode','rb-compare-enabled'].forEach(id => {
            const el = qs('#'+id); if (el) el.onchange = applyRbVisibility;
        });
        applyRbVisibility();

        const rbGenerate = qs('#rb-generate');
        if (rbGenerate) {
            rbGenerate.onclick = async () => {
                const dataset = qs('#rb-dataset').value;
                const metric = qs('#rb-metric').value;
                const chartType = qs('#rb-chart').value;

                // Собираем параметры периода из контролов билдера
                const p = {};
                const mode = qs('#rb-mode').value;
                if (mode === 'range' && qs('#rb-from').value && qs('#rb-to').value) {
                    p.fromDate = qs('#rb-from').value; p.toDate = qs('#rb-to').value;
                } else { p.year = qs('#rb-year').value || String(new Date().getFullYear()); }
                if (qs('#rb-compare-enabled').checked) {
                    const cm = qs('#rb-cmp-mode').value;
                    if (cm === 'range' && qs('#rb-cmp-from').value && qs('#rb-cmp-to').value) {
                        p.compareFromDate = qs('#rb-cmp-from').value; p.compareToDate = qs('#rb-cmp-to').value;
                    } else { p.compareYear = qs('#rb-cmp-year').value; }
                }

                const qsParams = new URLSearchParams({ ...p, ts: Date.now().toString() }).toString();
                const url = dataset === 'fines'
                    ? `${this.apiBase}/api/fines/statistics?${qsParams}`
                    : `${this.apiBase}/api/evacuations/statistics?${qsParams}`;

                const res = await fetch(url, { cache: 'no-store' });
                const data = await res.json().catch(() => ({}));
                this.lastCustomReport = { stats: data, opts: { dataset, metric, chartType } };
                this.renderCustomReportChart(data, { dataset, metric, chartType });
            };
        }

        const rbExport = qs('#rb-export');
        if (rbExport) {
            rbExport.onclick = () => {
                if (!this.lastCustomReport?.stats) return;
                this.exportCustomReportToXLSX(this.lastCustomReport.stats, this.lastCustomReport.opts);
            };
        }
    }

    buildStatsParams() {
        const s = this.dashboardFiltersState || {};
        const p = {};
        if (s.mode === 'range' && s.fromDate && s.toDate) {
            p.fromDate = s.fromDate; p.toDate = s.toDate;
        } else {
            p.year = String(s.year || new Date().getFullYear());
        }
        if (s.compareEnabled) {
            if (s.compareMode === 'range' && s.compareFromDate && s.compareToDate) {
                p.compareFromDate = s.compareFromDate; p.compareToDate = s.compareToDate;
            } else if (s.compareYear) {
                p.compareYear = String(s.compareYear);
            }
        }
        return p;
    }

    createFinesChart(data) {
        const canvas = document.getElementById('finesChart');
        if (!canvas) { console.error('Canvas element not found'); return; }
        const ctx = canvas.getContext && canvas.getContext('2d');
        if (!ctx) { console.error('Canvas context not available'); return; }

        // Подготовка данных с защитой от пустых значений
        const monthlyData = Array.isArray(data?.current?.monthly) ? data.current.monthly : [];
        const cmpMonthly = Array.isArray(data?.compare?.monthly) ? data.compare.monthly : [];

        // Если данных нет, делаем заглушку на 12 месяцев с нулями
        const monthLabels = ['Янв','Фев','Мар','Апр','Май','Июн','Июл','Авг','Сен','Окт','Ноя','Дек'];
        const buildSeries = (arr) => {
            const res = new Array(12).fill(0);
            if (Array.isArray(arr)) {
                arr.forEach(item => {
                    const m = (item?.month ? Number(item.month) : (item?.date ? (new Date(item.date).getMonth()+1) : 0)) - 1;
                    if (m >= 0 && m < 12) res[m] = Number(item.imposedAmount || item.amount || 0);
                });
            }
            return res;
        };
        const currentVals = buildSeries(monthlyData);
        const compareVals = buildSeries(cmpMonthly);

        if (this.charts.fines) { this.charts.fines.destroy(); }

        const datasets = [
            {
                label: `Штрафы ${data?.period?.year || ''}`,
                data: currentVals,
                borderColor: '#62a744',
                backgroundColor: 'rgba(98, 167, 68, 0.12)',
                borderWidth: 2,
                tension: 0.4,
                fill: true,
                pointBackgroundColor: '#62a744',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointRadius: 3,
                pointHoverRadius: 5
            }
        ];
        if (this.dashboardFiltersState?.compareEnabled) {
            datasets.push({
                label: `Штрафы ${data?.comparePeriod?.year || (Number(data?.period?.year)-1) || ''}`,
                data: compareVals,
                borderColor: '#ff6b6b',
                backgroundColor: 'rgba(255, 107, 107, 0.12)',
                borderWidth: 2,
                tension: 0.4,
                fill: false,
                pointBackgroundColor: '#ff6b6b',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointRadius: 3,
                pointHoverRadius: 5
            });
        }

        // KPI subtitle from backend trends
        const t = data?.trends || null;
        const sign = (v) => (v > 0 ? `+${v}` : `${v}`);
        const subtitleText = t ? `KPI: нарушений ${sign(Number(t.violationsCount||0))}%, постановлений ${sign(Number(t.resolutionsCount||0))}%, наложено ${sign(Number(t.imposedAmount||0))}%, взыскано ${sign(Number(t.collectedAmount||0))}%` : '';

        this.charts.fines = new Chart(ctx, {
            type: 'line',
            data: { labels: monthLabels, datasets },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: true, position: 'top' },
                    title: { display: true, text: 'Динамика штрафов по месяцам' },
                    subtitle: { display: !!subtitleText, text: subtitleText }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: { callback: v => new Intl.NumberFormat('ru-RU', { minimumFractionDigits: 0 }).format(v) + ' ₽' },
                        title: { display: true, text: 'Сумма, руб.' }
                    },
                    x: { title: { display: true, text: 'Месяцы' } }
                },
                interaction: { intersect: false, mode: 'index' },
                animation: { duration: 800, easing: 'easeInOutQuart' }
            }
        });
    }

    createAccidentsChart(statsData) {
        const canvas = document.getElementById('accidentsChart');
        if (!canvas) return; // блок может быть скрыт/удалён
        const ctx = canvas.getContext && canvas.getContext('2d');
        if (!ctx) return;

        // Карточка: ДТП за месяц из статистики (если есть)
        const now = new Date();
        const ym = now.getMonth() + 1;
        const monthly = statsData?.current?.monthly || [];
        const monthItem = monthly.find(m => Number(m.month) === ym);
        const monthAccidents = monthItem?.accidentsCount || 0;
        const totalAccidentsEl = document.getElementById('totalAccidents');
        if (totalAccidentsEl) totalAccidentsEl.textContent = monthAccidents;

        // Диаграмма по годам: текущий vs сравнение
        const currentYear = statsData?.currentYear || new Date().getFullYear();
        const compareYear = statsData?.compareYear || (currentYear - 1);
        const currentTotal = Number(statsData?.current?.total?.accidentsCount || 0);
        const compareTotal = Number(statsData?.compare?.total?.accidentsCount || 0);

        if (this.charts.accidents) this.charts.accidents.destroy();
        this.charts.accidents = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: [String(currentYear), String(compareYear)],
                datasets: [{
                    label: 'ДТП за год',
                    data: [currentTotal, compareTotal],
                    backgroundColor: ['rgba(98,167,68,0.8)','rgba(255,107,107,0.8)'],
                    borderColor: ['#62a744','#ff6b6b'],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false }, title: { display: true, text: 'ДТП по годам' } },
                scales: { y: { beginAtZero: true } }
            }
        });
    }

    async loadFines(params = {}) {
        try {
            // Кешируем полный набор для стабильных селектов
            if (!this.finesAllRows) {
                const resAll = await fetch(`${this.apiBase}/api/fines?limit=100000`);
                const jsonAll = await resAll.json();
                this.finesAllRows = jsonAll?.data || [];
            }

            // Получаем отфильтрованные строки для таблицы
            const search = new URLSearchParams({ limit: '100000' });
            if (params.year) search.set('year', params.year);
            if (params.month) search.set('month', params.month);
            const res = await fetch(`${this.apiBase}/api/fines?${search.toString()}`);
            const json = await res.json();
            const rows = json?.data || [];

            // Собираем годы/месяцы из ПОЛНОГО набора (не трогаем селекты при фильтрации)
            const yearsSet = new Set();
            const monthsSet = new Set();
            const extractYearMonth = (value) => {
                if (!value) return {};
                const s = String(value).trim();
                let m = s.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
                if (m) return { year: Number(m[3]), month: Number(m[2]) };
                m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
                if (m) return { year: Number(m[1]), month: Number(m[2]) };
                // DD.MM.YY or D.M.YY
                m = s.match(/^(\d{1,2})[\.](\d{1,2})[\.](\d{2})$/);
                if (m) {
                    const yy = Number(m[3]);
                    const year = 2000 + yy; // импорт даёт 24 -> 2024
                    return { year, month: Number(m[2]) };
                }
                // M/D/YY or MM/DD/YY
                m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2})$/);
                if (m) {
                    const yy = Number(m[3]);
                    const year = 2000 + yy;
                    return { year, month: Number(m[1]) };
                }
                const d = new Date(s);
                if (!Number.isNaN(d.getTime())) return { year: d.getFullYear(), month: d.getMonth() + 1 };
                return {};
            };

            this.finesAllRows.forEach(r => {
                const { year, month } = extractYearMonth(r.date);
                if (year && year >= 2000 && year <= 2100) yearsSet.add(year);
                if (month && month >= 1 && month <= 12) monthsSet.add(month);
            });

            // Заполняем селекты
            const yearSel = document.getElementById('finesYearFilter');
            const monthSel = document.getElementById('finesMonthFilter');
            if (yearSel) {
                const current = yearSel.value;
                yearSel.innerHTML = '<option value="">Все годы</option>' +
                    Array.from(yearsSet).sort((a,b)=>b-a).map(y=>`<option value="${y}">${y}</option>`).join('');
                if (current) yearSel.value = current;
            }
            if (monthSel) {
                const currentM = monthSel.value;
                const monthNames = ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'];
                monthSel.innerHTML = '<option value="">Все месяцы</option>' +
                    Array.from(monthsSet).sort((a,b)=>a-b).map(m=>`<option value="${m}">${monthNames[m-1]||m}</option>`).join('');
                if (currentM) monthSel.value = currentM;
            }

            this.renderFinesTable(rows);
        } catch (error) {
            console.error('Error loading fines:', error);
        }
    }

    renderFinesTable(fines) {
        const tbody = document.querySelector('#finesTable tbody');
        tbody.innerHTML = '';

        fines.forEach(fine => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${new Date(fine.date).toLocaleDateString('ru-RU')}</td>
                <td>${fine.violationsCount}</td>
                <td>${fine.resolutionsCount}</td>
                <td>${this.formatCurrency(fine.imposedAmount)}</td>
                <td>${this.formatCurrency(fine.collectedAmount)}</td>
                <td>${fine.district || '-'}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-sm btn-danger" onclick="adminDashboard.deleteItem('fine', ${fine.id})">Удалить</button>
                    </div>
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    async loadEvacuations(params = {}) {
        try {
            if (!this.evacuationsAllRows) {
                const resAll = await fetch(`${this.apiBase}/api/evacuations?limit=100000`);
                const jsonAll = await resAll.json();
                this.evacuationsAllRows = jsonAll?.data || [];
            }

            const search = new URLSearchParams({ limit: '100000' });
            if (params.year) search.set('year', params.year);
            if (params.month) search.set('month', params.month);
            const response = await fetch(`${this.apiBase}/api/evacuations?${search.toString()}`);
            const data = await response.json();
            const rows = data?.data || [];

            // Строим селекты на основе полного набора
            const yearsSet = new Set();
            const monthsSet = new Set();
            const extractYM = (v) => {
                if (!v) return {};
                const s = String(v).trim();
                let m = s.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
                if (m) return { year: Number(m[3]), month: Number(m[2]) };
                m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
                if (m) return { year: Number(m[1]), month: Number(m[2]) };
                m = s.match(/^(\d{1,2})[\.](\d{1,2})[\.](\d{2})$/);
                if (m) return { year: 2000 + Number(m[3]), month: Number(m[2]) };
                m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2})$/);
                if (m) return { year: 2000 + Number(m[3]), month: Number(m[1]) };
                const d = new Date(s);
                if (!Number.isNaN(d.getTime())) return { year: d.getFullYear(), month: d.getMonth() + 1 };
                return {};
            };
            this.evacuationsAllRows.forEach(r => {
                const { year, month } = extractYM(r.date);
                if (year && year >= 2000 && year <= 2100) yearsSet.add(year);
                if (month && month >= 1 && month <= 12) monthsSet.add(month);
            });

            const ySel = document.getElementById('evacuationsYearFilter');
            const mSel = document.getElementById('evacuationsMonthFilter');
            if (ySel) {
                const cur = ySel.value;
                ySel.innerHTML = '<option value="">Все годы</option>' + Array.from(yearsSet).sort((a,b)=>b-a).map(y=>`<option value="${y}">${y}</option>`).join('');
                if (cur) ySel.value = cur;
            }
            if (mSel) {
                const curM = mSel.value;
                const monthNames = ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'];
                mSel.innerHTML = '<option value="">Все месяцы</option>' + Array.from(monthsSet).sort((a,b)=>a-b).map(m=>`<option value="${m}">${monthNames[m-1]||m}</option>`).join('');
                if (curM) mSel.value = curM;
            }

            this.renderEvacuationsTable(rows);
        } catch (error) {
            console.error('Error loading evacuations:', error);
        }
    }

    renderEvacuationsTable(evacuations) {
        const tbody = document.querySelector('#evacuationsTable tbody');
        tbody.innerHTML = '';

        evacuations.forEach(evacuation => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${new Date(evacuation.date).toLocaleDateString('ru-RU')}</td>
                <td>${evacuation.tripsCount}</td>
                <td>${evacuation.evacuationsCount}</td>
                <td>${this.formatCurrency(evacuation.receiptsAmount)}</td>
                <td>${evacuation.district || '-'}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-sm btn-danger" onclick="adminDashboard.deleteItem('evacuation', ${evacuation.id})">Удалить</button>
                    </div>
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    async loadTrafficLights() {
        try {
            const response = await fetch(`${this.apiBase}/api/traffic-lights`);
            const data = await response.json();
            this.renderTrafficLightsTable(data.data);
        } catch (error) {
            console.error('Error loading traffic lights:', error);
        }
    }

    renderTrafficLightsTable(trafficLights) {
        const tbody = document.querySelector('#trafficLightsTable tbody');
        tbody.innerHTML = '';

        trafficLights.forEach(light => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${light.address}</td>
                <td>${this.getTrafficLightTypeName(light.type)}</td>
                <td><span class="status-badge status-${light.status}">${this.getStatusName(light.status)}</span></td>
                <td>${new Date(light.installationDate).toLocaleDateString('ru-RU')}</td>
                <td>${light.district || '-'}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-sm btn-secondary" onclick="adminDashboard.editItem('traffic-light', ${light.id})">Изменить</button>
                        <button class="btn btn-sm btn-danger" onclick="adminDashboard.deleteItem('traffic-light', ${light.id})">Удалить</button>
                    </div>
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    async loadAccidents() {
        try {
            const response = await fetch(`${this.apiBase}/api/accidents`);
            const data = await response.json();
            this.renderAccidentsTable(data.data);
        } catch (error) {
            console.error('Error loading accidents:', error);
        }
    }

    renderAccidentsTable(accidents) {
        const tbody = document.querySelector('#accidentsTable tbody');
        tbody.innerHTML = '';

        accidents.forEach(accident => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${new Date(accident.date).toLocaleDateString('ru-RU')}</td>
                <td>${accident.accidentsCount}</td>
                <td>${accident.deathsCount}</td>
                <td>${accident.injuredCount}</td>
                <td>${accident.district || '-'}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-sm btn-secondary" onclick="adminDashboard.editItem('accident', ${accident.id})">Изменить</button>
                        <button class="btn btn-sm btn-danger" onclick="adminDashboard.deleteItem('accident', ${accident.id})">Удалить</button>
                    </div>
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    async loadNews() {
        try {
            const response = await fetch(`${this.apiBase}/api/news`);
            const data = await response.json();
            this.renderNewsTable(data.data);
        } catch (error) {
            console.error('Error loading news:', error);
        }
    }

    renderNewsTable(news) {
        const tbody = document.querySelector('#newsTable tbody');
        tbody.innerHTML = '';

        news.forEach(item => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${item.title}</td>
                <td>${this.getCategoryName(item.category)}</td>
                <td><span class="status-badge status-${item.isPublished ? 'published' : 'draft'}">${item.isPublished ? 'Опубликовано' : 'Черновик'}</span></td>
                <td>${item.publishedAt ? new Date(item.publishedAt).toLocaleDateString('ru-RU') : '-'}</td>
                <td>${item.viewsCount}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-sm btn-secondary" onclick="adminDashboard.editItem('news', ${item.id})">Изменить</button>
                        <button class="btn btn-sm btn-danger" onclick="adminDashboard.deleteItem('news', ${item.id})">Удалить</button>
                    </div>
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    async loadDocuments() {
        try {
            const response = await fetch(`${this.apiBase}/api/documents`);
            const data = await response.json();
            this.renderDocumentsTable(data.data);
        } catch (error) {
            console.error('Error loading documents:', error);
        }
    }

    renderDocumentsTable(documents) {
        const tbody = document.querySelector('#documentsTable tbody');
        tbody.innerHTML = '';

        documents.forEach(doc => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${doc.title}</td>
                <td>${this.getCategoryName(doc.category)}</td>
                <td>${doc.fileType}</td>
                <td>${this.formatFileSize(doc.fileSize)}</td>
                <td>${doc.downloadCount}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-sm btn-secondary" onclick="adminDashboard.editItem('document', ${doc.id})">Изменить</button>
                        <button class="btn btn-sm btn-danger" onclick="adminDashboard.deleteItem('document', ${doc.id})">Удалить</button>
                    </div>
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    async loadProjects() {
        try {
            const response = await fetch(`${this.apiBase}/api/projects`);
            const data = await response.json();
            this.renderProjectsTable(data.data);
        } catch (error) {
            console.error('Error loading projects:', error);
        }
    }

    renderProjectsTable(projects) {
        const tbody = document.querySelector('#projectsTable tbody');
        tbody.innerHTML = '';

        projects.forEach(project => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${project.title}</td>
                <td>${this.getCategoryName(project.category)}</td>
                <td><span class="status-badge status-${project.status}">${this.getStatusName(project.status)}</span></td>
                <td>${project.progress}%</td>
                <td>${this.formatCurrency(project.budget)}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-sm btn-secondary" onclick="adminDashboard.editItem('project', ${project.id})">Изменить</button>
                        <button class="btn btn-sm btn-danger" onclick="adminDashboard.deleteItem('project', ${project.id})">Удалить</button>
                    </div>
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    async loadUsers() {
        try {
            const res = await fetch(`${this.apiBase}/api/auth/verify`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` }
            });
            // Загрузим список пользователей через projects API у нас нет – создадим упрощённый список через /api/projects как заглушку? Нет — сделаем /api/users если есть. Попробуем /api/users.
            const listRes = await fetch(`${this.apiBase}/api/auth/users?limit=1000`, { headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` } });
            if (listRes.ok) {
                const json = await listRes.json();
                this.renderUsersTable(json.data || []);
            } else {
                // fallback: показать только текущего
                const me = await res.json();
                this.renderUsersTable(me && me.user ? [me.user] : []);
            }
        } catch (e) {
            console.error('loadUsers error', e);
            this.renderUsersTable([]);
        }
    }

    renderUsersTable(users) {
        const tbody = document.querySelector('#usersTable tbody');
        tbody.innerHTML = '';

        users.forEach(user => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${user.username}</td>
                <td>${user.email}</td>
                <td>${this.getRoleName(user.role)}</td>
                <td>${user.fullName || '-'}</td>
                <td><span class="status-badge status-${user.isActive ? 'active' : 'inactive'}">${user.isActive ? 'Активен' : 'Заблокирован'}</span></td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-sm btn-secondary" onclick="adminDashboard.editItem('user', ${user.id})">Изменить</button>
                        <button class="btn btn-sm btn-danger" onclick="adminDashboard.deleteItem('user', ${user.id})">Удалить</button>
                    </div>
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    async loadServices() {
        try {
            const response = await fetch(`${this.apiBase}/api/services`);
            const data = await response.json();
            this.renderServicesTable(data.data);
        } catch (error) {
            console.error('Error loading services:', error);
        }
    }

    renderServicesTable(services) {
        const tbody = document.querySelector('#servicesTable tbody');
        tbody.innerHTML = '';

        services.forEach(service => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${service.title}</td>
                <td>${this.getCategoryName(service.category)}</td>
                <td>${service.price || '-'}</td>
                <td><span class="status-badge status-${service.isActive ? 'active' : 'inactive'}">${service.isActive ? 'Активна' : 'Неактивна'}</span></td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-sm btn-secondary" onclick="adminDashboard.editItem('service', ${service.id})">Изменить</button>
                        <button class="btn btn-sm btn-danger" onclick="adminDashboard.deleteItem('service', ${service.id})">Удалить</button>
                    </div>
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    showAddModal(type) {
        console.log('Show add modal for:', type);
        
        let title = '';
        let content = '';
        
        switch (type) {
            case 'fine':
                title = 'Добавить запись о штрафе';
                content = this.getFineForm();
                break;
            case 'evacuation':
                title = 'Добавить запись об эвакуации';
                content = this.getEvacuationForm();
                break;
            case 'traffic-light':
                title = 'Добавить светофор';
                content = this.getTrafficLightForm();
                break;
            case 'accident':
                title = 'Добавить запись о ДТП';
                content = this.getAccidentForm();
                break;
            case 'news':
                title = 'Добавить новость';
                content = this.getNewsForm();
                break;
            case 'document':
                title = 'Добавить документ';
                content = this.getDocumentForm();
                break;
            case 'project':
                title = 'Добавить проект';
                content = this.getProjectForm();
                break;
            case 'user':
                title = 'Добавить пользователя';
                content = this.getUserForm();
                break;
            case 'service':
                title = 'Добавить услугу';
                content = this.getServiceForm();
                break;
            default:
                title = 'Добавить запись';
                content = '<p>Форма не реализована</p>';
        }
        
        console.log('About to call showModal with:', title, content);
        this.showModal(title, content);

        // Маска ₽ для бюджета проекта
        if (type === 'project') {
            const budgetInput = document.getElementById('budget');
            if (budgetInput) {
                budgetInput.addEventListener('input', () => {
                    const raw = budgetInput.value.replace(/[^0-9]/g, '');
                    if (!raw) { budgetInput.value = ''; return; }
                    const num = Number(raw);
                    budgetInput.value = new Intl.NumberFormat('ru-RU').format(num) + ' ₽';
                });
                budgetInput.addEventListener('blur', () => {
                    const raw = budgetInput.value.replace(/[^0-9]/g, '');
                    budgetInput.value = raw ? (new Intl.NumberFormat('ru-RU').format(Number(raw)) + ' ₽') : '';
                });
            }
        }
    }

    editItem(type, id) {
        const endpointMap = {
            'fine': 'fines',
            'evacuation': 'evacuations',
            'traffic-light': 'traffic-lights',
            'accident': 'accidents',
            'news': 'news',
            'document': 'documents',
            'project': 'projects',
            'user': 'users',
            'service': 'services'
        };
        const endpoint = endpointMap[type] || `${type}s`;
        fetch(`${this.apiBase}/api/${endpoint}/${id}`)
            .then(r => r.json())
            .then(item => {
                // Простая форма редактирования числовых полей для ДТП как пример
                if (type === 'accident') {
                    const content = `
                        <form id="editAccidentForm">
                            <div class="form-row">
                                <div class="form-group">
                                    <label>Погибшие</label>
                                    <input type="number" id="deathsCount" value="${item.deathsCount||0}" min="0">
                                </div>
                                <div class="form-group">
                                    <label>Пострадавшие</label>
                                    <input type="number" id="injuredCount" value="${item.injuredCount||0}" min="0">
                                </div>
                            </div>
                        </form>`;
                    this.showModal('Изменить ДТП', content);
                } else if (type === 'news') {
                    const content = `
                        <form id="editNewsForm">
                            <div class="form-group">
                                <label>Заголовок</label>
                                <input type="text" id="title" value="${item.title||''}">
                            </div>
                            <div class="form-group">
                                <label>Краткое описание</label>
                                <textarea id="excerpt" rows="3">${item.excerpt||''}</textarea>
                            </div>
                            <div class="form-group">
                                <label>Полный текст</label>
                                <textarea id="content" rows="8">${item.content||''}</textarea>
                            </div>
                        </form>`;
                    this.showModal('Изменить новость', content);
                } else if (type === 'document') {
                    const content = `
                        <form id="editDocumentForm">
                            <div class="form-group">
                                <label>Название</label>
                                <input type="text" id="title" value="${item.title||''}">
                            </div>
                            <div class="form-group">
                                <label>Описание</label>
                                <textarea id="description" rows="3">${item.description||''}</textarea>
                            </div>
                        </form>`;
                    this.showModal('Изменить документ', content);
                } else if (type === 'project') {
                    const content = `
                        <form id="editProjectForm">
                            <div class="form-group">
                                <label>Название</label>
                                <input type="text" id="title" value="${item.title||''}">
                            </div>
                            <div class="form-group">
                                <label>Описание</label>
                                <textarea id="description" rows="4">${item.description||''}</textarea>
                            </div>
                            <div class="form-row">
                                <div class="form-group">
                                    <label>Статус</label>
                                    <select id="status">
                                        <option value="planning" ${item.status==='planning'?'selected':''}>Планирование</option>
                                        <option value="in_progress" ${item.status==='in_progress'?'selected':''}>В работе</option>
                                        <option value="completed" ${item.status==='completed'?'selected':''}>Завершен</option>
                                        <option value="suspended" ${item.status==='suspended'?'selected':''}>Приостановлен</option>
                                    </select>
                                </div>
                            </div>
                        </form>`;
                    this.showModal('Изменить проект', content);
                } else if (type === 'service') {
                    const content = `
                        <form id="editServiceForm">
                            <div class="form-group">
                                <label>Название</label>
                                <input type="text" id="title" value="${item.title||''}">
                            </div>
                            <div class="form-group">
                                <label>Описание</label>
                                <textarea id="description" rows="3">${item.description||''}</textarea>
                            </div>
                            <div class="form-row">
                                <div class="form-group">
                                    <label>Категория</label>
                                    <select id="category">
                                        <option value="documentation" ${item.category === 'documentation' ? 'selected' : ''}>Документация</option>
                                        <option value="equipment" ${item.category === 'equipment' ? 'selected' : ''}>Оборудование</option>
                                        <option value="evacuation" ${item.category === 'evacuation' ? 'selected' : ''}>Эвакуация</option>
                                        <option value="consultation" ${item.category === 'consultation' ? 'selected' : ''}>Консультация</option>
                                        <option value="maintenance" ${item.category === 'maintenance' ? 'selected' : ''}>Обслуживание</option>
                                        <option value="installation" ${item.category === 'installation' ? 'selected' : ''}>Установка</option>
                                        <option value="monitoring" ${item.category === 'monitoring' ? 'selected' : ''}>Мониторинг</option>
                                        <option value="other" ${item.category === 'other' ? 'selected' : ''}>Другое</option>
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label>Цена</label>
                                    <input type="text" id="price" value="${item.price||''}">
                                </div>
                            </div>
                            <div class="form-row">
                                <div class="form-group">
                                    <label>Порядок сортировки</label>
                                    <input type="number" id="order" value="${item.order||0}">
                                </div>
                                <div class="form-group">
                                    <label>Статус</label>
                                    <select id="isActive">
                                        <option value="true" ${item.isActive ? 'selected' : ''}>Активна</option>
                                        <option value="false" ${!item.isActive ? 'selected' : ''}>Неактивна</option>
                                    </select>
                                </div>
                            </div>
                        </form>`;
                    this.showModal('Изменить услугу', content);
                } else if (type === 'user') {
                    const content = `
                        <form id="editUserForm">
                            <div class="form-group"><label>Email</label><input type="email" id="email" value="${item.email||''}"></div>
                            <div class="form-row">
                                <div class="form-group"><label>Роль</label>
                                    <select id="role">
                                        <option value="user" ${item.role==='user'?'selected':''}>Пользователь</option>
                                        <option value="editor" ${item.role==='editor'?'selected':''}>Редактор</option>
                                        <option value="admin" ${item.role==='admin'?'selected':''}>Администратор</option>
                                    </select>
                                </div>
                                <div class="form-group"><label>Статус</label>
                                    <select id="isActive">
                                        <option value="true" ${item.isActive?'selected':''}>Активен</option>
                                        <option value="false" ${!item.isActive?'selected':''}>Заблокирован</option>
                                    </select>
                                </div>
                            </div>
                        </form>`;
                    this.showModal('Изменить пользователя', content);
                } else {
                    this.showModal('Изменить запись', '<p>Редактирование будет расширено позже</p>');
                }
                const saveBtn = document.getElementById('modalSave');
                saveBtn.onclick = async () => {
                    const data = {};
                    document.querySelectorAll('#modalBody input, #modalBody select, #modalBody textarea').forEach(el=>{
                        data[el.id] = el.type==='number' ? Number(el.value||0) : el.value;
                    });
                    await fetch(`${this.apiBase}/api/${endpoint}/${id}`, {
                        method: 'PUT',
                        headers: { 'Content-Type':'application/json', 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` },
                        body: JSON.stringify(data)
                    });
                    this.hideModal();
                    this.loadSectionData(this.currentSection);
                };
            });
    }

    // Form generators
    getFineForm() {
        return `
            <form id="addFineForm">
                <div class="form-group">
                    <label for="fineDate">Дата *</label>
                    <input type="date" id="fineDate" required>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="violationsCount">Количество нарушений *</label>
                        <input type="number" id="violationsCount" required min="0">
                    </div>
                    <div class="form-group">
                        <label for="resolutionsCount">Количество постановлений *</label>
                        <input type="number" id="resolutionsCount" required min="0">
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="imposedAmount">Наложенная сумма *</label>
                        <input type="number" id="imposedAmount" required min="0" step="0.01">
                    </div>
                    <div class="form-group">
                        <label for="collectedAmount">Взысканная сумма *</label>
                        <input type="number" id="collectedAmount" required min="0" step="0.01">
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="district">Район</label>
                        <select id="district">
                            <option value="">Выберите район</option>
                            <option value="Центральный">Центральный</option>
                            <option value="Заднепровский">Заднепровский</option>
                            <option value="Промышленный">Промышленный</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="violationType">Тип нарушения</label>
                        <input type="text" id="violationType" placeholder="Например: Превышение скорости">
                    </div>
                </div>
            </form>
        `;
    }

    getEvacuationForm() {
        return `
            <form id="addEvacuationForm">
                <div class="form-group">
                    <label for="evacuationDate">Дата *</label>
                    <input type="date" id="evacuationDate" required>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="tripsCount">Количество выездов *</label>
                        <input type="number" id="tripsCount" required min="0">
                    </div>
                    <div class="form-group">
                        <label for="evacuationsCount">Количество эвакуаций *</label>
                        <input type="number" id="evacuationsCount" required min="0">
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="receiptsAmount">Сумма поступлений *</label>
                        <input type="number" id="receiptsAmount" required min="0" step="0.01">
                    </div>
                    <div class="form-group">
                        <label for="district">Район</label>
                        <select id="district">
                            <option value="">Выберите район</option>
                            <option value="Центральный">Центральный</option>
                            <option value="Заднепровский">Заднепровский</option>
                            <option value="Промышленный">Промышленный</option>
                        </select>
                    </div>
                </div>
            </form>
        `;
    }

    getTrafficLightForm() {
        return `
            <form id="addTrafficLightForm">
                <div class="form-group">
                    <label for="address">Адрес *</label>
                    <input type="text" id="address" required placeholder="ул. Примерная, д. 1">
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="type">Тип светофора *</label>
                        <select id="type" required>
                            <option value="">Выберите тип</option>
                            <option value="pedestrian">Пешеходный</option>
                            <option value="vehicle">Транспортный</option>
                            <option value="combined">Комбинированный</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="status">Статус *</label>
                        <select id="status" required>
                            <option value="active">Активен</option>
                            <option value="inactive">Неактивен</option>
                            <option value="maintenance">Обслуживание</option>
                        </select>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="installationDate">Дата установки</label>
                        <input type="date" id="installationDate">
                    </div>
                    <div class="form-group">
                        <label for="district">Район</label>
                        <select id="district">
                            <option value="">Выберите район</option>
                            <option value="Центральный">Центральный</option>
                            <option value="Заднепровский">Заднепровский</option>
                            <option value="Промышленный">Промышленный</option>
                        </select>
                    </div>
                </div>
            </form>
        `;
    }

    getAccidentForm() {
        return `
            <form id="addAccidentForm">
                <div class="form-row">
                    <div class="form-group">
                        <label for="accidentDate">Дата *</label>
                        <input type="date" id="accidentDate" required>
                    </div>
                    <div class="form-group">
                        <label for="accidentTime">Время</label>
                        <input type="time" id="accidentTime">
                    </div>
                </div>
                <div class="form-group">
                    <label for="district">Район *</label>
                    <select id="district" required>
                        <option value="">Выберите район</option>
                        <option value="Центральный">Центральный</option>
                        <option value="Заднепровский">Заднепровский</option>
                        <option value="Промышленный">Промышленный</option>
                    </select>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="type">Тип ДТП</label>
                        <input type="text" id="type" placeholder="Например: Столкновение">
                    </div>
                    <div class="form-group">
                        <label for="severity">Тяжесть *</label>
                        <select id="severity" required>
                            <option value="minor">Легкое</option>
                            <option value="moderate">Среднее</option>
                            <option value="severe">Тяжелое</option>
                            <option value="fatal">Смертельное</option>
                        </select>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="deathsCount">Количество погибших</label>
                        <input type="number" id="deathsCount" min="0" value="0">
                    </div>
                    <div class="form-group">
                        <label for="injuredCount">Количество пострадавших</label>
                        <input type="number" id="injuredCount" min="0" value="0">
                    </div>
                </div>
            </form>
        `;
    }

    getNewsForm() {
        return `
            <form id="addNewsForm">
                <div class="form-group">
                    <label for="title">Заголовок *</label>
                    <input type="text" id="title" required maxlength="200" placeholder="Введите заголовок новости">
                </div>
                <div class="form-group">
                    <label for="excerpt">Краткое описание *</label>
                    <textarea id="excerpt" required maxlength="500" rows="3" placeholder="Краткое описание новости"></textarea>
                </div>
                <div class="form-group">
                    <label for="content">Полный текст *</label>
                    <textarea id="content" required rows="8" placeholder="Полное содержание новости"></textarea>
                </div>
                <div class="form-group">
                    <label for="cover">Обложка (файл)</label>
                    <input type="file" id="cover" accept="image/*">
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="category">Категория</label>
                        <select id="category">
                            <option value="general">Общее</option>
                            <option value="safety">Безопасность</option>
                            <option value="technology">Технологии</option>
                            <option value="infrastructure">Инфраструктура</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="isPublished">Статус</label>
                        <select id="isPublished">
                            <option value="true">Опубликовано</option>
                            <option value="false">Черновик</option>
                        </select>
                    </div>
                </div>
            </form>
        `;
    }

    getDocumentForm() {
        return `
            <form id="addDocumentForm">
                <div class="form-group">
                    <label for="title">Название документа *</label>
                    <input type="text" id="title" required placeholder="Введите название документа">
                </div>
                <div class="form-group">
                    <label for="description">Описание</label>
                    <textarea id="description" rows="3" placeholder="Описание документа"></textarea>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="category">Категория *</label>
                        <select id="category" required>
                            <option value="">Выберите категорию</option>
                            <option value="regulations">Регламенты</option>
                            <option value="reports">Отчеты</option>
                            <option value="forms">Формы</option>
                            <option value="standards">Стандарты</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="fileType">Тип файла</label>
                        <select id="fileType">
                            <option value="PDF">PDF</option>
                            <option value="DOCX">DOCX</option>
                            <option value="XLSX">XLSX</option>
                            <option value="TXT">TXT</option>
                        </select>
                    </div>
                </div>
                <div class="form-group">
                    <label for="fileBinary">Прикрепить файл *</label>
                    <input type="file" id="fileBinary" required>
                </div>
            </form>
        `;
    }

    getProjectForm() {
        return `
            <form id="addProjectForm">
                <div class="form-group">
                    <label for="title">Название проекта *</label>
                    <input type="text" id="title" required placeholder="Введите название проекта">
                </div>
                <div class="form-group">
                    <label for="shortDescription">Краткое описание *</label>
                    <textarea id="shortDescription" required rows="3" placeholder="Короткий текст для карточки проекта"></textarea>
                </div>
                <div class="form-group">
                    <label for="detailedDescription">Подробное описание *</label>
                    <textarea id="detailedDescription" required rows="8" placeholder="Полное описание проекта для детальной страницы"></textarea>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="category">Категория</label>
                        <select id="category">
                            <option value="infrastructure">Инфраструктура</option>
                            <option value="technology">Технологии</option>
                            <option value="environment">Экология</option>
                            <option value="social">Социальные</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="status">Статус *</label>
                        <select id="status" required>
                            <option value="planning">Планирование</option>
                            <option value="in_progress">В работе</option>
                            <option value="completed">Завершен</option>
                            <option value="suspended">Приостановлен</option>
                        </select>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="startDate">Дата начала</label>
                        <input type="date" id="startDate">
                    </div>
                    <div class="form-group">
                        <label for="endDate">Дата окончания</label>
                        <input type="date" id="endDate">
                    </div>
                </div>
                <div class="form-group">
                    <label for="budget">Бюджет (₽)</label>
                    <input type="text" id="budget" inputmode="decimal" placeholder="0 ₽">
                </div>
                <div class="form-group">
                    <label for="projectCover">Обложка</label>
                    <input type="file" id="projectCover" accept="image/*">
                </div>
            </form>
        `;
    }

    getUserForm() {
        return `
            <form id="addUserForm">
                <div class="form-group">
                    <label for="username">Имя пользователя *</label>
                    <input type="text" id="username" required placeholder="Введите имя пользователя">
                </div>
                <div class="form-group">
                    <label for="email">Email *</label>
                    <input type="email" id="email" required placeholder="user@example.com">
                </div>
                <div class="form-group">
                    <label for="password">Пароль *</label>
                    <input type="password" id="password" required placeholder="Введите пароль">
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="role">Роль *</label>
                        <select id="role" required>
                            <option value="user">Пользователь</option>
                            <option value="editor">Редактор</option>
                            <option value="admin">Администратор</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="fullName">Полное имя</label>
                        <input type="text" id="fullName" placeholder="Иванов Иван Иванович">
                    </div>
                </div>
            </form>
        `;
    }

    getServiceForm() {
        return `
            <form id="addServiceForm">
                <div class="form-group">
                    <label for="title">Название услуги *</label>
                    <input type="text" id="title" required placeholder="Введите название услуги">
                </div>
                <div class="form-group">
                    <label for="description">Описание</label>
                    <textarea id="description" rows="3" placeholder="Описание услуги"></textarea>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="category">Категория *</label>
                        <select id="category" required>
                            <option value="documentation">Документация</option>
                            <option value="equipment">Оборудование</option>
                            <option value="evacuation">Эвакуация</option>
                            <option value="consultation">Консультация</option>
                            <option value="maintenance">Обслуживание</option>
                            <option value="installation">Установка</option>
                            <option value="monitoring">Мониторинг</option>
                            <option value="other">Другое</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="price">Цена</label>
                        <input type="text" id="price" placeholder="от 1000 ₽">
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="order">Порядок сортировки</label>
                        <input type="number" id="order" value="0" min="0">
                    </div>
                    <div class="form-group">
                        <label for="isActive">Статус</label>
                        <select id="isActive">
                            <option value="true">Активна</option>
                            <option value="false">Неактивна</option>
                        </select>
                    </div>
                </div>
                <div class="form-group">
                    <label>Поля формы для заказа</label>
                    <div id="formFieldsContainer">
                        <div class="form-field-item">
                            <div class="form-row">
                                <div class="form-group">
                                    <label>Тип поля</label>
                                    <select class="field-type">
                                        <option value="text">Текст</option>
                                        <option value="email">Email</option>
                                        <option value="tel">Телефон</option>
                                        <option value="textarea">Многострочный текст</option>
                                        <option value="select">Выпадающий список</option>
                                        <option value="checkbox">Чекбокс</option>
                                        <option value="date">Дата</option>
                                        <option value="number">Число</option>
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label>Название поля</label>
                                    <input type="text" class="field-label" placeholder="Имя">
                                </div>
                            </div>
                            <div class="form-row">
                                <div class="form-group">
                                    <label>Имя поля</label>
                                    <input type="text" class="field-name" placeholder="name">
                                </div>
                                <div class="form-group">
                                    <label>Плейсхолдер</label>
                                    <input type="text" class="field-placeholder" placeholder="Введите имя">
                                </div>
                            </div>
                            <div class="form-row">
                                <div class="form-group">
                                    <label>
                                        <input type="checkbox" class="field-required"> Обязательное поле
                                    </label>
                                </div>
                                <div class="form-group">
                                    <button type="button" class="btn btn-sm btn-danger remove-field">Удалить</button>
                                </div>
                            </div>
                        </div>
                    </div>
                    <button type="button" class="btn btn-sm btn-secondary" id="addFormField">Добавить поле</button>
                </div>
            </form>
        `;
    }

    addFormField() {
        const container = document.getElementById('formFieldsContainer');
        if (!container) return;

        const fieldItem = document.createElement('div');
        fieldItem.className = 'form-field-item';
        fieldItem.innerHTML = `
            <div class="form-row">
                <div class="form-group">
                    <label>Тип поля</label>
                    <select class="field-type">
                        <option value="text">Текст</option>
                        <option value="email">Email</option>
                        <option value="tel">Телефон</option>
                        <option value="textarea">Многострочный текст</option>
                        <option value="select">Выпадающий список</option>
                        <option value="checkbox">Чекбокс</option>
                        <option value="date">Дата</option>
                        <option value="number">Число</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Название поля</label>
                    <input type="text" class="field-label" placeholder="Имя">
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>Имя поля</label>
                    <input type="text" class="field-name" placeholder="name">
                </div>
                <div class="form-group">
                    <label>Плейсхолдер</label>
                    <input type="text" class="field-placeholder" placeholder="Введите имя">
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>
                        <input type="checkbox" class="field-required"> Обязательное поле
                    </label>
                </div>
                <div class="form-group">
                    <button type="button" class="btn btn-sm btn-danger remove-field">Удалить</button>
                </div>
            </div>
        `;
        
        container.appendChild(fieldItem);
    }

    async deleteItem(type, id) {
        if (!confirm('Вы уверены, что хотите удалить этот элемент?')) {
            return;
        }

        try {
            // Правильные множественные формы для API endpoints
            const endpointMap = {
                'fine': 'fines',
                'evacuation': 'evacuations', 
                'traffic-light': 'traffic-lights',
                'accident': 'accidents',
                'news': 'news',
                'document': 'documents',
                'project': 'projects',
                'user': 'users',
                'service': 'services'
            };

            const endpoint = endpointMap[type] || `${type}s`;
            const response = await fetch(`${this.apiBase}/api/${endpoint}/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                }
            });

            if (response.ok) {
                this.loadSectionData(this.currentSection);
                this.showSuccess('Элемент успешно удален');
            } else {
                throw new Error('Failed to delete');
            }
        } catch (error) {
            console.error('Error deleting item:', error);
            this.showError('Ошибка при удалении элемента');
        }
    }

    showModal(title, content) {
        console.log('showModal called with title:', title);
        console.log('showModal content:', content);
        
        const modalTitle = document.getElementById('modalTitle');
        const modalBody = document.getElementById('modalBody');
        const modalOverlay = document.getElementById('modalOverlay');
        
        if (!modalTitle || !modalBody || !modalOverlay) {
            console.error('Modal elements not found!');
            return;
        }
        
        modalTitle.textContent = title;
        modalBody.innerHTML = content;
        modalOverlay.classList.add('active');
        
        console.log('Modal classes after adding active:', modalOverlay.classList);
        console.log('Modal display style:', getComputedStyle(modalOverlay).display);
        console.log('Modal z-index:', getComputedStyle(modalOverlay).zIndex);
        
        // Принудительно показываем модальное окно
        modalOverlay.style.display = 'flex';
        modalOverlay.style.position = 'fixed';
        modalOverlay.style.top = '0';
        modalOverlay.style.left = '0';
        modalOverlay.style.right = '0';
        modalOverlay.style.bottom = '0';
        modalOverlay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
        modalOverlay.style.zIndex = '9999';
        modalOverlay.style.alignItems = 'center';
        modalOverlay.style.justifyContent = 'center';
        
        console.log('Modal should be visible now');
        
        // Добавляем обработчики для форм
        this.setupModalFormHandlers();
    }

    hideModal() {
        const overlay = document.getElementById('modalOverlay');
        const body = document.getElementById('modalBody');
        overlay.classList.remove('active');
        overlay.style.display = 'none';
        overlay.style.removeProperty('position');
        overlay.style.removeProperty('top');
        overlay.style.removeProperty('left');
        overlay.style.removeProperty('right');
        overlay.style.removeProperty('bottom');
        overlay.style.removeProperty('backgroundColor');
        overlay.style.removeProperty('zIndex');
        overlay.style.removeProperty('alignItems');
        overlay.style.removeProperty('justifyContent');
        if (body) body.innerHTML = '';
    }

    setupModalFormHandlers() {
        // Добавляем обработчики для всех форм в модальном окне
        const forms = document.querySelectorAll('#modalBody form');
        forms.forEach(form => {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveModalData();
            });
        });
    }

    async saveModalData() {
        const modalBody = document.getElementById('modalBody');
        const form = modalBody.querySelector('form');
        
        if (!form) {
            this.showError('Форма не найдена');
            return;
        }

        // Собираем данные из всех полей формы
        const data = {};
        const inputs = form.querySelectorAll('input, select, textarea');
        inputs.forEach(input => {
            if (input.type === 'checkbox') {
                data[input.id] = input.checked;
            } else if (input.type === 'radio') {
                if (input.checked) {
                    data[input.name] = input.value;
                }
            } else {
                data[input.id] = input.value;
            }
        });
        // Если это форма пользователя, пронормируем поля для регистрации
        if (form.id === 'addUserForm') {
            data.username = data.username || '';
            data.email = data.email || '';
            data.password = data.password || '';
            data.role = data.role || 'user';
            data.fullName = data.fullName || '';
            const emailRe = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
            if (!emailRe.test(data.email)) {
                this.showError('Введите корректный Email (example@domain.com)');
                return;
            }
            if (!data.username.trim()) {
                this.showError('Введите логин');
                return;
            }
            if (!data.password || data.password.length < 4) {
                this.showError('Пароль должен быть не короче 4 символов');
                return;
            }
        }

        // Определяем тип данных по ID формы
        const formId = form.id;
        let endpoint = '';
        let type = '';

        if (formId.includes('Fine')) {
            endpoint = '/api/fines';
            type = 'fine';
        } else if (formId.includes('Evacuation')) {
            endpoint = '/api/evacuations';
            type = 'evacuation';
        } else if (formId.includes('TrafficLight')) {
            endpoint = '/api/traffic-lights';
            type = 'traffic-light';
        } else if (formId.includes('Accident')) {
            endpoint = '/api/accidents';
            type = 'accident';
        } else if (formId.includes('News')) {
            endpoint = '/api/news';
            type = 'news';
        } else if (formId.includes('Document')) {
            endpoint = '/api/documents';
            type = 'document';
        } else if (formId.includes('Project')) {
            endpoint = '/api/projects';
            type = 'project';
        } else if (formId.includes('User')) {
            endpoint = '/api/auth/register';
            type = 'user';
        } else if (formId.includes('Service')) {
            endpoint = '/api/services';
            type = 'service';
        } else if (formId === 'editServiceForm') {
            endpoint = '/api/services';
            type = 'service';
        }

        // Перекладываем date из конкретного поля в универсальное поле
        if (data.fineDate) data.date = data.fineDate;
        if (data.evacuationDate) data.date = data.evacuationDate;
        if (data.accidentDate) data.date = data.accidentDate;

        // Добавляем дополнительные поля для некоторых типов
        if (type === 'fine') {
            data.year = new Date(data.fineDate).getFullYear();
            data.month = new Date(data.fineDate).getMonth() + 1;
        } else if (type === 'evacuation') {
            data.year = new Date(data.evacuationDate).getFullYear();
            data.month = new Date(data.evacuationDate).getMonth() + 1;
        } else if (type === 'accident') {
            data.year = new Date(data.accidentDate).getFullYear();
            data.month = new Date(data.accidentDate).getMonth() + 1;
            data.dayOfWeek = new Date(data.accidentDate).getDay();
            // Нормализуем числовые поля
            data.deathsCount = Number(data.deathsCount || 0);
            data.injuredCount = Number(data.injuredCount || 0);
            data.accidentsCount = Number(data.accidentsCount || 1);
            if (String(data.year).length > 5) data.year = 0;
        } else if (type === 'news') {
            data.publishedDate = new Date().toISOString();
            data.authorId = 1; // ID текущего пользователя
            data.viewsCount = 0;
        } else if (type === 'project') {
            // Валидация обязательных полей
            if (!data.title || !data.title.trim()) {
                this.showError('Название обязательно');
                return;
            }
            // Приводим к ожидаемым полям бэкенда
            // Краткое описание идёт как description для карточки
            if (data.shortDescription && !data.description) {
                data.description = data.shortDescription;
            }
            // Нормализуем бюджет из маски с ₽
            if (typeof data.budget === 'string') {
                const raw = data.budget.replace(/[^0-9]/g, '');
                data.budget = raw ? Number(raw) : 0;
            } else {
                data.budget = Number(data.budget || 0);
            }
            data.managerId = 1; // ID текущего пользователя
            data.isPublic = true;
        } else if (type === 'service') {
            data.isActive = data.isActive !== 'false';
            data.order = parseInt(data.order) || 0;
            
            // Обработка полей формы
            const formFieldsContainer = form.querySelector('#formFieldsContainer');
            if (formFieldsContainer) {
                const formFields = [];
                const fieldItems = formFieldsContainer.querySelectorAll('.form-field-item');
                
                fieldItems.forEach(item => {
                    const fieldType = item.querySelector('.field-type').value;
                    const fieldLabel = item.querySelector('.field-label').value;
                    const fieldName = item.querySelector('.field-name').value;
                    const fieldPlaceholder = item.querySelector('.field-placeholder').value;
                    const fieldRequired = item.querySelector('.field-required').checked;
                    
                    if (fieldLabel && fieldName) {
                        const field = {
                            type: fieldType,
                            label: fieldLabel,
                            name: fieldName,
                            required: fieldRequired
                        };
                        
                        if (fieldPlaceholder) field.placeholder = fieldPlaceholder;
                        
                        formFields.push(field);
                    }
                });
                
                data.formFields = formFields;
            }
        }

        if (!endpoint) {
            this.showError('Неизвестный тип данных');
            return;
        }

        let response;
        try {
            this.showLoading(true);
            if (type === 'document') {
                data.uploadDate = new Date().toISOString();
                data.uploaderId = 1; // ID текущего пользователя
                data.isPublic = true;
                
                // Для документов отправляем файл через FormData
                const fileInput = form.querySelector('#fileBinary');
                if (fileInput && fileInput.files && fileInput.files[0]) {
                    const fd = new FormData();
                    Object.entries(data).forEach(([k, v]) => fd.append(k, v));
                    fd.append('file', fileInput.files[0]);
                    
                    response = await fetch(`${this.apiBase}${endpoint}`, {
                        method: 'POST',
                        headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` },
                        body: fd
                    });
                } else {
                    this.showError('Файл обязателен для документа');
                    return;
                }
            } else if (type === 'news' || type === 'project') {
                const coverInput = type==='news' ? form.querySelector('#cover') : form.querySelector('#projectCover');
                // Всегда отправляем multipart для надёжности
                const fd = new FormData();
                Object.entries(data).forEach(([k, v]) => fd.append(k, v));
                if (coverInput && coverInput.files && coverInput.files[0]) fd.append(type==='news' ? 'cover' : 'projectCover', coverInput.files[0]);
                response = await fetch(`${this.apiBase}${endpoint}`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` },
                    body: fd
                });
            }
            if (!response) {
                const isAuthRegister = endpoint === '/api/auth/register';
                const headers = isAuthRegister ? { 'Content-Type': 'application/json' } : {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                };
                // Для проектов, если файлов нет, тоже сохраняем JSON и ожидаем image/gallery строками
                response = await fetch(`${this.apiBase}${endpoint}`, {
                    method: 'POST',
                    headers,
                    body: JSON.stringify(data)
                });
            }

            if (response.ok) {
                this.hideModal();
                this.showSuccess('Данные успешно сохранены');
                // Сбрасываем кеш, чтобы фильтры увидели новые годы/месяцы
                if (this.currentSection === 'fines') this.finesAllRows = null;
                if (this.currentSection === 'evacuations') this.evacuationsAllRows = null;
                // Для пользователей явно перезагрузим раздел, чтобы убрать мок и показать реальный список
                if (type === 'user') {
                    this.currentSection = 'users';
                    await this.loadUsers();
                } else if (type === 'document') {
                    // Для документов принудительно обновляем список
                    await this.loadDocuments();
                } else {
                    this.loadSectionData(this.currentSection);
                }
            } else {
                let msg = 'Ошибка при сохранении данных';
                try {
                    const error = await response.json();
                    msg = error.error || error.message || msg;
                } catch {}
                this.showError(msg);
            }
        } catch (error) {
            console.error('Error saving data:', error);
            this.showError('Ошибка при сохранении данных');
        } finally {
            this.showLoading(false);
        }
    }

    showLoading(show = true) {
        if (show) {
            document.getElementById('loadingOverlay').classList.add('active');
        } else {
            document.getElementById('loadingOverlay').classList.remove('active');
        }
    }

    hideLoading() {
        document.getElementById('loadingOverlay').classList.remove('active');
    }

    showSuccess(message) {
        // Создаем уведомление об успехе
        const notification = document.createElement('div');
        notification.className = 'notification success';
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    showError(message) {
        // Создаем уведомление об ошибке
        const notification = document.createElement('div');
        notification.className = 'notification error';
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 5000);
    }

    // Import functionality
    setupImportHandlers() {
        const fileUpload = document.getElementById('fileUpload');
        const fileInput = document.getElementById('fileInput');
        const startImportBtn = document.getElementById('startImport');

        if (!fileUpload || !fileInput || !startImportBtn) return;

        // Click to select file
        fileUpload.addEventListener('click', () => {
            fileInput.click();
        });

        // Drag and drop
        fileUpload.addEventListener('dragover', (e) => {
            e.preventDefault();
            fileUpload.classList.add('dragover');
        });

        fileUpload.addEventListener('dragleave', () => {
            fileUpload.classList.remove('dragover');
        });

        fileUpload.addEventListener('drop', (e) => {
            e.preventDefault();
            fileUpload.classList.remove('dragover');
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                this.handleFile(files[0]);
            }
        });

        // File input change
        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                this.handleFile(e.target.files[0]);
            }
        });

        // Start import
        startImportBtn.addEventListener('click', () => {
            this.startImport();
        });
    }

    handleFile(file) {
        if (!file.name.match(/\.(xlsx|xls)$/)) {
            this.showError('Пожалуйста, выберите файл Excel (.xlsx или .xls)');
            return;
        }

        // Show file info
        document.getElementById('fileName').textContent = file.name;
        document.getElementById('fileSize').textContent = this.formatFileSize(file.size);
        document.getElementById('fileInfo').style.display = 'block';

        // Show processing message
        this.showMappingLog('Начинаем обработку Excel файла...');

        // Read file
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                
                this.showMappingLog(`Обнаружено листов: ${workbook.SheetNames.length}`);
                
                // Конвертируем каждый лист в CSV и обрабатываем
                this.convertAndProcessWorkbook(workbook);
                
            } catch (error) {
                console.error('Error reading file:', error);
                this.showError('Ошибка при чтении файла');
            }
        };
        reader.readAsArrayBuffer(file);
    }

    convertAndProcessWorkbook(workbook) {
        const sheetMapping = document.getElementById('sheetMapping');
        sheetMapping.innerHTML = '';

        // Логируем все названия листов для отладки
        console.log('=== ВСЕ ЛИСТЫ В ФАЙЛЕ ===');
        console.log('Названия листов:', workbook.SheetNames);
        this.showMappingLog('=== ВСЕ ЛИСТЫ В ФАЙЛЕ ===');
        this.showMappingLog('Названия листов: ' + workbook.SheetNames.join(', '));

        // Map sheet names to data types
        const sheetTypeMap = {
            'Штрафы 2024': 'fines',
            'Штрафы 2025': 'fines',
            'Эвакуация 2024': 'evacuations',
            'Эвакуация 2025': 'evacuations',
            'Эвакуация маршрут': 'transport',
            'Пример аналитики по штрафам': 'fines-analytics',
            'Пример аналитики по эвакуации': 'evacuation-analytics',
            'Реестр светофоров': 'traffic-lights',
            'Светофоры': 'traffic-lights',
            'ДТП': 'accidents',
            'Новости': 'news',
            'Документы': 'documents',
            'Проекты': 'projects'
        };

        let mappedSheets = 0;
        const convertedSheets = {};

        workbook.SheetNames.forEach(sheetName => {
            const sheetItem = document.createElement('div');
            sheetItem.className = 'sheet-item';

            // Логируем каждый лист
            console.log('Обрабатываем лист:', sheetName);
            this.showMappingLog(`Обрабатываем лист: "${sheetName}"`);

            // Ищем точное совпадение
            let sheetType = sheetTypeMap[sheetName];
            
            // Если точного совпадения нет, ищем по частичному совпадению
            if (!sheetType) {
                if (sheetName.includes('маршрут') || sheetName.includes('транспорт') || sheetName.includes('эвакуация маршрут')) {
                    sheetType = 'transport';
                    console.log(`Найден лист транспорта по частичному совпадению: "${sheetName}" -> transport`);
                    this.showMappingLog(`Найден лист транспорта по частичному совпадению: "${sheetName}" -> transport`);
                }
            }
            
            sheetType = sheetType || 'unknown';
            const status = sheetType !== 'unknown' ? 'mapped' : 'error';
            
            console.log(`Лист "${sheetName}": тип=${sheetType}, статус=${status}`);
            this.showMappingLog(`Лист "${sheetName}": тип=${sheetType}, статус=${status}`);

            if (status === 'mapped') {
                mappedSheets++;
                
                // Конвертируем лист в CSV
                const worksheet = workbook.Sheets[sheetName];
                const csvData = XLSX.utils.sheet_to_csv(worksheet);
                const csvLines = csvData.split('\n');
                
                this.showMappingLog(`Лист "${sheetName}": ${csvLines.length} строк CSV`);
                
                // Парсим CSV в объекты
                let headers, data;
                
                if (sheetName === 'Реестр светофоров') {
                    // Для светофоров заголовки на первой строке, данные со второй
                    headers = ['№ П/П', 'Адрес', 'Тип светофора', 'Год установки'];
                    this.showMappingLog(`Заголовки (фиксированные): ${headers.join(', ')}`);
                    
                    data = csvLines.slice(1) // Начинаем со второй строки
                        .filter(line => line.trim())
                        .map(line => {
                            const values = this.parseCSVLine(line);
                            const obj = {};
                            headers.forEach((header, index) => {
                                obj[header] = values[index] || '';
                            });
                            return obj;
                        });
                } else if (sheetName.includes('Пример аналитики')) {
                    // Для аналитики - специальная обработка сводных таблиц
                    this.showMappingLog(`=== ОБРАБОТКА АНАЛИТИЧЕСКОГО ЛИСТА "${sheetName}" ===`);
                    this.showMappingLog(`Всего строк: ${csvLines.length}`);
                    
                    // Показываем первые 8 строк для анализа структуры
                    for (let i = 0; i < Math.min(8, csvLines.length); i++) {
                        this.showMappingLog(`Строка ${i + 1}: "${csvLines[i]}"`);
                    }
                    
                    // Ищем строку с заголовками (обычно строка 4, индекс 3)
                    let headerRowIndex = 3; // По умолчанию строка 4
                    let foundHeaders = [];
                    
                    // Ищем строку с заголовками
                    for (let i = 2; i < Math.min(6, csvLines.length); i++) {
                        const testHeaders = this.parseCSVLine(csvLines[i]);
                        if (testHeaders.some(h => h && h.trim() !== '')) {
                            foundHeaders = testHeaders;
                            headerRowIndex = i;
                            this.showMappingLog(`Найдены заголовки в строке ${i + 1}: ${foundHeaders.join(', ')}`);
                            break;
                        }
                    }
                    
                    if (foundHeaders.length > 0) {
                        headers = foundHeaders;
                        
                        // Данные начинаются после заголовков
                        data = csvLines.slice(headerRowIndex + 1)
                            .filter(line => line.trim())
                            .map(line => {
                                const values = this.parseCSVLine(line);
                                const obj = {};
                                headers.forEach((header, index) => {
                                    obj[header] = values[index] || '';
                                });
                                return obj;
                            });
                        
                        this.showMappingLog(`Обработано ${data.length} записей аналитики`);
                    } else {
                        this.showMappingLog(`Не удалось найти заголовки в листе "${sheetName}"`);
                        headers = [];
                        data = [];
                    }
                } else if (sheetName === 'Эвакуация маршрут') {
                    // Для транспорта - правильная структура
                    this.showMappingLog(`=== ОБРАБОТКА ЛИСТА "${sheetName}" КАК ТРАНСПОРТ ===`);
                    this.showMappingLog(`Всего строк: ${csvLines.length}`);
                    
                    // Показываем первые 6 строк для анализа
                    for (let i = 0; i < Math.min(6, csvLines.length); i++) {
                        this.showMappingLog(`Строка ${i + 1}: "${csvLines[i]}"`);
                    }
                    
                    // Используем фиксированные заголовки для транспорта
                    headers = ['год', 'месяц', 'маршрут'];
                    this.showMappingLog(`Заголовки (фиксированные): ${headers.join(', ')}`);
                    
                    // Данные начинаются с строки 6 (индекс 5)
                    data = csvLines.slice(5) // Начинаем с 6-й строки
                        .filter(line => line.trim())
                        .map((line, index) => {
                            const values = this.parseCSVLine(line);
                            const obj = {};
                            headers.forEach((header, index) => {
                                obj[header] = values[index] || '';
                            });
                            
                            // Логируем каждую строку для отладки
                            this.showMappingLog(`Строка ${index + 6}: год="${obj['год']}", месяц="${obj['месяц']}", маршрут="${obj['маршрут']}"`);
                            
                            return obj;
                        });
                    
                    this.showMappingLog(`Обработано ${data.length} записей транспорта`);
                } else {
                    // Для остальных листов стандартная обработка
                    headers = this.parseCSVLine(csvLines[1]);
                    this.showMappingLog(`Заголовки: ${headers.join(', ')}`);
                    
                    data = csvLines.slice(2) // Начинаем с третьей строки (индекс 2)
                        .map((line, index) => {
                            const lineNumber = index + 3; // +3 потому что начинаем с 3-й строки
                            if (!line.trim()) {
                                console.log(`Строка ${lineNumber}: пустая строка, пропускаем`);
                                return null;
                            }
                            
                            const values = this.parseCSVLine(line);
                            const obj = {};
                            headers.forEach((header, index) => {
                                obj[header] = values[index] || '';
                            });
                            
                            // Логируем каждую 50-ю строку для отслеживания
                            if (lineNumber % 50 === 0) {
                                console.log(`Обрабатываем строку ${lineNumber}: дата="${obj['Дата']}"`);
                            }
                            
                            return obj;
                        })
                        .filter(obj => obj !== null); // Убираем null записи
                }
                
                // Показываем пример данных
                if (data.length > 0) {
                    this.showMappingLog(`Пример данных: ${JSON.stringify(data[0])}`);
                    if (data[0]['Дата']) {
                        this.showMappingLog(`Поле 'Дата': "${data[0]['Дата']}"`);
                    }
                    
                    // Показываем статистику пустых записей
                    const emptyRecords = data.filter(record => {
                        return Object.values(record).every(value => !value || value.toString().trim() === '');
                    }).length;
                    
                    if (emptyRecords > 0) {
                        this.showMappingLog(`Найдено ${emptyRecords} полностью пустых записей (будут пропущены)`);
                    }
                }

                convertedSheets[sheetName] = {
                    type: sheetType,
                    data: data,
                    headers: headers
                };
            }

            sheetItem.innerHTML = `
                <div class="sheet-name">${sheetName}</div>
                <div class="sheet-status status-${status}">
                    ${status === 'mapped' ? '✓ Сопоставлен' : '✗ Неизвестный тип'}
                </div>
            `;

            sheetMapping.appendChild(sheetItem);
        });

        // Show mapping section
        document.getElementById('mappingSection').style.display = 'block';

        // Enable start button if we have mapped sheets
        if (mappedSheets > 0) {
            document.getElementById('startImport').disabled = false;
        }

        // Store converted data for import
        this.convertedSheets = convertedSheets;
    }

    parseCSVLine(line) {
        const result = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            
            if (char === '"') {
                if (inQuotes && line[i + 1] === '"') {
                    current += '"';
                    i++; // Skip next quote
                } else {
                    inQuotes = !inQuotes;
                }
            } else if (char === ',' && !inQuotes) {
                // Убираем кавычки с начала и конца
                let value = current.trim();
                if (value.startsWith('"') && value.endsWith('"')) {
                    value = value.slice(1, -1);
                }
                result.push(value);
                current = '';
            } else {
                current += char;
            }
        }
        
        // Обрабатываем последнее поле
        let value = current.trim();
        if (value.startsWith('"') && value.endsWith('"')) {
            value = value.slice(1, -1);
        }
        result.push(value);
        return result;
    }

    processWorkbook(workbook) {
        const sheetMapping = document.getElementById('sheetMapping');
        sheetMapping.innerHTML = '';

        // Map sheet names to data types
        const sheetTypeMap = {
            'Штрафы 2024': 'fines',
            'Штрафы 2025': 'fines',
            'Эвакуация 2024': 'evacuations',
            'Эвакуация 2025': 'evacuations',
            'Эвакуация маршрут': 'transport',
            'Пример аналитики по штрафам': 'fines-analytics',
            'Пример аналитики по эвакуации': 'evacuation-analytics',
            'Реестр светофоров': 'traffic-lights',
            'Светофоры': 'traffic-lights',
            'ДТП': 'accidents',
            'Новости': 'news',
            'Документы': 'documents',
            'Проекты': 'projects'
        };

        let mappedSheets = 0;

        workbook.SheetNames.forEach(sheetName => {
            const sheetItem = document.createElement('div');
            sheetItem.className = 'sheet-item';

            const sheetType = sheetTypeMap[sheetName] || 'unknown';
            const status = sheetType !== 'unknown' ? 'mapped' : 'error';

            if (status === 'mapped') {
                mappedSheets++;
            }

            sheetItem.innerHTML = `
                <div class="sheet-name">${sheetName}</div>
                <div class="sheet-status status-${status}">
                    ${status === 'mapped' ? '✓ Сопоставлен' : '✗ Неизвестный тип'}
                </div>
            `;

            sheetMapping.appendChild(sheetItem);
        });

        // Show mapping section
        document.getElementById('mappingSection').style.display = 'block';

        // Enable start button if we have mapped sheets
        if (mappedSheets > 0) {
            document.getElementById('startImport').disabled = false;
        }

        // Store workbook for import
        this.workbook = workbook;
    }

    async startImport() {
        const progressSection = document.getElementById('progressSection');
        const progressFill = document.getElementById('progressFill');
        const progressText = document.getElementById('progressText');
        const importLog = document.getElementById('importLog');

        // Show progress section
        progressSection.style.display = 'block';
        importLog.innerHTML = '';

        if (!this.convertedSheets) {
            this.addLogEntry('Ошибка: данные не были конвертированы', 'error');
            return;
        }

        const sheetNames = Object.keys(this.convertedSheets);
        let totalSheets = sheetNames.length;
        let processedSheets = 0;
        let totalRecords = 0;
        let importedRecords = 0;
        let hasRealErrors = false;

        // Count total records (all records in file)
        sheetNames.forEach(sheetName => {
            totalRecords += this.convertedSheets[sheetName].data.length;
        });

        this.addLogEntry(`Начинаем импорт ${totalSheets} листов, ${totalRecords} записей`, 'info');

        // Process each sheet
        for (const sheetName of sheetNames) {
            const sheetInfo = this.convertedSheets[sheetName];
            const sheetType = sheetInfo.type;
            const data = sheetInfo.data;

            this.addLogEntry(`Обрабатываем лист "${sheetName}" (${data.length} записей)`, 'info');
            this.addLogEntry(`Заголовки: ${sheetInfo.headers.join(', ')}`, 'info');
            
            // Показываем пример данных для отладки
            if (data.length > 0) {
                this.addLogEntry(`Пример данных: ${JSON.stringify(data[0])}`, 'info');
            }

            // Import data for this sheet
            const result = await this.importSheetData(sheetType, data);
            const imported = result.imported || result;
            const sheetHasErrors = result.hasErrors || false;
            
            importedRecords += imported;
            if (sheetHasErrors) {
                hasRealErrors = true;
            }

            processedSheets++;
            const progress = (processedSheets / totalSheets) * 100;
            progressFill.style.width = `${progress}%`;
            progressText.textContent = `Обработано ${processedSheets} из ${totalSheets} листов`;

            this.addLogEntry(`Лист "${sheetName}": импортировано ${typeof imported === 'number' ? imported : (imported?.imported || 0)} записей`, 'success');
        }

        // Show results
        this.showImportResults(totalRecords, importedRecords, hasRealErrors);
    }

    async importSheetData(sheetType, data) {
        let imported = 0;
        const endpoint = `/api/${sheetType}`;

        // Обрабатываем данные в зависимости от типа листа
        const processedResult = this.processSheetData(sheetType, data);
        const processedData = processedResult.data || processedResult;
        const hasErrors = processedResult.hasErrors || false;

        for (const record of processedData) {
            try {
                const response = await fetch(`${this.apiBase}${endpoint}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                    },
                    body: JSON.stringify(record)
                });

                if (response.ok) {
                    imported++;
                } else {
                    const errorText = await response.text();
                    this.addLogEntry(`Ошибка импорта записи: ${response.status} ${response.statusText} - ${errorText}`, 'error');
                    console.error('Import error:', response.status, errorText, record);
                }
            } catch (error) {
                this.addLogEntry(`Ошибка импорта записи: ${error.message}`, 'error');
                console.error('Import error:', error, record);
            }
        }

        return { imported, hasErrors };
    }

    processSheetData(sheetType, data) {
        switch (sheetType) {
            case 'fines':
                return this.processFinesData(data);
            case 'evacuations':
                return this.processEvacuationsData(data);
            case 'evacuation-routes':
                return this.processEvacuationRoutesData(data);
            case 'fines-analytics':
                return this.processFinesAnalyticsData(data);
            case 'evacuation-analytics':
                return this.processEvacuationAnalyticsData(data);
            case 'traffic-lights':
                return this.processTrafficLightsData(data);
            case 'transport':
                return this.processTransportData(data);
            default:
                return { data: data, hasErrors: false };
        }
    }

    processFinesData(data) {
        console.log('=== НАЧАЛО ОБРАБОТКИ ШТРАФОВ ===');
        console.log('Обрабатываем данные штрафов:', data.length, 'записей');
        
        let processedCount = 0;
        let skippedCount = 0;
        let emptyDataCount = 0;
        let emptyDateCount = 0;
        let dateParseErrorCount = 0;
        
        // Находим индекс последней валидной записи
        let lastValidIndex = -1;
        for (let i = data.length - 1; i >= 0; i--) {
            const record = data[i];
            const dateStr = record['Дата'] || record['дата'] || record['Date'];
            const hasAnyData = Object.values(record).some(value => value && value.toString().trim() !== '');
            
            if (hasAnyData && dateStr && dateStr.trim() !== '') {
                // Дополнительная проверка - пытаемся распарсить дату
                try {
                    const testDate = this.parseDate(dateStr);
                    if (!isNaN(testDate.getTime())) {
                        lastValidIndex = i;
                        console.log(`Найдена последняя валидная запись на позиции ${i + 1}: дата="${dateStr}"`);
                        break;
                    }
                } catch (error) {
                    // Продолжаем поиск
                }
            }
        }
        
        console.log(`Последняя валидная запись на позиции: ${lastValidIndex + 1}`);
        
        // Обрабатываем только записи до последней валидной
        const validData = data.slice(0, lastValidIndex + 1);
        console.log(`Будет обработано ${validData.length} записей из ${data.length}`);
        
        const result = validData.map((record, index) => {
            const dateStr = record['Дата'] || record['дата'] || record['Date'];
            
            // Проверяем, что запись не пустая
            const hasAnyData = Object.values(record).some(value => value && value.toString().trim() !== '');
            if (!hasAnyData) {
                // Пустые записи не считаем ошибками - просто пропускаем
                return null;
            }
            
            // Проверяем, что dateStr не пустой
            if (!dateStr || dateStr === '') {
                // Пустые даты не считаем ошибками - просто пропускаем
                return null;
            }
            
            let date;
            
            try {
                // Улучшенный парсинг даты
                date = this.parseDate(dateStr);
                if (isNaN(date.getTime())) {
                    throw new Error('Invalid date');
                }
            } catch (error) {
                // Только реальные ошибки парсинга считаем ошибками
                dateParseErrorCount++;
                skippedCount++;
                return null;
            }
            
            processedCount++;
            return {
                date: dateStr,
                year: date.getFullYear(),
                month: date.getMonth() + 1,
                violationsCount: parseInt(record['Количество зафиксированных нарушений камерами ФВФ (нарастающим итогом)'] || record['violationsCount'] || 0),
                resolutionsCount: parseInt(record['Количество вынесенных постановлений (нарастающим итогом)'] || record['resolutionsCount'] || 0),
                imposedAmount: parseInt(record['Сумма наложенных штрафов (нарастающим итогом)'] || record['imposedAmount'] || 0),
                collectedAmount: parseInt(record['Сумма взысканных штрафов (нарастающим итогом)'] || record['collectedAmount'] || 0),
                district: 'Смоленск'
            };
        }).filter(record => record !== null);
        
        console.log(`=== СТАТИСТИКА ОБРАБОТКИ ШТРАФОВ ===`);
        console.log(`Всего записей в файле: ${data.length}`);
        console.log(`Валидных записей найдено: ${validData.length}`);
        console.log(`Обработано успешно: ${processedCount}`);
        console.log(`Пропущено (ошибки парсинга): ${skippedCount}`);
        console.log(`Пустых записей (не ошибки): ${validData.length - processedCount - skippedCount}`);
        console.log(`Успешность: ${validData.length > 0 ? ((processedCount / validData.length) * 100).toFixed(1) : 0}%`);
        
        return {
            data: result,
            hasErrors: skippedCount > 0
        };
    }

    processEvacuationsData(data) {
        console.log('=== НАЧАЛО ОБРАБОТКИ ЭВАКУАЦИЙ ===');
        console.log('Обрабатываем данные эвакуаций:', data.length, 'записей');
        
        let processedCount = 0;
        let skippedCount = 0;
        let emptyDataCount = 0;
        let emptyDateCount = 0;
        let dateParseErrorCount = 0;
        
        // Находим индекс последней валидной записи
        let lastValidIndex = -1;
        for (let i = data.length - 1; i >= 0; i--) {
            const record = data[i];
            const dateStr = record['Дата'] || record['дата'] || record['Date'];
            const hasAnyData = Object.values(record).some(value => value && value.toString().trim() !== '');
            
            if (hasAnyData && dateStr && dateStr.trim() !== '') {
                // Дополнительная проверка - пытаемся распарсить дату
                try {
                    const testDate = this.parseDate(dateStr);
                    if (!isNaN(testDate.getTime())) {
                        lastValidIndex = i;
                        console.log(`Найдена последняя валидная запись на позиции ${i + 1}: дата="${dateStr}"`);
                        break;
                    }
                } catch (error) {
                    // Продолжаем поиск
                }
            }
        }
        
        console.log(`Последняя валидная запись на позиции: ${lastValidIndex + 1}`);
        
        // Обрабатываем только записи до последней валидной
        const validData = data.slice(0, lastValidIndex + 1);
        console.log(`Будет обработано ${validData.length} записей из ${data.length}`);
        
        const result = validData.map((record, index) => {
            const dateStr = record['Дата'] || record['дата'] || record['Date'];
            
            // Проверяем, что запись не пустая
            const hasAnyData = Object.values(record).some(value => value && value.toString().trim() !== '');
            if (!hasAnyData) {
                // Пустые записи не считаем ошибками - просто пропускаем
                return null;
            }
            
            // Проверяем, что dateStr не пустой
            if (!dateStr || dateStr === '') {
                // Пустые даты не считаем ошибками - просто пропускаем
                return null;
            }
            
            let date;
            
            try {
                // Улучшенный парсинг даты
                date = this.parseDate(dateStr);
                if (isNaN(date.getTime())) {
                    throw new Error('Invalid date');
                }
            } catch (error) {
                // Только реальные ошибки парсинга считаем ошибками
                dateParseErrorCount++;
                skippedCount++;
                return null;
            }
            
            processedCount++;
            return {
                date: dateStr,
                year: date.getFullYear(),
                month: date.getMonth() + 1,
                towTrucksOnLine: parseInt(record['Количество эвакуаторов на линии'] || record['towTrucksOnLine'] || 0),
                tripsCount: parseInt(record['Количество выездов'] || record['tripsCount'] || 0),
                evacuationsCount: parseInt(record['Количество эвакуаций'] || record['evacuationsCount'] || 0),
                receiptsAmount: parseInt(record['Сумма поступлений по штрафстоянкe'] || record['receiptsAmount'] || 0),
                district: 'Смоленск'
            };
        }).filter(record => record !== null);
        
        console.log(`=== СТАТИСТИКА ОБРАБОТКИ ===`);
        console.log(`Всего записей в файле: ${data.length}`);
        console.log(`Валидных записей найдено: ${validData.length}`);
        console.log(`Обработано успешно: ${processedCount}`);
        console.log(`Пропущено (ошибки парсинга): ${skippedCount}`);
        console.log(`Пустых записей (не ошибки): ${validData.length - processedCount - skippedCount}`);
        console.log(`Успешность: ${validData.length > 0 ? ((processedCount / validData.length) * 100).toFixed(1) : 0}%`);
        
        return {
            data: result,
            hasErrors: skippedCount > 0
        };
    }

    processEvacuationRoutesData(data) {
        console.log('Обрабатываем данные маршрутов эвакуации:', data.length, 'записей');
        if (data.length > 0) {
            console.log('Первая запись маршрута:', data[0]);
            console.log('Ключи записи маршрута:', Object.keys(data[0]));
        }
        
        return data.map(record => {
            const year = parseInt(record['год'] || new Date().getFullYear());
            const monthStr = record['месяц'] || '';
            const route = record['маршрут'] || '';
            
            // Конвертируем название месяца в число
            const monthMap = {
                'Январь': 1, 'Февраль': 2, 'Март': 3, 'Апрель': 4,
                'Май': 5, 'Июнь': 6, 'Июль': 7, 'Август': 8,
                'Сентябрь': 9, 'Октябрь': 10, 'Ноябрь': 11, 'Декабрь': 12
            };
            const month = monthMap[monthStr] || new Date().getMonth() + 1;
            
            return {
                routeName: `Маршрут эвакуации ${monthStr} ${year}`,
                startPoint: this.extractStartPoint(route),
                endPoint: this.extractEndPoint(route),
                distance: this.calculateRouteDistance(route),
                duration: this.estimateRouteDuration(route),
                year: year,
                month: month,
                district: 'Смоленск',
                fullRoute: route
            };
        });
    }
    
    extractStartPoint(route) {
        if (!route) return '';
        const parts = route.split('→');
        return parts[0] ? parts[0].trim() : '';
    }
    
    extractEndPoint(route) {
        if (!route) return '';
        const parts = route.split('→');
        return parts[parts.length - 1] ? parts[parts.length - 1].trim() : '';
    }
    
    calculateRouteDistance(route) {
        if (!route) return 0;
        // Примерная оценка расстояния на основе количества улиц
        const streetCount = route.split('→').length;
        return Math.round(streetCount * 0.5 * 10) / 10; // ~0.5 км на улицу
    }
    
    estimateRouteDuration(route) {
        if (!route) return 0;
        // Примерная оценка времени на основе количества улиц
        const streetCount = route.split('→').length;
        return streetCount * 3; // ~3 минуты на улицу
    }

    processFinesAnalyticsData(data) {
        console.log('Обрабатываем данные аналитики штрафов:', data.length, 'записей');
        if (data.length > 0) {
            console.log('Первая запись аналитики штрафов:', data[0]);
            console.log('Ключи записи аналитики штрафов:', Object.keys(data[0]));
        }
        
        return data.map(record => {
            const period = record['Период'] || record['period'] || '';
            const violationsRecorded = parseInt(record['Зафиксировано нарушений'] || record['violationsRecorded'] || 0);
            const resolutionsIssued = parseInt(record['Вынесено постановлений с КФВФ'] || record['resolutionsIssued'] || 0);
            const imposedFinesAmount = parseInt(record['Сумма наложенных штрафов, руб.'] || record['imposedFinesAmount'] || 0);
            const collectedFinesAmount = parseInt(record['Сумма взысканных штрафов, руб.'] || record['collectedFinesAmount'] || 0);
            
            // Извлекаем год из периода
            const yearMatch = period.match(/(\d{4})/);
            const year = yearMatch ? parseInt(yearMatch[1]) : new Date().getFullYear();
            
            return {
                period: period,
                violationsRecorded: violationsRecorded,
                resolutionsIssued: resolutionsIssued,
                imposedFinesAmount: imposedFinesAmount,
                collectedFinesAmount: collectedFinesAmount,
                year: year,
                month: 0, // Аналитика по году
                district: 'Смоленск'
            };
        });
    }

    processEvacuationAnalyticsData(data) {
        console.log('Обрабатываем данные аналитики эвакуаций:', data.length, 'записей');
        if (data.length > 0) {
            console.log('Первая запись аналитики:', data[0]);
            console.log('Ключи записи аналитики:', Object.keys(data[0]));
        }
        
        return data.map(record => {
            const period = record['Период'] || record['period'] || '';
            const tripsCount = parseInt(record['Количество выездов'] || record['tripsCount'] || 0);
            const evacuationsCount = parseInt(record['Количество эвакуаций'] || record['evacuationsCount'] || 0);
            const receiptsAmount = parseInt(record['Сумма поступлений'] || record['receiptsAmount'] || 0);
            
            // Извлекаем год из периода (например, "2024 (с 01.01.2024 по 31.07.2024)" -> 2024)
            const yearMatch = period.match(/(\d{4})/);
            const year = yearMatch ? parseInt(yearMatch[1]) : new Date().getFullYear();
            
            return {
                period: period,
                tripsCount: tripsCount,
                evacuationsCount: evacuationsCount,
                receiptsAmount: receiptsAmount,
                year: year,
                month: 0, // Аналитика по году
                district: 'Смоленск'
            };
        });
    }

    processTrafficLightsData(data) {
        console.log('Обрабатываем данные светофоров:', data.length, 'записей');
        if (data.length > 0) {
            console.log('Первая запись светофора:', data[0]);
            console.log('Ключи записи:', Object.keys(data[0]));
        }
        
        return data.map(record => {
            // Используем новые поля из фиксированных заголовков
            const address = record['Адрес'] || '';
            const type = record['Тип светофора'] || 'standard';
            const year = record['Год установки'] || new Date().getFullYear();
            
            // Если обязательные поля пустые, пропускаем запись
            if (!address || !type) {
                console.warn('Пропускаем запись светофора - отсутствуют обязательные поля:', record);
                return null;
            }
            
            // Создаем дату установки из года
            const installationDate = new Date(year, 0, 1).toISOString();
            
            return {
                address: address,
                type: type,
                status: 'active',
                district: 'Смоленск',
                installationDate: installationDate,
                coordinates: '',
                description: `Светофор №${record['№ П/П'] || ''}`
            };
        }).filter(record => record !== null); // Убираем null записи
    }

    addLogEntry(message, type = 'info') {
        const importLog = document.getElementById('importLog');
        const entry = document.createElement('div');
        entry.className = `log-entry log-${type}`;
        entry.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
        importLog.appendChild(entry);
        importLog.scrollTop = importLog.scrollHeight;
    }

    // Добавьте эту вспомогательную функцию для парсинга дат:
    parseDate(dateStr) {
        if (!dateStr) return new Date(NaN);
        
        console.log(`🔍 parseDate: парсим "${dateStr}"`);
        
        // Пробуем разные форматы даты
        if (dateStr.includes('/')) {
            const parts = dateStr.split('/');
            if (parts.length === 3) {
                const month = parseInt(parts[0]);
                const day = parseInt(parts[1]);
                let year = parseInt(parts[2]);
                
                console.log(`  Части: месяц=${month}, день=${day}, год=${year}`);
                
                // Исправляем двухзначные годы
                if (year < 100) {
                    year += 2000;
                    console.log(`  Исправленный год: ${year}`);
                }
                
                const result = new Date(year, month - 1, day);
                console.log(`  Результат: ${result.toISOString().split('T')[0]}, год=${result.getFullYear()}`);
                return result;
            }
        } else if (dateStr.includes('.')) {
            const [day, month, year] = dateStr.split('.');
            let yearInt = parseInt(year);
            
            console.log(`  Части: день=${day}, месяц=${month}, год=${yearInt}`);
            
            // Исправляем двухзначные годы
            if (yearInt < 100) {
                yearInt += 2000;
                console.log(`  Исправленный год: ${yearInt}`);
            }
            
            const result = new Date(yearInt, month - 1, day);
            console.log(`  Результат: ${result.toISOString().split('T')[0]}, год=${result.getFullYear()}`);
            return result;
        }
        
        // Пробуем стандартный парсинг
        const result = new Date(dateStr);
        console.log(`  Стандартный парсинг: ${result.toISOString().split('T')[0]}, год=${result.getFullYear()}`);
        return result;
    }

    showImportResults(total, imported, hasRealErrors = false) {
        const resultsSection = document.getElementById('resultsSection');
        const resultsDiv = document.getElementById('importResults');

        // Считаем успешность только от импортированных записей
        const successRate = imported > 0 ? 100.0 : 0.0;
        const errors = Math.max(0, total - imported);

        // Показываем пояснение только если есть реальные ошибки парсинга
        const errorExplanation = hasRealErrors ? 
            '<p style="color: #666; font-size: 0.9em; margin-top: 10px;"><em>Примечание: "Ошибки" - это недостающие дни в таблице (например, в 2025 году данных только на 243 дня вместо 365), а не ошибки программы.</em></p>' : '';

        resultsDiv.innerHTML = `
            <div class="import-results">
                <h4>Импорт завершен!</h4>
                <p><strong>Всего записей:</strong> ${total}</p>
                <p><strong>Импортировано:</strong> ${imported}</p>
                <p><strong>Ошибок:</strong> ${errors}</p>
                <p><strong>Успешность:</strong> ${successRate.toFixed(1)}%</p>
                ${errorExplanation}
            </div>
        `;

        resultsSection.style.display = 'block';
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    showMappingLog(message) {
        // Создаем или обновляем лог в секции маппинга
        let logDiv = document.getElementById('mappingLog');
        if (!logDiv) {
            logDiv = document.createElement('div');
            logDiv.id = 'mappingLog';
            logDiv.className = 'import-log';
            logDiv.style.marginTop = '10px';
            logDiv.style.maxHeight = '150px';
            document.getElementById('mappingSection').appendChild(logDiv);
        }
        
        const entry = document.createElement('div');
        entry.className = 'log-entry log-info';
        entry.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
        logDiv.appendChild(entry);
        logDiv.scrollTop = logDiv.scrollHeight;
    }

    // Utility functions
    formatCurrency(amount) {
        return new Intl.NumberFormat('ru-RU', {
            style: 'currency',
            currency: 'RUB'
        }).format(amount);
    }

    formatDate(dateString) {
        return new Date(dateString).toLocaleDateString('ru-RU');
    }

    formatDateTime(dateString) {
        return new Date(dateString).toLocaleString('ru-RU');
    }

    formatFileSize(bytes) {
        if (!bytes) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // Chart creation functions

    createAccidentsChart(data) {
        const ctx = document.getElementById('accidentsChart');
        if (!ctx) return;

        if (this.charts.accidents) {
            this.charts.accidents.destroy();
        }

        this.charts.accidents = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: data.current?.monthly?.map(item => item.month) || [],
                datasets: [{
                    label: 'Количество ДТП',
                    data: data.current?.monthly?.map(item => item.accidentsCount) || [],
                    backgroundColor: '#FF6B6B',
                    borderColor: '#FF5252',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    title: {
                        display: true,
                        text: 'Динамика ДТП по месяцам'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }

    getMonthName(month) {
        const months = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'];
        return months[month - 1] || month;
    }

    getStatusName(status) {
        const statuses = {
            'active': 'Активен',
            'inactive': 'Неактивен',
            'maintenance': 'Обслуживание',
            'planning': 'Планирование',
            'in_progress': 'В работе',
            'completed': 'Завершен',
            'suspended': 'Приостановлен'
        };
        return statuses[status] || status;
    }

    getSeverityName(severity) {
        const severities = {
            'minor': 'Легкое',
            'moderate': 'Среднее',
            'severe': 'Тяжелое',
            'fatal': 'Смертельное'
        };
        return severities[severity] || severity;
    }

    getRoleName(role) {
        const roles = {
            'user': 'Пользователь',
            'editor': 'Редактор',
            'admin': 'Администратор'
        };
        return roles[role] || role;
    }

    getCategoryName(category) {
        const categories = {
            'general': 'Общее',
            'safety': 'Безопасность',
            'technology': 'Технологии',
            'construction': 'Строительство',
            'events': 'События',
            'regulations': 'Регламенты',
            'reports': 'Отчеты',
            'forms': 'Формы',
            'standards': 'Стандарты',
            'legal': 'Правовые',
            'infrastructure': 'Инфраструктура',
            'environment': 'Экология',
            'social': 'Социальные'
        };
        return categories[category] || category;
    }

    getTrafficLightTypeName(type) {
        const types = {
            'pedestrian': 'Пешеходный',
            'vehicle': 'Транспортный',
            'combined': 'Комбинированный'
        };
        return types[type] || type;
    }

    getRoleName(role) {
        const roles = {
            'admin': 'Администратор',
            'editor': 'Редактор',
            'guest': 'Гость'
        };
        return roles[role] || role;
    }

    // Transport management methods
    async loadTransportData() {
        console.log('🚌 loadTransportData: начинаем загрузку данных транспорта');
        try {
            // Используем fetchNoCache для обхода кэша
            const fetchNoCache = (url) => fetch(url, { 
                cache: 'no-store', 
                headers: { 
                    'Cache-Control': 'no-cache',
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                } 
            });
            
            const response = await fetchNoCache(`${this.apiBase}/api/transport`);
            
            console.log('🚌 loadTransportData: ответ от API:', response.status);
            
            if (!response.ok) {
                throw new Error('Ошибка загрузки данных транспорта');
            }
            
            const data = await response.json();
            console.log('🚌 loadTransportData: получены данные:', data);
            
            this.renderTransportTable(data.data);
            this.populateTransportFilters(data.data);
        } catch (error) {
            console.error('Ошибка загрузки транспорта:', error);
            this.showNotification('Ошибка загрузки данных транспорта', 'error');
        }
    }

    renderTransportTable(transports) {
        console.log('🚌 renderTransportTable: рендерим таблицу транспорта', transports);
        console.log('🚌 renderTransportTable: тип данных:', typeof transports);
        console.log('🚌 renderTransportTable: это массив?', Array.isArray(transports));
        
        const tbody = document.querySelector('#transportTable tbody');
        if (!tbody) {
            console.error('🚌 renderTransportTable: не найден tbody!');
            console.error('🚌 renderTransportTable: ищем селектор #transportTable tbody');
            const table = document.querySelector('#transportTable');
            console.error('🚌 renderTransportTable: таблица найдена?', !!table);
            return;
        }

        tbody.innerHTML = '';
        console.log('🚌 renderTransportTable: найдено транспортов:', transports ? transports.length : 'undefined');

        if (!transports || !Array.isArray(transports)) {
            console.error('🚌 renderTransportTable: transports не является массивом!', transports);
            return;
        }

        transports.forEach((transport, index) => {
            console.log(`🚌 renderTransportTable: обрабатываем транспорт ${index + 1}:`, transport);
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${transport.year}</td>
                <td>${transport.monthName}</td>
                <td class="route-cell">
                    <div class="route-preview">${this.truncateText(transport.route, 100)}</div>
                    <div class="route-full" style="display: none;">${transport.route}</div>
                    <button class="btn btn-sm btn-outline" onclick="this.parentElement.querySelector('.route-preview').style.display='none'; this.parentElement.querySelector('.route-full').style.display='block'; this.style.display='none';">Показать полностью</button>
                </td>
                <td>
                    <span class="status-badge ${transport.isActive ? 'active' : 'inactive'}">
                        ${transport.isActive ? 'Активен' : 'Неактивен'}
                    </span>
                </td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="adminDashboard.editTransport(${transport.id})">Редактировать</button>
                    <button class="btn btn-sm btn-danger" onclick="adminDashboard.deleteTransport(${transport.id})">Удалить</button>
                </td>
            `;
            tbody.appendChild(row);
            console.log(`🚌 renderTransportTable: добавлена строка ${index + 1} в таблицу`);
        });
        
        console.log('🚌 renderTransportTable: завершено. Всего строк в tbody:', tbody.children.length);
    }

    populateTransportFilters(transports) {
        const yearFilter = document.getElementById('transportYearFilter');
        const monthFilter = document.getElementById('transportMonthFilter');
        
        if (yearFilter) {
            const years = [...new Set(transports.map(t => t.year))].sort((a, b) => b - a);
            yearFilter.innerHTML = '<option value="">Все годы</option>' + 
                years.map(year => `<option value="${year}">${year}</option>`).join('');
        }
        
        if (monthFilter) {
            const months = [
                { value: 1, name: 'Январь' },
                { value: 2, name: 'Февраль' },
                { value: 3, name: 'Март' },
                { value: 4, name: 'Апрель' },
                { value: 5, name: 'Май' },
                { value: 6, name: 'Июнь' },
                { value: 7, name: 'Июль' },
                { value: 8, name: 'Август' },
                { value: 9, name: 'Сентябрь' },
                { value: 10, name: 'Октябрь' },
                { value: 11, name: 'Ноябрь' },
                { value: 12, name: 'Декабрь' }
            ];
            monthFilter.innerHTML = '<option value="">Все месяцы</option>' + 
                months.map(month => `<option value="${month.value}">${month.name}</option>`).join('');
        }
    }

    async addTransport() {
        const year = prompt('Введите год:');
        if (!year) return;
        
        const month = prompt('Введите номер месяца (1-12):');
        if (!month) return;
        
        const monthNames = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
        const monthName = monthNames[parseInt(month) - 1];
        
        const route = prompt('Введите маршрут:');
        if (!route) return;

        try {
            const response = await fetch(`${this.apiBase}/api/transport`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
                    'Cache-Control': 'no-cache'
                },
                body: JSON.stringify({
                    year: parseInt(year),
                    month: parseInt(month),
                    monthName: monthName,
                    route: route
                })
            });
            
            if (!response.ok) {
                throw new Error('Ошибка создания маршрута');
            }
            
            this.showNotification('Маршрут успешно добавлен', 'success');
            this.loadTransportData();
        } catch (error) {
            console.error('Ошибка добавления маршрута:', error);
            this.showNotification('Ошибка добавления маршрута', 'error');
        }
    }

    async editTransport(id) {
        // Простая реализация редактирования
        const newRoute = prompt('Введите новый маршрут:');
        if (!newRoute) return;

        try {
            const response = await fetch(`${this.apiBase}/api/transport/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                },
                body: JSON.stringify({ route: newRoute })
            });
            
            if (!response.ok) {
                throw new Error('Ошибка обновления маршрута');
            }
            
            this.showNotification('Маршрут успешно обновлен', 'success');
            this.loadTransportData();
        } catch (error) {
            console.error('Ошибка обновления маршрута:', error);
            this.showNotification('Ошибка обновления маршрута', 'error');
        }
    }

    async deleteTransport(id) {
        if (!confirm('Вы уверены, что хотите удалить этот маршрут?')) return;

        try {
            const response = await fetch(`${this.apiBase}/api/transport/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                }
            });
            
            if (!response.ok) {
                throw new Error('Ошибка удаления маршрута');
            }
            
            this.showNotification('Маршрут успешно удален', 'success');
            this.loadTransportData();
        } catch (error) {
            console.error('Ошибка удаления маршрута:', error);
            this.showNotification('Ошибка удаления маршрута', 'error');
        }
    }

    truncateText(text, maxLength) {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    }

    processTransportData(data) {
        console.log('=== НАЧАЛО ОБРАБОТКИ ТРАНСПОРТА ===');
        console.log('Данные транспорта:', data);
        console.log('Количество строк данных:', data ? data.length : 0);
        
        const processedData = [];
        const monthNames = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
        
        if (!data || !Array.isArray(data)) {
            console.error('processTransportData: данные не являются массивом!', data);
            return { data: [], hasErrors: true };
        }
        
        for (let i = 0; i < data.length; i++) {
            const row = data[i];
            try {
                console.log(`Обрабатываем строку ${i + 1}:`, row);
                
                // Ожидаем колонки: год, месяц, маршрут
                const year = parseInt(row['год'] || row['year'] || row[0]);
                const monthStr = row['месяц'] || row['month'] || row[1];
                const route = row['маршрут'] || row['route'] || row[2];
                
                console.log(`Строка ${i + 1}: год=${year}, месяц="${monthStr}", маршрут="${route}"`);
                
                // Преобразуем название месяца в число
                let month = parseInt(monthStr);
                if (isNaN(month)) {
                    // Если не число, ищем по названию
                    const monthIndex = monthNames.findIndex(name => 
                        name.toLowerCase() === monthStr.toLowerCase()
                    );
                    if (monthIndex !== -1) {
                        month = monthIndex + 1;
                        console.log(`Найден месяц "${monthStr}" -> ${month}`);
                    } else {
                        console.warn(`Неизвестный месяц: "${monthStr}"`);
                        month = 0;
                    }
                }
                
                if (!year || !month || !route) {
                    console.warn(`Строка ${i + 1}: пропускаем из-за неполных данных:`, { year, month, route });
                    continue;
                }
                
                const monthName = monthNames[month - 1] || `Месяц ${month}`;
                
                // Парсим маршрут для извлечения остановок
                const routeStops = this.parseRouteStops(route);
                
                const processedRow = {
                    year: year,
                    month: month,
                    monthName: monthName,
                    route: route,
                    routeStops: routeStops,
                    isActive: true
                };
                
                processedData.push(processedRow);
                
                console.log(`✅ Строка ${i + 1}: обработан маршрут ${year}-${month} (${monthName}) - ${route.substring(0, 50)}...`);
            } catch (error) {
                console.error(`❌ Строка ${i + 1}: ошибка обработки:`, error, row);
            }
        }
        
        console.log(`=== ОБРАБОТКА ТРАНСПОРТА ЗАВЕРШЕНА: ${processedData.length} записей из ${data.length} строк ===`);
        return { data: processedData, hasErrors: false };
    }
    
    parseRouteStops(route) {
        // Парсим маршрут вида "ул. Большая Советская (д.1-25) → ул. Ленина (д.10-40) → ..."
        const stops = [];
        const parts = route.split('→');
        
        parts.forEach(part => {
            const trimmed = part.trim();
            if (trimmed) {
                // Извлекаем название улицы и номера домов
                const match = trimmed.match(/^(.+?)\s*\(д\.(.+?)\)$/);
                if (match) {
                    stops.push({
                        street: match[1].trim(),
                        houses: match[2].trim()
                    });
                } else {
                    stops.push({
                        street: trimmed,
                        houses: null
                    });
                }
            }
        });
        
        return stops;
    }

    // Initialize the dashboard
    viewImportedData() {
        // Переходим к разделу дашборда, где можно просмотреть все данные
        this.showSection('dashboard');
        
        // Обновляем данные на дашборде
        this.loadDashboardData();
        
        // Показываем уведомление
        this.addLogEntry('Переход к просмотру данных на дашборде', 'info');
    }

    init() {
        this.setupEventListeners();
        this.checkAuth();
    }

    // Методы для работы с заявками
    async loadOrders() {
        try {
            const response = await fetch(`${this.apiBase}/api/orders`);
            if (!response.ok) throw new Error('Ошибка загрузки заявок');
            const data = await response.json();
            this.renderOrdersTable(data.orders || data);
        } catch (error) {
            console.error('Ошибка загрузки заявок:', error);
            this.showError('Не удалось загрузить заявки');
        }
    }

    renderOrdersTable(orders) {
        const tbody = document.getElementById('ordersTableBody');
        if (!tbody) return;

        if (!orders || orders.length === 0) {
            tbody.innerHTML = '<tr><td colspan="9" class="text-center">Заявки не найдены</td></tr>';
            return;
        }

        tbody.innerHTML = orders.map(order => `
            <tr>
                <td>#${order.id}</td>
                <td>
                    <span class="service-type ${order.type}">
                        ${this.getServiceTypeName(order.type)}
                    </span>
                </td>
                <td>${order.company || '-'}</td>
                <td>${order.contact || '-'}</td>
                <td>${order.phone || '-'}</td>
                <td>${order.estimatedCost || '-'}</td>
                <td>
                    <span class="status-badge status-${order.status || 'pending'}">
                        ${this.getStatusName(order.status || 'pending')}
                    </span>
                </td>
                <td>${new Date(order.createdAt || order.date).toLocaleDateString('ru-RU')}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-sm btn-primary" onclick="adminDashboard.viewOrder(${order.id})">
                            Просмотр
                        </button>
                        <button class="btn btn-sm btn-secondary" onclick="adminDashboard.updateOrderStatus(${order.id})">
                            Изменить статус
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    getServiceTypeName(type) {
        const types = {
            'other': 'Документация',
            'tower_rental': 'Аренда автовышки',
            'evacuation': 'Вызов эвакуатора'
        };
        return types[type] || type;
    }

    getStatusName(status) {
        const statuses = {
            'pending': 'Новая',
            'in_progress': 'В работе',
            'completed': 'Завершена',
            'cancelled': 'Отменена'
        };
        return statuses[status] || status;
    }

    async viewOrder(orderId) {
        console.log('=== ПРОСМОТР ЗАЯВКИ ===');
        console.log('ID заявки:', orderId);
        
        try {
            const response = await fetch(`/api/orders/${orderId}`);
            console.log('Ответ сервера:', response.status, response.statusText);
            
            if (!response.ok) throw new Error('Ошибка загрузки заявки');
            
            const result = await response.json();
            console.log('Данные заявки:', result);
            
            const order = result.order || result;
            this.showOrderModal(order);
        } catch (error) {
            console.error('Ошибка загрузки заявки:', error);
            this.showError('Не удалось загрузить заявку: ' + error.message);
        }
    }

    showOrderModal(order) {
        console.log('=== ПОКАЗ МОДАЛЬНОГО ОКНА ===');
        console.log('Данные заявки:', order);
        
        // Создаем модальное окно для просмотра заявки
        const modal = document.createElement('div');
        modal.id = 'order-modal';
        modal.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; z-index: 10000; display: flex; align-items: center; justify-content: center; background: rgba(0,0,0,0.5);';
        
        modal.innerHTML = `
            <div onclick="event.stopPropagation()" style="background: white; padding: 20px; border-radius: 8px; max-width: 600px; max-height: 80vh; overflow-y: auto; box-shadow: 0 4px 20px rgba(0,0,0,0.3);">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; border-bottom: 1px solid #eee; padding-bottom: 10px;">
                    <h2>Заявка #${order.id}</h2>
                    <button onclick="document.getElementById('order-modal').remove()" style="background: none; border: none; font-size: 20px; cursor: pointer;">✕</button>
                </div>
                <div>
                    <div style="margin-bottom: 10px; padding: 8px 0; border-bottom: 1px solid #f0f0f0;">
                        <strong>Тип услуги:</strong> ${this.getServiceTypeName(order.type)}
                    </div>
                    <div style="margin-bottom: 10px; padding: 8px 0; border-bottom: 1px solid #f0f0f0;">
                        <strong>Организация:</strong> ${order.company || '-'}
                    </div>
                    <div style="margin-bottom: 10px; padding: 8px 0; border-bottom: 1px solid #f0f0f0;">
                        <strong>Контактное лицо:</strong> ${order.contact || '-'}
                    </div>
                    <div style="margin-bottom: 10px; padding: 8px 0; border-bottom: 1px solid #f0f0f0;">
                        <strong>Телефон:</strong> ${order.phone || '-'}
                    </div>
                    <div style="margin-bottom: 10px; padding: 8px 0; border-bottom: 1px solid #f0f0f0;">
                        <strong>Email:</strong> ${order.email || '-'}
                    </div>
                    <div style="margin-bottom: 10px; padding: 8px 0; border-bottom: 1px solid #f0f0f0;">
                        <strong>Стоимость:</strong> ${order.calculated_price || '-'}
                    </div>
                    <div style="margin-bottom: 10px; padding: 8px 0; border-bottom: 1px solid #f0f0f0;">
                        <strong>Статус:</strong> ${this.getStatusName(order.status || 'new')}
                    </div>
                    <div style="margin-bottom: 10px; padding: 8px 0; border-bottom: 1px solid #f0f0f0;">
                        <strong>Дата создания:</strong> ${new Date(order.created_at || order.date).toLocaleString('ru-RU')}
                    </div>
                    ${order.description ? `<div style="margin-bottom: 10px; padding: 8px 0; border-bottom: 1px solid #f0f0f0;"><strong>Описание:</strong> ${order.description}</div>` : ''}
                    ${order.comments ? `<div style="margin-bottom: 10px; padding: 8px 0; border-bottom: 1px solid #f0f0f0;"><strong>Комментарии:</strong> ${order.comments}</div>` : ''}
                </div>
            </div>
        `;
        
        // Добавляем обработчик клика на фон для закрытия
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                modal.remove();
            }
        });
        
        document.body.appendChild(modal);
        console.log('Модальное окно добавлено в DOM');
    }

    async updateOrderStatus(orderId) {
        const newStatus = prompt('Введите новый статус (new, in_progress, completed, cancelled):');
        if (!newStatus) return;

        try {
            const response = await fetch(`${this.apiBase}/api/orders/${orderId}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            });

            if (response.ok) {
                this.showSuccess('Статус заявки обновлен');
                this.loadOrders();
            } else {
                throw new Error('Ошибка обновления статуса');
            }
        } catch (error) {
            console.error('Ошибка обновления статуса:', error);
            this.showError('Не удалось обновить статус заявки');
        }
    }

    showError(message) {
        alert('Ошибка: ' + message);
    }

    showSuccess(message) {
        alert('Успех: ' + message);
    }

    // ==================== VACANCIES METHODS ====================
    
    async loadVacancies() {
        try {
            console.log('Загрузка вакансий...');
            const response = await fetch(`${this.apiBase}/api/vacancies/admin`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const vacancies = await response.json();
            console.log('Загружены вакансии:', vacancies);
            
            this.renderVacanciesTable(vacancies);
            this.setupVacancyEventListeners();
        } catch (error) {
            console.error('Ошибка загрузки вакансий:', error);
            this.showError('Не удалось загрузить вакансии');
        }
    }

    renderVacanciesTable(vacancies) {
        const tbody = document.getElementById('vacanciesTableBody');
        if (!tbody) return;

        if (vacancies.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center">Нет вакансий</td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = vacancies.map(vacancy => `
            <tr>
                <td>${vacancy.title}</td>
                <td>${vacancy.department}</td>
                <td>${vacancy.location}</td>
                <td>${this.getEmploymentTypeName(vacancy.employment_type)}</td>
                <td>
                    <span class="status-badge status-${vacancy.is_active ? 'active' : 'inactive'}">
                        ${vacancy.is_active ? 'Активная' : 'Неактивная'}
                    </span>
                </td>
                <td>${new Date(vacancy.created_at).toLocaleDateString('ru-RU')}</td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="adminDashboard.editVacancy(${vacancy.id})">
                        Редактировать
                    </button>
                    <button class="btn btn-sm btn-${vacancy.is_active ? 'warning' : 'success'}" 
                            onclick="adminDashboard.toggleVacancyStatus(${vacancy.id})">
                        ${vacancy.is_active ? 'Деактивировать' : 'Активировать'}
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="adminDashboard.deleteVacancy(${vacancy.id})">
                        Удалить
                    </button>
                </td>
            </tr>
        `).join('');
    }

    getEmploymentTypeName(type) {
        const types = {
            'full-time': 'Полная занятость',
            'part-time': 'Частичная занятость',
            'contract': 'Договор',
            'internship': 'Стажировка'
        };
        return types[type] || type;
    }

    setupVacancyEventListeners() {
        // Кнопка добавления вакансии
        const addBtn = document.getElementById('addVacancyBtn');
        if (addBtn) {
            addBtn.addEventListener('click', () => this.showVacancyModal());
        }

        // Фильтр по статусу
        const statusFilter = document.getElementById('vacancyStatusFilter');
        if (statusFilter) {
            statusFilter.addEventListener('change', () => this.filterVacancies());
        }

        // Форма вакансии
        const form = document.getElementById('vacancyForm');
        if (form) {
            form.addEventListener('submit', (e) => this.handleVacancySubmit(e));
        }

        // Кнопка сохранения
        const saveBtn = document.getElementById('vacancyModalSave');
        if (saveBtn) {
            saveBtn.addEventListener('click', (e) => {
                e.preventDefault();
                const form = document.getElementById('vacancyForm');
                if (form) {
                    this.handleVacancySubmit({ target: form, preventDefault: () => {} });
                }
            });
        }
    }

    setupVacancyModalHandlers() {
        // Обработчики для закрытия модального окна вакансий
        const modal = document.getElementById('vacancyModal');
        if (modal) {
            // Закрытие по клику на backdrop
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.hideVacancyModal();
                }
            });

            // Закрытие по клику на кнопку закрытия
            const closeBtn = document.getElementById('vacancyModalClose');
            if (closeBtn) {
                closeBtn.addEventListener('click', () => this.hideVacancyModal());
            }

            // Закрытие по клику на кнопку отмены
            const cancelBtn = document.getElementById('vacancyModalCancel');
            if (cancelBtn) {
                cancelBtn.addEventListener('click', () => this.hideVacancyModal());
            }

            // Закрытие по Escape
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && modal.classList.contains('active')) {
                    this.hideVacancyModal();
                }
            });
        }
    }

    hideVacancyModal() {
        const modal = document.getElementById('vacancyModal');
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        }
    }

    showVacancyModal(vacancy = null) {
        console.log('showVacancyModal called');
        const modal = document.getElementById('vacancyModal');
        console.log('Modal element:', modal);
        
        if (!modal) {
            console.error('vacancyModal not found!');
            return;
        }

        const title = document.getElementById('vacancyModalTitle');
        const form = document.getElementById('vacancyForm');
        
        if (vacancy) {
            if (title) title.textContent = 'Редактировать вакансию';
            this.fillVacancyForm(vacancy);
        } else {
            if (title) title.textContent = 'Добавить вакансию';
            if (form) form.reset();
        }

        console.log('Showing modal...');
        
        // Показываем модальное окно точно так же, как обычные модальные окна
        modal.classList.add('active');
        
        document.body.style.overflow = 'hidden';
    }

    fillVacancyForm(vacancy) {
        document.getElementById('vacancyTitle').value = vacancy.title || '';
        document.getElementById('vacancyDepartment').value = vacancy.department || '';
        document.getElementById('vacancyLocation').value = vacancy.location || '';
        document.getElementById('vacancyEmploymentType').value = vacancy.employment_type || 'full-time';
        document.getElementById('vacancySalary').value = vacancy.salary || '';
        document.getElementById('vacancyDescription').value = vacancy.description || '';
        document.getElementById('vacancyRequirements').value = vacancy.requirements || '';
        document.getElementById('vacancyResponsibilities').value = vacancy.responsibilities || '';
        document.getElementById('vacancyBenefits').value = vacancy.benefits || '';
        document.getElementById('vacancyContactEmail').value = vacancy.contact_email || '';
        document.getElementById('vacancyContactPhone').value = vacancy.contact_phone || '';
        document.getElementById('vacancyIsActive').checked = vacancy.is_active !== false;
    }

    async handleVacancySubmit(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData.entries());
        
        // Преобразуем checkbox в boolean
        data.is_active = data.is_active === 'on';
        
        console.log('=== ОТПРАВКА ВАКАНСИИ ===');
        console.log('Данные:', data);

        try {
            const vacancyId = this.currentVacancyId;
            const url = vacancyId ? `${this.apiBase}/api/vacancies/${vacancyId}` : `${this.apiBase}/api/vacancies`;
            const method = vacancyId ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                throw new Error('Ошибка сохранения вакансии');
            }

            const result = await response.json();
            console.log('Результат:', result);

            this.showSuccess(vacancyId ? 'Вакансия обновлена' : 'Вакансия создана');
            this.closeVacancyModal();
            this.loadVacancies();
        } catch (error) {
            console.error('Ошибка сохранения вакансии:', error);
            this.showError('Не удалось сохранить вакансию');
        }
    }

    async editVacancy(vacancyId) {
        try {
            const response = await fetch(`${this.apiBase}/api/vacancies/${vacancyId}`);
            if (!response.ok) throw new Error('Ошибка загрузки вакансии');
            
            const vacancy = await response.json();
            this.currentVacancyId = vacancyId;
            this.showVacancyModal(vacancy);
        } catch (error) {
            console.error('Ошибка загрузки вакансии:', error);
            this.showError('Не удалось загрузить вакансию');
        }
    }

    async toggleVacancyStatus(vacancyId) {
        try {
            const response = await fetch(`${this.apiBase}/api/vacancies/${vacancyId}/toggle`, {
                method: 'PUT'
            });

            if (!response.ok) throw new Error('Ошибка изменения статуса');

            this.showSuccess('Статус вакансии изменен');
            this.loadVacancies();
        } catch (error) {
            console.error('Ошибка изменения статуса:', error);
            this.showError('Не удалось изменить статус вакансии');
        }
    }

    async deleteVacancy(vacancyId) {
        if (!confirm('Вы уверены, что хотите удалить эту вакансию?')) return;

        try {
            const response = await fetch(`${this.apiBase}/api/vacancies/${vacancyId}`, {
                method: 'DELETE'
            });

            if (!response.ok) throw new Error('Ошибка удаления вакансии');

            this.showSuccess('Вакансия удалена');
            this.loadVacancies();
        } catch (error) {
            console.error('Ошибка удаления вакансии:', error);
            this.showError('Не удалось удалить вакансию');
        }
    }

    closeVacancyModal() {
        const modal = document.getElementById('vacancyModal');
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = '';
            this.currentVacancyId = null;
        }
    }

    filterVacancies() {
        // Простая фильтрация на клиенте
        const statusFilter = document.getElementById('vacancyStatusFilter');
        const filterValue = statusFilter.value;
        
        const rows = document.querySelectorAll('#vacanciesTableBody tr');
        rows.forEach(row => {
            if (filterValue === '') {
                row.style.display = '';
            } else {
                const statusCell = row.querySelector('.status-badge');
                if (statusCell) {
                    const isActive = statusCell.classList.contains('status-active');
                    const shouldShow = (filterValue === 'active' && isActive) || 
                                     (filterValue === 'inactive' && !isActive);
                    row.style.display = shouldShow ? '' : 'none';
                }
            }
        });
    }

    // Contact Management Methods
    setupContactEventListeners() {
        // Кнопка добавления контакта
        const addBtn = document.getElementById('addContactBtn');
        if (addBtn) {
            addBtn.addEventListener('click', () => this.showAddContactModal());
        }

        // Фильтр по типу
        const typeFilter = document.getElementById('contactTypeFilter');
        if (typeFilter) {
            typeFilter.addEventListener('change', () => this.filterContacts());
        }
    }

    async loadContacts() {
        try {
            const response = await fetch(`${this.apiBase}/api/contacts`);
            if (!response.ok) throw new Error('Ошибка загрузки контактов');
            
            const contacts = await response.json();
            this.renderContacts(contacts);
        } catch (error) {
            console.error('Ошибка загрузки контактов:', error);
            this.showError('Не удалось загрузить контакты');
        }
    }

    renderContacts(contacts) {
        const tbody = document.getElementById('contactsTableBody');
        if (!tbody) return;

        tbody.innerHTML = contacts.map(contact => `
            <tr>
                <td>${this.getContactTypeLabel(contact.type)}</td>
                <td>${contact.name || '-'}</td>
                <td>${contact.phone || '-'}</td>
                <td>${contact.email || '-'}</td>
                <td>
                    <span class="status-badge ${contact.is_active ? 'status-active' : 'status-inactive'}">
                        ${contact.is_active ? 'Активен' : 'Неактивен'}
                    </span>
                </td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-sm btn-primary" onclick="adminDashboard.editContact(${contact.id})">
                            Редактировать
                        </button>
                        <button class="btn btn-sm btn-secondary" onclick="adminDashboard.toggleContactStatus(${contact.id})">
                            ${contact.is_active ? 'Деактивировать' : 'Активировать'}
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="adminDashboard.deleteContact(${contact.id})">
                            Удалить
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    getContactTypeLabel(type) {
        const types = {
            'main': 'Основной',
            'documents': 'Документооборот',
            'emergency': 'Экстренный',
            'department': 'Отдел'
        };
        return types[type] || type;
    }

    showAddContactModal() {
        const title = 'Добавить контакт';
        const content = `
            <form id="addContactForm">
                <div class="form-group">
                    <label for="contactType">Тип контакта *</label>
                    <select id="contactType" name="type" required>
                        <option value="">Выберите тип</option>
                        <option value="main">Основной</option>
                        <option value="documents">Документооборот</option>
                        <option value="emergency">Экстренный</option>
                        <option value="department">Отдел</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="contactName">Название</label>
                    <input type="text" id="contactName" name="name" placeholder="Название отдела или контакта">
                </div>
                <div class="form-group">
                    <label for="contactDescription">Описание</label>
                    <textarea id="contactDescription" name="description" rows="3" placeholder="Описание отдела"></textarea>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="contactPhone">Телефон</label>
                        <input type="tel" id="contactPhone" name="phone" placeholder="+7 (4812) 12-34-56">
                    </div>
                    <div class="form-group">
                        <label for="contactEmail">Email</label>
                        <input type="email" id="contactEmail" name="email" placeholder="contact@example.com">
                    </div>
                </div>
                <div class="form-group">
                    <label for="contactAddress">Адрес</label>
                    <input type="text" id="contactAddress" name="address" placeholder="г. Смоленск, ул. Ленина, 1">
                </div>
                <div class="form-group">
                    <label for="contactWorkingHours">Часы работы</label>
                    <input type="text" id="contactWorkingHours" name="working_hours" placeholder="пн-пт: 9:00-18:00">
                </div>
                <div class="form-group">
                    <label for="contactSortOrder">Порядок сортировки</label>
                    <input type="number" id="contactSortOrder" name="sort_order" value="0" min="0">
                </div>
            </form>
        `;
        
        this.showModal(title, content);
        
        const saveBtn = document.getElementById('modalSave');
        saveBtn.onclick = async () => {
            await this.handleContactSubmit();
        };
    }

    async handleContactSubmit() {
        const form = document.getElementById('addContactForm');
        if (!form) return;

        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());
        
        try {
            const response = await fetch(`${this.apiBase}/api/contacts`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                },
                body: JSON.stringify(data)
            });

            if (!response.ok) throw new Error('Ошибка создания контакта');

            this.showSuccess('Контакт создан');
            this.hideModal();
            this.loadContacts();
        } catch (error) {
            console.error('Ошибка создания контакта:', error);
            this.showError('Не удалось создать контакт');
        }
    }

    async editContact(contactId) {
        try {
            const response = await fetch(`${this.apiBase}/api/contacts/${contactId}`);
            if (!response.ok) throw new Error('Ошибка загрузки контакта');
            
            const contact = await response.json();
            this.showEditContactModal(contact);
        } catch (error) {
            console.error('Ошибка загрузки контакта:', error);
            this.showError('Не удалось загрузить контакт');
        }
    }

    showEditContactModal(contact) {
        const title = 'Редактировать контакт';
        const content = `
            <form id="editContactForm">
                <div class="form-group">
                    <label for="editContactType">Тип контакта *</label>
                    <select id="editContactType" name="type" required>
                        <option value="main" ${contact.type === 'main' ? 'selected' : ''}>Основной</option>
                        <option value="documents" ${contact.type === 'documents' ? 'selected' : ''}>Документооборот</option>
                        <option value="emergency" ${contact.type === 'emergency' ? 'selected' : ''}>Экстренный</option>
                        <option value="department" ${contact.type === 'department' ? 'selected' : ''}>Отдел</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="editContactName">Название</label>
                    <input type="text" id="editContactName" name="name" value="${contact.name || ''}" placeholder="Название отдела или контакта">
                </div>
                <div class="form-group">
                    <label for="editContactDescription">Описание</label>
                    <textarea id="editContactDescription" name="description" rows="3" placeholder="Описание отдела">${contact.description || ''}</textarea>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="editContactPhone">Телефон</label>
                        <input type="tel" id="editContactPhone" name="phone" value="${contact.phone || ''}" placeholder="+7 (4812) 12-34-56">
                    </div>
                    <div class="form-group">
                        <label for="editContactEmail">Email</label>
                        <input type="email" id="editContactEmail" name="email" value="${contact.email || ''}" placeholder="contact@example.com">
                    </div>
                </div>
                <div class="form-group">
                    <label for="editContactAddress">Адрес</label>
                    <input type="text" id="editContactAddress" name="address" value="${contact.address || ''}" placeholder="г. Смоленск, ул. Ленина, 1">
                </div>
                <div class="form-group">
                    <label for="editContactWorkingHours">Часы работы</label>
                    <input type="text" id="editContactWorkingHours" name="working_hours" value="${contact.working_hours || ''}" placeholder="пн-пт: 9:00-18:00">
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="editContactSortOrder">Порядок сортировки</label>
                        <input type="number" id="editContactSortOrder" name="sort_order" value="${contact.sort_order || 0}" min="0">
                    </div>
                    <div class="form-group">
                        <label for="editContactIsActive">Статус</label>
                        <select id="editContactIsActive" name="is_active">
                            <option value="true" ${contact.is_active ? 'selected' : ''}>Активен</option>
                            <option value="false" ${!contact.is_active ? 'selected' : ''}>Неактивен</option>
                        </select>
                    </div>
                </div>
            </form>
        `;
        
        this.showModal(title, content);
        
        const saveBtn = document.getElementById('modalSave');
        saveBtn.onclick = async () => {
            await this.handleContactUpdate(contact.id);
        };
    }

    async handleContactUpdate(contactId) {
        const form = document.getElementById('editContactForm');
        if (!form) return;

        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());
        data.is_active = data.is_active === 'true';
        
        try {
            const response = await fetch(`${this.apiBase}/api/contacts/${contactId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                },
                body: JSON.stringify(data)
            });

            if (!response.ok) throw new Error('Ошибка обновления контакта');

            this.showSuccess('Контакт обновлен');
            this.hideModal();
            this.loadContacts();
        } catch (error) {
            console.error('Ошибка обновления контакта:', error);
            this.showError('Не удалось обновить контакт');
        }
    }

    async toggleContactStatus(contactId) {
        try {
            const response = await fetch(`${this.apiBase}/api/contacts/${contactId}/toggle`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                }
            });

            if (!response.ok) throw new Error('Ошибка изменения статуса');

            this.showSuccess('Статус контакта изменен');
            this.loadContacts();
        } catch (error) {
            console.error('Ошибка изменения статуса:', error);
            this.showError('Не удалось изменить статус контакта');
        }
    }

    async deleteContact(contactId) {
        if (!confirm('Вы уверены, что хотите удалить этот контакт?')) return;

        try {
            const response = await fetch(`${this.apiBase}/api/contacts/${contactId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                }
            });

            if (!response.ok) throw new Error('Ошибка удаления контакта');

            this.showSuccess('Контакт удален');
            this.loadContacts();
        } catch (error) {
            console.error('Ошибка удаления контакта:', error);
            this.showError('Не удалось удалить контакт');
        }
    }

    filterContacts() {
        const typeFilter = document.getElementById('contactTypeFilter');
        const filterValue = typeFilter.value;
        const rows = document.querySelectorAll('#contactsTableBody tr');

        rows.forEach(row => {
            if (!filterValue) {
                row.style.display = '';
            } else {
                const typeCell = row.cells[0];
                const typeText = typeCell.textContent.toLowerCase();
                const shouldShow = typeText.includes(filterValue.toLowerCase());
                row.style.display = shouldShow ? '' : 'none';
            }
        });
    }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.adminDashboard = new AdminDashboard();
    setTimeout(() => {
        const dashLink = document.querySelector('.nav-link[data-section="dashboard"]');
        if (dashLink) {
            dashLink.click();
        } else if (window.adminDashboard) {
            window.adminDashboard.showSection('dashboard');
        }
    }, 0);
});