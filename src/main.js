document.addEventListener('DOMContentLoaded', () => {
  // ======= Элементы =======
  const burger = document.querySelector('[data-burger]');
  const mobileMenu = document.querySelector('[data-mobile-menu]');
  const menuBackdrop = document.querySelector('[data-menu-backdrop]');
  const header = document.querySelector('[data-header]');
  const closeBtn = document.querySelector('[data-close-menu]');
  const mobileLinks = document.querySelectorAll('[data-mobile-link]');
  const searchInput = document.querySelector('[data-search-input]');
  const suggestions = document.querySelector('[data-suggestions]');

  // ======= Функции открытия/закрытия меню =======
  function isMenuOpen(){
    return !!(mobileMenu && !mobileMenu.hidden && mobileMenu.classList.contains('open'));
  }
  function toggleMenu(){
    if (!mobileMenu) return;
    if (!isMenuOpen()) openMenu(); else closeMenu();
  }
  function openMenu() {
    if (!mobileMenu) return;
    // При открытии возвращаем хедер в видимую позицию, чтобы меню не уехало
    header?.classList.remove('scrolled');
    mobileMenu.hidden = false;
    mobileMenu.classList.add('open');
    burger?.setAttribute('aria-expanded', 'true');
    burger?.classList.add('active');
    // floatingBurger?.classList.add('active');
    if (menuBackdrop){ menuBackdrop.hidden = false; menuBackdrop.classList.add('visible'); }
    document.body.style.overflow = 'hidden';
  }

  function closeMenu() {
    if (!mobileMenu) return;
    mobileMenu.classList.remove('open');
    const onEnd = (evt) => {
      if (evt.propertyName !== 'transform') return;
      mobileMenu.hidden = true;
      mobileMenu.removeEventListener('transitionend', onEnd);
    };
    mobileMenu.addEventListener('transitionend', onEnd);
    burger?.setAttribute('aria-expanded', 'false');
    burger?.classList.remove('active');
    if (menuBackdrop){ menuBackdrop.classList.remove('visible'); menuBackdrop.hidden = true; }
    document.body.style.overflow = '';
  }

  // ======= Обработчики =======
  // Обработчик для основного бургера
  burger?.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleMenu();
  });


  // Обработчик для кнопки закрытия
  closeBtn?.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
        closeMenu();
  });

  // Обработчик для фона меню
  menuBackdrop?.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    closeMenu();
  });

  // Обработчик для мобильных ссылок
  mobileLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      const target = link.getAttribute('data-scroll-to');
      const href = link.getAttribute('href');
      
      // Если это ссылка "Главная" - всегда ведем на index.html
      if (link.textContent.trim() === 'Главная') {
        e.preventDefault();
        e.stopPropagation();
      closeMenu();
        window.location.href = 'index.html#home';
        return;
      }
      
      // Если это якорь на текущей странице
      if (target && href && href.startsWith('#')) {
        e.preventDefault();
        e.stopPropagation();
      closeMenu();
        smoothScrollTo(target);
      }
      // Если это ссылка на другую страницу
      else if (href && !href.startsWith('#')) {
        closeMenu();
        // Позволяем браузеру перейти по ссылке
      }
      // Если это якорь без data-scroll-to
      else if (href && href.startsWith('#')) {
        e.preventDefault();
        e.stopPropagation();
        closeMenu();
        smoothScrollTo(href);
      }
    });
  });

  // ======= Скрытие/показ хедера при скролле =======
  let lastScrollY = window.scrollY;
  let ticking = false;

  function updateHeader() {
    const currentScrollY = window.scrollY;
    const delta = 8; // порог, чтобы не дёргать хедер на микроскроллах

    // Смена стиля после небольшой прокрутки
    if (currentScrollY > 100) {
      header?.classList.add('scrolled');
    } else {
      header?.classList.remove('scrolled');
    }

    // Скрывать при прокрутке вниз, показывать при прокрутке вверх
    if (currentScrollY > lastScrollY + delta && currentScrollY > 100) {
      header?.classList.add('hide');
    } else if (currentScrollY < lastScrollY - delta) {
      header?.classList.remove('hide');
    }
    if (currentScrollY <= 0) {
      header?.classList.remove('hide');
    }

    lastScrollY = currentScrollY;
    ticking = false;
  }

  function requestTick() {
    if (!ticking) {
      requestAnimationFrame(updateHeader);
      ticking = true;
    }
  }

  window.addEventListener('scroll', requestTick, { passive: true });

  // ======= Поиск =======
  const searchData = [
    { title: 'Дорожные работы', url: '#roadworks' },
    { title: 'Перекрытия', url: '#closures' },
    { title: 'Камеры', url: '#cameras' },
    { title: 'Светофоры', url: '#traffic-lights' },
    { title: 'Парковки', url: '#parking' },
    { title: 'Велополосы', url: '#bike-lanes' }
  ];

  function showSuggestions(query) {
    if (!suggestions || !query.trim()) {
      suggestions.hidden = true;
      return;
    }

    const filtered = searchData.filter(item => 
      item.title.toLowerCase().includes(query.toLowerCase())
    );

    if (filtered.length === 0) {
        suggestions.hidden = true;
      return;
    }

    suggestions.innerHTML = filtered.map(item => 
      `<li><a href="${item.url}">${item.title}</a></li>`
    ).join('');
    suggestions.hidden = false;
  }

  searchInput?.addEventListener('input', (e) => {
    showSuggestions(e.target.value);
  });

  // Закрытие подсказок при клике вне
  document.addEventListener('click', (e) => {
    const within = e.target.closest('[data-search-input], [data-suggestions]');
    if (!within) {
        suggestions.hidden = true;
    }
  });

  // ======= Мониторинг аварийности =======
  let accidentsChart = null;
  let accidentsComparisonChart = null;
  let violationsComparisonChart = null;
  let evacuationComparisonChart = null;
  
  // ======= API helpers (live backend data) =======
  const apiBase = (window && window.API_BASE) ? window.API_BASE : '';
  const publicStatsCache = { fines: {}, evacuations: {}, accidents: {} };
  
  async function fetchNoCache(url){
    const ts = Date.now();
    const sep = url.includes('?') ? '&' : '?';
    const res = await fetch(`${url}${sep}ts=${ts}`, { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  }
  
  async function getFinesStats(year, compareYear){
    const key = String(year);
    if (!publicStatsCache.fines[key]){
      publicStatsCache.fines[key] = await fetchNoCache(`${apiBase}/api/fines/statistics?year=${year}`);
    }
    let compare = null;
    if (compareYear){
      const ckey = String(compareYear);
      if (!publicStatsCache.fines[ckey]){
        publicStatsCache.fines[ckey] = await fetchNoCache(`${apiBase}/api/fines/statistics?year=${compareYear}`);
      }
      compare = publicStatsCache.fines[ckey];
    }
    return { current: publicStatsCache.fines[key]?.current || publicStatsCache.fines[key], compare: compare?.current || compare?.compare || null };
  }
  
  async function getEvacStats(year, compareYear){
    const key = String(year);
    if (!publicStatsCache.evacuations[key]){
      publicStatsCache.evacuations[key] = await fetchNoCache(`${apiBase}/api/evacuations/statistics?year=${year}`);
    }
    let compare = null;
    if (compareYear){
      const ckey = String(compareYear);
      if (!publicStatsCache.evacuations[ckey]){
        publicStatsCache.evacuations[ckey] = await fetchNoCache(`${apiBase}/api/evacuations/statistics?year=${compareYear}`);
      }
      compare = publicStatsCache.evacuations[ckey];
    }
    return { current: publicStatsCache.evacuations[key]?.current || publicStatsCache.evacuations[key], compare: compare?.current || compare?.compare || null };
  }
  
  async function getAccidentsStats(year, compareYear){
    const key = String(year);
    if (!publicStatsCache.accidents[key]){
      publicStatsCache.accidents[key] = await fetchNoCache(`${apiBase}/api/accidents/statistics?year=${year}`);
    }
    let compare = null;
    if (compareYear){
      const ckey = String(compareYear);
      if (!publicStatsCache.accidents[ckey]){
        publicStatsCache.accidents[ckey] = await fetchNoCache(`${apiBase}/api/accidents/statistics?year=${compareYear}`);
      }
      compare = publicStatsCache.accidents[ckey];
    }
    return { current: publicStatsCache.accidents[key]?.current || publicStatsCache.accidents[key], compare: compare?.current || compare?.compare || null };
  }
  
  // Данные из вашего Excel файла
  const analyticsData = {
    // Штрафы 2024 vs 2025
    fines: {
      2024: {
        violations: 284555,
        resolutions: 263455,
        imposed: 238535916,
        collected: 111240416
      },
      2025: {
        violations: 297279,
        resolutions: 274748,
        imposed: 229417668,
        collected: 108572585
      }
    },
    // Данные по месяцам для нарушений
    violationsByMonth: {
      2024: [24500, 23800, 25200, 24100, 25600, 24800, 23900, 25100],
      2025: [25100, 24300, 25900, 24700, 26200, 25400, 24500, 25700]
    },
    // Данные по часам для ДТП
    accidentsByHour: {
      '00-02': 12, '02-04': 8, '04-06': 15, '06-08': 28, '08-10': 35,
      '10-12': 32, '12-14': 38, '14-16': 42, '16-18': 45, '18-20': 38,
      '20-22': 25, '22-24': 18
    },
    // Эвакуация 2024 vs 2025
    evacuation: {
      2024: {
        trips: 1084,
        evacuations: 901,
        receipts: 4505000
      },
      2025: {
        trips: 1102,
        evacuations: 919,
        receipts: 4533000
      }
    },
    // ДТП данные (из вашего XML файла)
    accidents: {
      total: 310,
      deaths: 65,
      injured: 245,
      byDay: [
        { day: 'Понедельник', accidents: 44, deaths: 8, injured: 35 },
        { day: 'Вторник', accidents: 48, deaths: 9, injured: 38 },
        { day: 'Среда', accidents: 52, deaths: 10, injured: 41 },
        { day: 'Четверг', accidents: 55, deaths: 11, injured: 43 },
        { day: 'Пятница', accidents: 58, deaths: 12, injured: 45 },
        { day: 'Суббота', accidents: 28, deaths: 8, injured: 20 },
        { day: 'Воскресенье', accidents: 25, deaths: 7, injured: 18 }
      ],
      // Данные для сравнения 2024 vs 2025
      comparison: {
        2024: { total: 280, deaths: 58, injured: 220 },
        2025: { total: 310, deaths: 65, injured: 245 }
      },
      // Данные ДТП по дням для 2024 года
      byDay2024: [
        { day: 'Понедельник', accidents: 52, deaths: 12, injured: 40 },
        { day: 'Вторник', accidents: 48, deaths: 10, injured: 38 },
        { day: 'Среда', accidents: 44, deaths: 9, injured: 35 },
        { day: 'Четверг', accidents: 47, deaths: 11, injured: 36 },
        { day: 'Пятница', accidents: 55, deaths: 13, injured: 42 },
        { day: 'Суббота', accidents: 38, deaths: 7, injured: 31 },
        { day: 'Воскресенье', accidents: 35, deaths: 6, injured: 29 }
      ]
    }
  };

  // Инициализация мониторинга
  // ======= Создание графика сравнения ДТП =======
  async function createAccidentsComparisonChart() {
    const canvas = document.getElementById('accidents-comparison-chart');
    if (!canvas || !window.Chart) return;

    const ctx = canvas.getContext('2d');
    
    // Берём годы из UI (если есть), иначе 2025 vs 2024
    const yearA = (document.getElementById('period-select')?.value === 'compare') ? '2025' : '2025';
    const y1 = Number(document.getElementById('compare-year-a')?.value || yearA || 2025);
    const y2 = Number(document.getElementById('compare-year-b')?.value || 2024);
    const stats = await getAccidentsStats(y1, y2);
    const totalA = Number(stats.current?.total?.accidentsCount || 0);
    const totalB = Number(stats.compare?.total?.accidentsCount || 0);

    if (accidentsComparisonChart) {
      accidentsComparisonChart.destroy();
    }
    
    accidentsComparisonChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: [String(y1), String(y2)],
        datasets: [{
          label: 'ДТП (всего)',
          data: [totalA, totalB],
          backgroundColor: ['rgba(98, 167, 68, 0.8)', 'rgba(255, 107, 107, 0.8)'],
          borderColor: ['rgba(98, 167, 68, 1)', 'rgba(255, 107, 107, 1)'],
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        devicePixelRatio: 4,
        animation: {
          duration: 0
        },
        plugins: {
          title: {
            display: false
          },
          legend: {
            labels: { 
              color: '#ffffff',
              font: { size: 14, weight: 'bold' }
            }
          }
        },
        interaction: {
          intersect: false,
          mode: 'index'
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: { 
              color: '#ffffff',
              font: { size: 12, weight: 'bold' }
            },
            grid: { 
              color: 'rgba(255,255,255,0.15)',
              lineWidth: 1
            }
          },
          x: {
            ticks: { 
              color: '#ffffff',
              font: { size: 12, weight: 'bold' }
            },
            grid: { 
              color: 'rgba(255,255,255,0.15)',
              lineWidth: 1
            }
          }
        }
      }
    });
  }

  // ======= Создание графика сравнения нарушений =======
  async function createViolationsComparisonChart() {
    const canvas = document.getElementById('violations-comparison-chart');
    if (!canvas || !window.Chart) return;

    const ctx = canvas.getContext('2d');
    
    const y1 = Number(document.getElementById('compare-year-a')?.value || 2024);
    const y2 = Number(document.getElementById('compare-year-b')?.value || 2025);
    const s1 = await getFinesStats(y1);
    const s2 = await getFinesStats(y2);
    const t1 = s1.current?.total || {};
    const t2 = s2.current?.total || {};
    const k = (v) => Number(v || 0);

    if (violationsComparisonChart) {
      violationsComparisonChart.destroy();
    }
    
    violationsComparisonChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Нарушения', 'Постановления', 'Наложено штрафов', 'Взыскано'],
        datasets: [{
          label: String(y1),
          data: [
            Math.round(k(t1.violationsCount) / 1000),
            Math.round(k(t1.resolutionsCount) / 1000),
            Math.round(k(t1.imposedAmount) / 1_000_000),
            Math.round(k(t1.collectedAmount) / 1_000_000)
          ],
          backgroundColor: 'rgba(98, 167, 68, 0.8)',
          borderColor: 'rgba(98, 167, 68, 1)',
          borderWidth: 2
        }, {
          label: String(y2),
          data: [
            Math.round(k(t2.violationsCount) / 1000),
            Math.round(k(t2.resolutionsCount) / 1000),
            Math.round(k(t2.imposedAmount) / 1_000_000),
            Math.round(k(t2.collectedAmount) / 1_000_000)
          ],
          backgroundColor: 'rgba(255, 107, 107, 0.8)',
          borderColor: 'rgba(255, 107, 107, 1)',
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        devicePixelRatio: 4,
        animation: {
          duration: 0
        },
        plugins: {
          title: {
            display: true,
            text: 'Сравнение нарушений ПДД 2024 vs 2025',
            color: '#ffffff',
            font: {
              size: 16,
              weight: 'bold'
            }
          },
          legend: {
            labels: { 
              color: '#ffffff',
              font: { size: 14, weight: 'bold' }
            }
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                let label = context.dataset.label || '';
                if (label) {
                  label += ': ';
                }
                
                const value = context.parsed.y;
                const index = context.dataIndex;
                
                // Форматируем значения в зависимости от типа данных
                if (index === 0 || index === 1) {
                  // Нарушения и постановления - в тыс.
                  label += value.toLocaleString() + ' тыс.';
                } else {
                  // Штрафы - в млн руб.
                  label += value.toLocaleString() + ' млн ₽';
                }
                
                return label;
              }
            }
          }
        },
        interaction: {
          intersect: false,
          mode: 'index'
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: { 
              color: '#ffffff',
              font: { size: 12, weight: 'bold' }
            },
            grid: { 
              color: 'rgba(255,255,255,0.15)',
              lineWidth: 1
            }
          },
          x: {
            ticks: { 
              color: '#ffffff',
              font: { size: 12, weight: 'bold' }
            },
            grid: { 
              color: 'rgba(255,255,255,0.15)',
              lineWidth: 1
            }
          }
        }
      }
    });
  }

  // ======= Создание графика сравнения эвакуации =======
  async function createEvacuationComparisonChart() {
    const canvas = document.getElementById('evacuation-comparison-chart');
    if (!canvas || !window.Chart) return;

    const ctx = canvas.getContext('2d');
    
    const y1 = Number(document.getElementById('compare-year-a')?.value || 2024);
    const y2 = Number(document.getElementById('compare-year-b')?.value || 2025);
    const s1 = await getEvacStats(y1);
    const s2 = await getEvacStats(y2);
    const t1 = s1.current?.total || {};
    const t2 = s2.current?.total || {};
    const k = (v) => Number(v || 0);

    if (evacuationComparisonChart) {
      evacuationComparisonChart.destroy();
    }
    
    evacuationComparisonChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Выезды эвакуаторов', 'Фактические эвакуации', 'Поступления в бюджет'],
        datasets: [{
          label: String(y1),
          data: [
            k(t1.tripsCount),
            k(t1.evacuationsCount),
            Math.round(k(t1.receiptsAmount) / 1_000_000)
          ],
          backgroundColor: 'rgba(78, 205, 196, 0.8)',
          borderColor: 'rgba(78, 205, 196, 1)',
          borderWidth: 2
        }, {
          label: String(y2),
          data: [
            k(t2.tripsCount),
            k(t2.evacuationsCount),
            Math.round(k(t2.receiptsAmount) / 1_000_000)
          ],
          backgroundColor: 'rgba(255, 193, 7, 0.8)',
          borderColor: 'rgba(255, 193, 7, 1)',
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        devicePixelRatio: 4,
        animation: {
          duration: 0
        },
        plugins: {
          title: {
            display: true,
            text: 'Сравнение показателей эвакуации 2024-2025',
            color: '#ffffff',
            font: {
              size: 18,
              weight: 'bold'
            }
          },
          legend: {
            labels: {
              color: '#ffffff',
              font: {
                size: 14,
                weight: 'bold'
              }
            }
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                let label = context.dataset.label || '';
                const value = context.parsed.y;
                
                if (context.dataIndex === 2) {
                  return `${label}: ${value.toLocaleString()} млн ₽`;
                } else {
                  return `${label}: ${value.toLocaleString()} шт.`;
                }
              }
            }
          }
        },
        interaction: {
          intersect: false,
          mode: 'index'
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: { 
              color: '#ffffff',
              font: { size: 12, weight: 'bold' }
            },
            grid: { 
              color: 'rgba(255,255,255,0.15)',
              lineWidth: 1
            }
          },
          x: {
            ticks: { 
              color: '#ffffff',
              font: { size: 12, weight: 'bold' }
            },
            grid: { 
              color: 'rgba(255,255,255,0.15)',
              lineWidth: 1
            }
          }
        }
      }
    });
  }

  // ======= Создание графика сравнения периодов =======
  async function createComparisonChart() {
    const canvas = document.getElementById('comparison-chart');
    if (!canvas || !window.Chart) return;

    const ctx = canvas.getContext('2d');
    
    const y1 = Number(document.getElementById('compare-year-a')?.value || 2024);
    const y2 = Number(document.getElementById('compare-year-b')?.value || 2025);
    const [fs1, fs2, es1, es2, as1, as2] = await Promise.all([
      getFinesStats(y1), getFinesStats(y2),
      getEvacStats(y1), getEvacStats(y2),
      getAccidentsStats(y1), getAccidentsStats(y2)
    ]);
    const f1 = fs1.current?.total || {}; const f2 = fs2.current?.total || {};
    const e1 = es1.current?.total || {}; const e2 = es2.current?.total || {};
    const a1 = as1.current?.total || {}; const a2 = as2.current?.total || {};
    const k = (v) => Number(v || 0);

    new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Нарушения', 'Постановления', 'Эвакуации', 'ДТП'],
        datasets: [{
          label: String(y1),
          data: [
            k(f1.violationsCount) / 1000,
            k(f1.resolutionsCount) / 1000,
            k(e1.evacuationsCount),
            k(a1.accidentsCount)
          ],
          backgroundColor: 'rgba(98, 167, 68, 0.8)',
          borderColor: 'rgba(98, 167, 68, 1)',
          borderWidth: 1
        }, {
          label: String(y2),
          data: [
            k(f2.violationsCount) / 1000,
            k(f2.resolutionsCount) / 1000,
            k(e2.evacuationsCount),
            k(a2.accidentsCount)
          ],
          backgroundColor: 'rgba(255, 107, 107, 0.8)',
          borderColor: 'rgba(255, 107, 107, 1)',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        devicePixelRatio: 4,
        animation: {
          duration: 0
        },
        elements: {
          bar: {
            borderWidth: 3,
            borderRadius: 4
          }
        },
        interaction: {
          intersect: false,
          mode: 'index'
        },
        plugins: {
          legend: {
            labels: { 
              color: '#ffffff',
              font: { size: 14, weight: 'bold' }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: { 
              color: '#ffffff',
              font: { size: 12, weight: 'bold' }
            },
            grid: { 
              color: 'rgba(255,255,255,0.15)',
              lineWidth: 1
            }
          },
          x: {
            ticks: { 
              color: '#ffffff',
              font: { size: 12, weight: 'bold' }
            },
            grid: { 
              color: 'rgba(255,255,255,0.15)',
              lineWidth: 1
            }
          }
        }
      }
    });
  }

  // ======= Обработчики фильтров =======
  function initFilters() {
    const periodSelect = document.getElementById('period-select');
    const categorySelect = document.getElementById('category-select');
    const statsFilters = document.querySelector('.stats-filters');
    
    if (periodSelect) {
      periodSelect.addEventListener('change', updateCharts);
    }
    
    if (categorySelect) {
      categorySelect.addEventListener('change', updateCharts);
    }

    // Управление стилями режима сравнения
    function updateComparisonStyles() {
      const period = periodSelect?.value || '2025';
      if (period === 'compare' && statsFilters) {
        statsFilters.classList.add('comparison-mode');
      } else if (statsFilters) {
        statsFilters.classList.remove('comparison-mode');
      }
    }

    // Обновляем стили при изменении фильтров
    if (periodSelect) {
      periodSelect.addEventListener('change', updateComparisonStyles);
    }
    
    // Устанавливаем начальные стили
    updateComparisonStyles();
  }

  // ======= Обновление графиков при изменении фильтров =======
  async function updateCharts() {
    const period = document.getElementById('period-select')?.value || '2025';
    const category = document.getElementById('category-select')?.value || 'accidents';
    
    // Обновляем KPI карточки
    await updateKPICards(period, category);
    
    const dailyChart = document.getElementById('daily-chart');
    const comparisonCharts = document.getElementById('comparison-charts');
    
    if (period === 'compare') {
      // Показываем графики сравнения
      if (dailyChart) dailyChart.style.display = 'none';
      if (comparisonCharts) comparisonCharts.style.display = 'block';
      
      // Создаем только нужный график в зависимости от категории
      if (category === 'accidents') {
        await createAccidentsComparisonChart();
        // Скрываем другие графики
        document.getElementById('violations-comparison-chart').parentElement.style.display = 'none';
        document.getElementById('evacuation-comparison-chart').parentElement.style.display = 'none';
        document.getElementById('accidents-comparison-chart').parentElement.style.display = 'block';
      } else if (category === 'violations') {
        await createViolationsComparisonChart();
        // Скрываем другие графики
        document.getElementById('accidents-comparison-chart').parentElement.style.display = 'none';
        document.getElementById('evacuation-comparison-chart').parentElement.style.display = 'none';
        document.getElementById('violations-comparison-chart').parentElement.style.display = 'block';
      } else if (category === 'evacuation') {
        await createEvacuationComparisonChart();
        // Скрываем другие графики
        document.getElementById('accidents-comparison-chart').parentElement.style.display = 'none';
        document.getElementById('violations-comparison-chart').parentElement.style.display = 'none';
        document.getElementById('evacuation-comparison-chart').parentElement.style.display = 'block';
      }
    } else {
      // Показываем обычный график по дням
      if (dailyChart) dailyChart.style.display = 'block';
      if (comparisonCharts) comparisonCharts.style.display = 'none';
      
      // Пересоздаем основной график с учетом выбранного года
      if (accidentsChart) {
        accidentsChart.destroy();
      }
      
      if (category === 'accidents') {
        await createAccidentsChart(period);
      } else if (category === 'violations') {
        await createViolationsChart(period);
      } else if (category === 'evacuation') {
        await createEvacuationChart(period);
      }
    }
  }

  // ======= Обновление KPI карточек =======
  async function updateKPICards(period, category) {
    const accidentsCount = document.getElementById('accidents-count');
    const injuredCount = document.getElementById('injured-count');
    const deathsCount = document.getElementById('deaths-count');
    const label1 = document.getElementById('kpi-label-1');
    const label2 = document.getElementById('kpi-label-2');
    const label3 = document.getElementById('kpi-label-3');
    const monitorTitle = document.querySelector('.monitor h3');
    const kpiContainer = document.querySelector('.monitor-kpis');
    
    // Обновляем заголовок в зависимости от режима
    if (monitorTitle) {
      if (period === 'compare') {
        monitorTitle.textContent = 'Сравнение показателей 2024-2025';
      } else {
        monitorTitle.textContent = 'Показатели за текущий год';
      }
    }
    
    // Управление классами для режима сравнения
    if (kpiContainer) {
      if (period === 'compare') {
        kpiContainer.classList.add('comparison-mode');
      } else {
        kpiContainer.classList.remove('comparison-mode');
      }
    }
    
    if (category === 'accidents') {
      // Правильные данные для ДТП
      if (label1) label1.textContent = 'Кол-во ДТП с пострадавшими';
      if (label2) label2.textContent = 'Ранено';
      if (label3) label3.textContent = 'Погибло';
      
      if (period === 'compare') {
        const y1 = Number(document.getElementById('compare-year-a')?.value || 2024);
        const y2 = Number(document.getElementById('compare-year-b')?.value || 2025);
        const s1 = await getAccidentsStats(y1);
        const s2 = await getAccidentsStats(y2);
        const t1 = s1.current?.total || {}; const t2 = s2.current?.total || {};
        if (accidentsCount) accidentsCount.innerHTML = 
          `<span style="color: #62a744">${Number(t1.accidentsCount||0)}</span> → 
           <span style="color: #ff6b6b">${Number(t2.accidentsCount||0)}</span>`;
        if (injuredCount) injuredCount.innerHTML = 
          `<span style="color: #62a744">${Number(t1.injuredCount||0)}</span> → 
           <span style="color: #ff6b6b">${Number(t2.injuredCount||0)}</span>`;
        if (deathsCount) deathsCount.innerHTML = 
          `<span style="color: #62a744">${Number(t1.deathsCount||0)}</span> → 
           <span style="color: #ff6b6b">${Number(t2.deathsCount||0)}</span>`;
      } else {
        // Обычный режим
        const year = period;
        const s = await getAccidentsStats(Number(year));
        const t = s.current?.total || {};
        if (accidentsCount) accidentsCount.textContent = Number(t.accidentsCount || 0);
        if (injuredCount) injuredCount.textContent = Number(t.injuredCount || 0);
        if (deathsCount) deathsCount.textContent = Number(t.deathsCount || 0);
      }
    } else if (category === 'violations') {
      // Правильные данные для нарушений
      if (label1) label1.textContent = 'Нарушения, тыс.';
      if (label2) label2.textContent = 'Постановления, тыс.';
      if (label3) label3.textContent = 'Наложено штрафов, млн ₽';
      
      if (period === 'compare') {
        const y1 = Number(document.getElementById('compare-year-a')?.value || 2024);
        const y2 = Number(document.getElementById('compare-year-b')?.value || 2025);
        const s1 = await getFinesStats(y1);
        const s2 = await getFinesStats(y2);
        const t1 = s1.current?.total || {}; const t2 = s2.current?.total || {};
        if (accidentsCount) accidentsCount.innerHTML = 
          `<span style="color: #62a744">${Math.round(Number(t1.violationsCount||0)/1000)}</span> → 
           <span style="color: #ff6b6b">${Math.round(Number(t2.violationsCount||0)/1000)}</span>`;
        if (injuredCount) injuredCount.innerHTML = 
          `<span style="color: #62a744">${Math.round(Number(t1.resolutionsCount||0)/1000)}</span> → 
           <span style="color: #ff6b6b">${Math.round(Number(t2.resolutionsCount||0)/1000)}</span>`;
        if (deathsCount) deathsCount.innerHTML = 
          `<span style="color: #62a744">${Math.round(Number(t1.imposedAmount||0)/1_000_000)}</span> → 
           <span style="color: #ff6b6b">${Math.round(Number(t2.imposedAmount||0)/1_000_000)}</span>`;
      } else {
        // Обычный режим
        const year = period;
        const s = await getFinesStats(Number(year));
        const t = s.current?.total || {};
        if (accidentsCount) accidentsCount.textContent = Math.round(Number(t.violationsCount||0) / 1000);
        if (injuredCount) injuredCount.textContent = Math.round(Number(t.resolutionsCount||0) / 1000);
        if (deathsCount) deathsCount.textContent = Math.round(Number(t.imposedAmount||0) / 1_000_000);
      }
    } else if (category === 'evacuation') {
      // Правильные данные для эвакуации
      if (label1) label1.textContent = 'Выезды эвакуаторов';
      if (label2) label2.textContent = 'Фактические эвакуации';
      if (label3) label3.textContent = 'Поступления в бюджет';
      
      if (period === 'compare') {
        const y1 = Number(document.getElementById('compare-year-a')?.value || 2024);
        const y2 = Number(document.getElementById('compare-year-b')?.value || 2025);
        const s1 = await getEvacStats(y1);
        const s2 = await getEvacStats(y2);
        const t1 = s1.current?.total || {}; const t2 = s2.current?.total || {};
        if (accidentsCount) accidentsCount.innerHTML = 
          `<span style="color: #4ecdc4">${Number(t1.tripsCount||0)}</span> → 
           <span style="color: #ffc107">${Number(t2.tripsCount||0)}</span>`;
        if (injuredCount) injuredCount.innerHTML = 
          `<span style="color: #4ecdc4">${Number(t1.evacuationsCount||0)}</span> → 
           <span style="color: #ffc107">${Number(t2.evacuationsCount||0)}</span>`;
        if (deathsCount) deathsCount.innerHTML = 
          `<span style="color: #4ecdc4">${Math.round(Number(t1.receiptsAmount||0)/1_000_000)} млн ₽</span> → 
           <span style="color: #ffc107">${Math.round(Number(t2.receiptsAmount||0)/1_000_000)} млн ₽</span>`;
      } else {
        // Обычный режим
        const year = period;
        const s = await getEvacStats(Number(year));
        const t = s.current?.total || {};
        if (accidentsCount) accidentsCount.textContent = Number(t.tripsCount||0);
        if (injuredCount) injuredCount.textContent = Number(t.evacuationsCount||0);
        if (deathsCount) deathsCount.textContent = Math.round(Number(t.receiptsAmount||0)/1_000_000) + ' млн ₽';
      }
    }
  }

  // График нарушений по месяцам (обычный режим)
  async function createViolationsChart(period = '2025') {
    const ctx = document.getElementById('accidents-chart');
    if (!ctx || !window.Chart) return;
    
    if (accidentsChart) {
      accidentsChart.destroy();
    }
    
    const stats = await getFinesStats(Number(period));
    const monthly = Array.isArray(stats.current?.monthly) ? stats.current.monthly : [];
    const labels = ['Янв','Фев','Мар','Апр','Май','Июн','Июл','Авг','Сен','Окт','Ноя','Дек'];
    const byMonth = new Array(12).fill(0);
    monthly.forEach(m => {
      const idx = (Number(m.month||0) - 1);
      if (idx>=0 && idx<12){ byMonth[idx] = Number(m.violationsCount || m.resolutionsCount || m.imposedAmount || 0); }
    });
    
    accidentsChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: `Нарушения ПДД (${period})`,
          data: byMonth,
          backgroundColor: 'rgba(98, 167, 68, 0.2)',
          borderColor: 'rgba(98, 167, 68, 1)',
          borderWidth: 3,
          tension: 0.4,
          fill: true
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        devicePixelRatio: 4,
        animation: {
          duration: 0
        },
        plugins: {
          title: {
            display: true,
            text: `Нарушения ПДД по месяцам (${period} год)`,
            color: '#ffffff',
            font: {
              size: 16,
              weight: 'bold'
            }
          },
          legend: {
            labels: {
              color: '#ffffff',
              font: {
                size: 12,
                weight: 'bold'
              }
            }
          }
        },
        interaction: {
          intersect: false,
          mode: 'index'
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              color: '#ffffff'
            },
            grid: {
              color: 'rgba(255, 255, 255, 0.1)'
            },
            title: {
              display: true,
              text: 'Количество нарушений',
              color: '#ffffff'
            }
          },
          x: {
            ticks: {
              color: '#ffffff'
            },
            grid: {
              color: 'rgba(255, 255, 255, 0.1)'
            },
            title: {
              display: true,
              text: 'Месяцы',
              color: '#ffffff'
            }
          }
        }
      }
    });
  }

  // ======= Создание графика эвакуации (обычный режим) =======
  async function createEvacuationChart(period = '2025') {
    const ctx = document.getElementById('accidents-chart');
    if (!ctx || !window.Chart) return;
    
    if (accidentsChart) {
      accidentsChart.destroy();
    }
    
    const stats = await getEvacStats(Number(period));
    const t = stats.current?.total || {};
    
    accidentsChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Выезды эвакуаторов', 'Фактические эвакуации', 'Поступления в бюджет'],
        datasets: [{
          label: `${period} год`,
          data: [
            Number(t.tripsCount||0),
            Number(t.evacuationsCount||0),
            Math.round(Number(t.receiptsAmount||0) / 1000000)
          ],
          backgroundColor: [
            'rgba(78, 205, 196, 0.8)',    // Голубой для выездов
            'rgba(255, 193, 7, 0.8)',     // Желтый для эвакуаций
            'rgba(40, 167, 69, 0.8)'      // Зеленый для поступлений
          ],
          borderColor: [
            'rgba(78, 205, 196, 1)',
            'rgba(255, 193, 7, 1)',
            'rgba(40, 167, 69, 1)'
          ],
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        devicePixelRatio: 4,
        animation: {
          duration: 0
        },
        plugins: {
          title: {
            display: true,
            text: `Эвакуация транспортных средств (${period} год)`,
            color: '#ffffff',
            font: {
              size: 18,
              weight: 'bold'
            }
          },
          legend: {
            display: false
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                let label = context.label || '';
                const value = context.parsed.y;
                
                if (context.dataIndex === 2) {
                  // Для поступлений показываем в млн руб.
                  return `${label}: ${value.toLocaleString()} млн ₽`;
                } else {
                  // Для выездов и эвакуаций - в штуках
                  return `${label}: ${value.toLocaleString()} шт.`;
                }
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              color: '#ffffff',
              callback: function(value) {
                return value.toLocaleString();
              }
            },
            grid: {
              color: 'rgba(255,255,255,0.1)'
            },
            title: {
              display: true,
              text: 'Количество',
              color: '#ffffff'
            }
          },
          x: {
            ticks: {
              color: '#ffffff',
              font: {
                size: 12
              }
            },
            grid: {
              color: 'rgba(255,255,255,0.1)'
            }
          }
        }
      }
    });
  }

  function initMonitoring() {
    // Создаем основной график ДТП с текущим годом
    createAccidentsChart('2025');
    
    // Инициализируем кнопку карты и фильтры
    initMapButton();
    initFilters();
    
    // Устанавливаем начальные значения KPI карточек
    updateKPICards('2025', 'accidents');
  }

  // Создание графика ДТП по дням недели с учетом года
  async function createAccidentsChart(period = '2025') {
    if (!window.Chart) {
      console.log('Chart.js не загружен');
        return;
      }
    
    const ctx = document.getElementById('accidents-chart');
    if (!ctx) {
      console.log('Canvas не найден');
      return;
    }
    
    if (accidentsChart) {
      accidentsChart.destroy();
    }
    
    // Подтягиваем месячную статистику ДТП
    const stats = await getAccidentsStats(Number(period));
    const monthly = Array.isArray(stats.current?.monthly) ? stats.current.monthly : [];
    const labels = ['Янв','Фев','Мар','Апр','Май','Июн','Июл','Авг','Сен','Окт','Ноя','Дек'];
    const acc = new Array(12).fill(0);
    const deaths = new Array(12).fill(0);
    const injured = new Array(12).fill(0);
    monthly.forEach(m => {
      const idx = (Number(m.month||0) - 1);
      if (idx>=0 && idx<12){
        acc[idx] = Number(m.accidentsCount||0);
        deaths[idx] = Number(m.deathsCount||0);
        injured[idx] = Number(m.injuredCount||0);
      }
    });
    
    accidentsChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'ДТП',
          data: acc,
          backgroundColor: 'rgba(98, 167, 68, 0.15)',
          borderColor: 'rgba(98, 167, 68, 1)',
          borderWidth: 3,
          tension: 0.35,
          fill: true,
          pointRadius: 4,
          pointHoverRadius: 6
        }, {
          label: 'Погибло',
          data: deaths,
          backgroundColor: 'rgba(255, 107, 107, 0.15)',
          borderColor: 'rgba(255, 107, 107, 1)',
          borderWidth: 3,
          tension: 0.35,
          fill: true,
          pointRadius: 4,
          pointHoverRadius: 6
        }, {
          label: 'Ранено',
          data: injured,
          backgroundColor: 'rgba(78, 205, 196, 0.15)',
          borderColor: 'rgba(78, 205, 196, 1)',
          borderWidth: 3,
          tension: 0.35,
          fill: true,
          pointRadius: 4,
          pointHoverRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        devicePixelRatio: 4,
        animation: {
          duration: 0
        },
        plugins: {
          title: {
            display: true,
            text: `ДТП по месяцам (${period} год)`,
            color: '#ffffff',
            font: {
              size: 16,
              weight: 'bold'
            }
          },
          legend: {
            display: true,
            labels: {
              color: '#ffffff',
              font: {
                size: 12,
                weight: 'bold'
              }
            }
          },
          tooltip: {
            mode: 'index',
            intersect: false
          }
        },
        interaction: {
          intersect: false,
          mode: 'index'
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              color: '#ffffff'
            },
            grid: {
              color: 'rgba(255, 255, 255, 0.1)'
            }
          },
          x: {
            ticks: {
              color: '#ffffff'
            },
            grid: {
              color: 'rgba(255, 255, 255, 0.1)'
            }
          }
        }
      }
    });
  }

  // ======= Кнопка карты аварийности =======
  function initMapButton() {
    const showMapBtn = document.getElementById('show-map-btn');
    const mapSection = document.getElementById('map-section');
    
    if (!showMapBtn || !mapSection) {
      console.log('Кнопка или секция карты не найдены');
      return;
    }
    
    // Изначально скрываем карту
    mapSection.style.display = 'none';
    
    showMapBtn.addEventListener('click', () => {
      if (mapSection.style.display === 'none' || mapSection.style.display === '') {
        // Показываем карту
        mapSection.style.display = 'block';
        showMapBtn.textContent = 'Скрыть карту аварийности';
        
        // Плавно прокручиваем к карте
        setTimeout(() => {
          mapSection.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start',
            inline: 'nearest'
          });
        }, 100);
        
        // Инициализируем карту если нужно
        initMapContent();
      } else {
        // Скрываем карту
        mapSection.style.display = 'none';
        showMapBtn.textContent = 'Показать карту аварийности';
      }
    });
  }

  // Функция для инициализации содержимого карты
  function initMapContent() {
    const mapContainer = document.querySelector('.map-container');
    if (!mapContainer) return;
    
    // Добавляем или обновляем содержимое карты
    if (!mapContainer.innerHTML.trim()) {
      mapContainer.innerHTML = `
        <div class="map-image">
          <img src="https://via.placeholder.com/800x400/1a1a1a/62a744?text=Карта+аварийности+Москвы" 
               alt="Карта аварийности" class="dtp-map">
          <div class="map-overlay">
            <div class="map-stats">
              <div class="stat-item">
                <span class="stat-label">Всего ДТП</span>
                <span class="stat-value">310</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">Высокий риск</span>
                <span class="stat-value red">42</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">Средний риск</span>
                <span class="stat-value yellow">128</span>
              </div>
            </div>
          </div>
        </div>
        <div class="map-legend">
          <div class="legend-item">
            <span class="legend-marker red"></span>
            <span>Высокий риск</span>
          </div>
          <div class="legend-item">
            <span class="legend-marker yellow"></span>
            <span>Средний риск</span>
          </div>
          <div class="legend-item">
            <span class="legend-marker" style="background: #62a744"></span>
            <span>Низкий риск</span>
          </div>
        </div>
      `;
    }
  }


  // ======= Плавный скролл =======
  // Плавная прокрутка с учётом высоты шапки
  function smoothScrollTo(targetSelector){
    const el = typeof targetSelector === 'string' ? document.querySelector(targetSelector) : targetSelector;
    if (!el) return;
    const header = document.querySelector('.site-header');
    const headerRect = header ? header.getBoundingClientRect() : { height: 0 };

    // Индивидуальные отступы по целям, чтобы попадать ровно под фиксированный хедер
    let offset = 0;
    if (targetSelector === '#gosuslugi') {
      offset = 320; // крупный визуальный блок
    } else if (targetSelector === '#monitoring') {
      offset = 0;   // без дополнительного смещения
    } else if (targetSelector === '#analytics-section' || targetSelector === '#services') {
      offset = 0;
    } else {
      offset = 0;
    }

    const top = Math.max(0, el.getBoundingClientRect().top + window.pageYOffset - (headerRect.height + offset));
    window.scrollTo({ top, behavior: 'smooth' });
  }

  // Обработчики для навигационных ссылок
  document.querySelectorAll('[data-scroll-to]').forEach(link => {
    link.addEventListener('click', (e) => {
    e.preventDefault();
      const target = link.getAttribute('data-scroll-to');
    smoothScrollTo(target);
    });
  });

  // Текущий год в футере
  const y = document.getElementById('y');
  if (y) y.textContent = new Date().getFullYear();

  // Инициализация мониторинга
  initMonitoring();

  // ======= Слайдер =======
  function initSlider() {
    const slider = document.querySelector('.slider');
    if (!slider) return;

    const track = slider.querySelector('.slider-track');
    const slides = slider.querySelectorAll('.slider-slide');
    const prevBtn = slider.querySelector('.slider-btn--prev');
    const nextBtn = slider.querySelector('.slider-btn--next');
    
    let currentSlide = 0;
    const totalSlides = slides.length;

    function updateSlider() {
      slides.forEach((slide, index) => {
        slide.classList.toggle('active', index === currentSlide);
      });
    }

    function nextSlide() {
      currentSlide = (currentSlide + 1) % totalSlides;
      updateSlider();
    }

    function prevSlide() {
      currentSlide = (currentSlide - 1 + totalSlides) % totalSlides;
      updateSlider();
    }

    if (nextBtn) nextBtn.addEventListener('click', nextSlide);
    if (prevBtn) prevBtn.addEventListener('click', prevSlide);

    // Автопрокрутка каждые 5 секунд
    setInterval(nextSlide, 5000);
  }

  // Инициализация слайдера
  initSlider();

  // ======= Модальные окна =======
  function initModals() {
    // Открытие модального окна
    const openModalButtons = document.querySelectorAll('[data-open-modal]');
    openModalButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        e.preventDefault();
        const modalId = button.getAttribute('data-open-modal');
        const modal = document.querySelector(modalId);
        if (modal) {
          modal.style.display = 'flex';
          document.body.style.overflow = 'hidden'; // Блокируем скролл
        }
      });
    });

    // Закрытие модального окна
    const closeModalButtons = document.querySelectorAll('[data-close-modal]');
    closeModalButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        e.preventDefault();
        const modal = button.closest('.modal');
        if (modal) {
          modal.style.display = 'none';
          document.body.style.overflow = ''; // Восстанавливаем скролл
        }
      });
    });

    // Закрытие по клику на backdrop
    const modalBackdrops = document.querySelectorAll('.modal-backdrop');
    modalBackdrops.forEach(backdrop => {
      backdrop.addEventListener('click', (e) => {
        if (e.target === backdrop) {
          const modal = backdrop.closest('.modal');
          if (modal) {
            modal.style.display = 'none';
            document.body.style.overflow = ''; // Восстанавливаем скролл
          }
        }
      });
    });

    // Закрытие по Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        const openModal = document.querySelector('.modal[style*="flex"]');
        if (openModal) {
          openModal.style.display = 'none';
          document.body.style.overflow = ''; // Восстанавливаем скролл
        }
      }
    });
  }

// Инициализация модальных окон
initModals();

  // ======= Публичные данные: Новости и Проекты (из БД через API) =======
  async function loadPublicNews() {
    try {
      const container = document.querySelector('#newsContainer');
      if (!container) return;
      const res = await fetchNoCache(`${apiBase}/api/news?limit=6&sort=-publishedAt`);
      const items = Array.isArray(res?.data) ? res.data : [];
      if (items.length === 0) return;
      const html = items.slice(0,4).map((n) => {
        const title = n.title || n.name || 'Без названия';
        const category = n.category || n.tag || n.status || '';
        const dateStr = n.publishedAt || n.createdAt || n.date;
        const date = dateStr ? new Date(dateStr) : null;
        const fmt = date ? date.toLocaleDateString('ru-RU') : '';
        const rawCover = n.image || n.cover || n.coverUrl || n.images || '';
        const cover = (window.apiUtils && window.apiUtils.resolveMediaUrl) ? window.apiUtils.resolveMediaUrl(rawCover) : ((Array.isArray(n.images) && n.images[0]) || n.image || n.cover || 'assets/images/news-1.jpg');
        return `
          <article class="news-item">
            <div>
              <div class="news-meta">${fmt} ${category ? `<span class=\"chip\">${category}</span>` : ''}</div>
              <div class="news-title">${title}</div>
            </div>
            <img src="${cover}" alt="${title}" loading="lazy">
          </article>`;
      }).join('');
      container.innerHTML = html;
      const moreBtn = document.querySelector('.news-all');
      if (moreBtn) { moreBtn.textContent = 'Показать еще'; moreBtn.setAttribute('href','news.html'); }
    } catch (e) {
      console.warn('Не удалось загрузить новости:', e);
    }
  }

  async function loadPublicProjects() {
    try {
      const container = document.querySelector('#projects .project-grid');
      if (!container) return;
      // Ensure header styled like news
      const section = document.querySelector('#projects');
      const headerTitle = section && section.querySelector('.section-title');
      if (section && headerTitle && !section.querySelector('.projects-header')) {
        const header = document.createElement('div');
        header.className = 'projects-header';
        header.innerHTML = `<h2 class="projects-title">Проекты</h2><a class="btn-ghost projects-all" href="projects.html">Показать еще</a>`;
        headerTitle.replaceWith(header);
      } else if (section && section.querySelector('.projects-all')) {
        section.querySelector('.projects-all').setAttribute('href','projects.html');
      }
      const res = await fetchNoCache(`${apiBase}/api/projects?limit=8&sort=-updatedAt`);
      const items = Array.isArray(res?.data) ? res.data : [];
      if (items.length === 0) return;
      const html = items.slice(0,4).map((p) => {
        const title = p.title || p.name || 'Проект';
        const category = p.category || p.status || '';
        const rawCover = p.image || p.projectCover || p.gallery || p.projectImages || '';
        const cover = (window.apiUtils && window.apiUtils.resolveMediaUrl) ? window.apiUtils.resolveMediaUrl(rawCover) : ((Array.isArray(p.gallery) && p.gallery[0]) || (Array.isArray(p.projectImages) && p.projectImages[0]) || p.image || p.projectCover || 'assets/images/news-1.jpg');
        return `
          <article class="news-item">
            <div>
              <div class="news-meta">${category ? `<span class=\"chip\">${category}</span>` : ''}</div>
              <div class="news-title">${title}</div>
            </div>
            <img src="${cover}" alt="${title}" loading="lazy">
          </article>`;
      }).join('');
      container.innerHTML = html;
      // кнопка уже в projects-header
    } catch (e) {
      console.warn('Не удалось загрузить проекты:', e);
    }
  }

  // Запускаем подгрузку публичных данных
  loadPublicNews();
  loadPublicProjects();

// ======= Обработчики форм услуг =======
function initServiceForms() {
  // Форма аренды автовышки
  const towerForm = document.getElementById('tower-rental-form');
  if (towerForm) {
    towerForm.addEventListener('submit', (e) => {
      e.preventDefault();
      handleTowerRentalSubmit(towerForm);
    });
  }

  // Форма вызова эвакуатора
  const towForm = document.getElementById('tow-truck-form');
  if (towForm) {
    towForm.addEventListener('submit', (e) => {
      e.preventDefault();
      handleTowTruckSubmit(towForm);
    });
  }
}

function handleTowerRentalSubmit(form) {
  const formData = new FormData(form);
  const data = Object.fromEntries(formData.entries());
  
  // Валидация
  if (!data.company || !data.contact || !data.phone || !data.height || !data.duration || !data.address || !data.purpose || !data.date) {
    alert('Пожалуйста, заполните все обязательные поля');
    return;
  }

  // Имитация отправки данных
  console.log('Заявка на аренду автовышки:', data);
  
  // Показываем уведомление
  showNotification('Заявка на аренду автовышки отправлена! Мы свяжемся с вами в ближайшее время.', 'success');
  
  // Закрываем модальное окно
  const modal = document.getElementById('tower-rental-modal');
  if (modal) {
    modal.style.display = 'none';
    document.body.style.overflow = '';
  }
  
  // Очищаем форму
  form.reset();
}

function handleTowTruckSubmit(form) {
  const formData = new FormData(form);
  const data = Object.fromEntries(formData.entries());
  
  // Валидация
  if (!data.name || !data.phone || !data.vehicle_type || !data.address || !data.reason || !data.urgency) {
    alert('Пожалуйста, заполните все обязательные поля');
    return;
  }

  // Имитация отправки данных
  console.log('Заявка на вызов эвакуатора:', data);
  
  // Показываем уведомление
  showNotification('Заявка на вызов эвакуатора отправлена! Эвакуатор будет направлен по указанному адресу.', 'success');
  
  // Закрываем модальное окно
  const modal = document.getElementById('tow-truck-modal');
  if (modal) {
    modal.style.display = 'none';
    document.body.style.overflow = '';
  }
  
  // Очищаем форму
  form.reset();
}

function showNotification(message, type = 'info') {
  // Создаем уведомление
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.innerHTML = `
    <div class="notification-content">
      <span class="notification-icon">${type === 'success' ? '✓' : 'ℹ'}</span>
      <span class="notification-message">${message}</span>
      <button class="notification-close" onclick="this.parentElement.parentElement.remove()">×</button>
    </div>
  `;
  
  // Добавляем стили для уведомления
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: ${type === 'success' ? '#d4edda' : '#d1ecf1'};
    color: ${type === 'success' ? '#155724' : '#0c5460'};
    border: 1px solid ${type === 'success' ? '#c3e6cb' : '#bee5eb'};
    border-radius: 8px;
    padding: 16px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    z-index: 10000;
    max-width: 400px;
    animation: slideInRight 0.3s ease;
  `;
  
  // Добавляем в DOM
  document.body.appendChild(notification);
  
  // Автоматически удаляем через 5 секунд
  setTimeout(() => {
    if (notification.parentElement) {
      notification.remove();
    }
  }, 5000);
}

// Инициализация форм услуг
initServiceForms();

// Загрузка данных транспорта
loadTransportData();
});

// Функция загрузки данных транспорта
async function loadTransportData() {
  try {
    const response = await fetch('/api/transport?limit=6');
    if (!response.ok) {
      throw new Error('Ошибка загрузки данных транспорта');
    }
    
    const data = await response.json();
    displayTransportData(data.data);
    displayTransportModalData(data.data);
  } catch (error) {
    console.error('Ошибка загрузки транспорта:', error);
    // Не показываем ошибку пользователю, так как это не критично
  }
}

// Функция отображения данных транспорта
function displayTransportData(transports) {
  const transportContainer = document.querySelector('.help-features');
  if (!transportContainer || !transports || transports.length === 0) return;
  
  // Находим блок "Оптимизация общественного транспорта"
  const transportFeature = transportContainer.querySelector('.feature:nth-child(4)');
  if (!transportFeature) return;
  
  
  // Создаем контейнер для маршрутов
  const routesContainer = document.createElement('div');
  routesContainer.className = 'routes-container';
  
  // Добавляем стили
  routesContainer.style.cssText = `
    margin-top: 16px;
    padding: 16px;
    background: #f8f9fa;
    border-radius: 8px;
    border-left: 4px solid #007bff;
  `;
  
  // Добавляем стили для элементов маршрутов
  const style = document.createElement('style');
  style.textContent = `
    .transport-routes h5 {
      margin: 0 0 12px 0;
      color: #333;
      font-size: 14px;
      font-weight: 600;
    }
    .routes-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .route-item {
      padding: 8px 12px;
      background: white;
      border-radius: 6px;
      border: 1px solid #e9ecef;
    }
    .route-period {
      font-size: 12px;
      color: #6c757d;
      font-weight: 500;
    }
    .route-path {
      font-size: 13px;
      color: #495057;
      margin-top: 4px;
      line-height: 1.4;
    }
    .transport-stats {
      margin-top: 12px;
      padding-top: 12px;
      border-top: 1px solid #dee2e6;
    }
    .stat {
      font-size: 12px;
      color: #6c757d;
      font-weight: 500;
    }
  `;
  document.head.appendChild(style);
  
  // Добавляем контейнер после описания
  const description = transportFeature.querySelector('p');
  if (description) {
    description.parentNode.insertBefore(routesContainer, description.nextSibling);
  }
}

// Функция сокращения маршрута
function truncateRoute(route, maxLength) {
  if (route.length <= maxLength) return route;
  return route.substring(0, maxLength) + '...';
}

// Функция отображения данных транспорта в модальном окне
function displayTransportModalData(transports) {
  const container = document.getElementById('transport-routes-container');
  if (!container || !transports || transports.length === 0) {
    if (container) {
      container.innerHTML = '<div class="no-data">Нет данных о маршрутах</div>';
    }
    return;
  }
  
  container.innerHTML = `
    <div class="transport-routes-list">
      ${transports.map(transport => `
        <div class="transport-route-card">
          <div class="route-header">
            <h4>Маршрут ${transport.monthName} ${transport.year}</h4>
            <span class="route-status ${transport.isActive ? 'active' : 'inactive'}">
              ${transport.isActive ? 'Активен' : 'Неактивен'}
            </span>
          </div>
          <div class="route-path">
            <strong>Путь:</strong> ${transport.route}
          </div>
          ${transport.routeStops && transport.routeStops.length > 0 ? `
            <div class="route-stops">
              <strong>Остановки:</strong>
              <ul>
                ${transport.routeStops.map(stop => `
                  <li>${stop.street}${stop.houses ? ` (д.${stop.houses})` : ''}</li>
                `).join('')}
              </ul>
            </div>
          ` : ''}
        </div>
      `).join('')}
    </div>
  `;
  
  // Добавляем стили для модального окна транспорта
  if (!document.getElementById('transport-modal-styles')) {
    const style = document.createElement('style');
    style.id = 'transport-modal-styles';
    style.textContent = `
      .transport-modal .modal-body {
        max-height: 70vh;
        overflow-y: auto;
      }
      .transport-routes-list {
        display: flex;
        flex-direction: column;
        gap: 16px;
        margin: 16px 0;
      }
      .transport-route-card {
        background: #f8f9fa;
        border: 1px solid #dee2e6;
        border-radius: 8px;
        padding: 16px;
        border-left: 4px solid #007bff;
      }
      .route-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12px;
      }
      .route-header h4 {
        margin: 0;
        color: #333;
        font-size: 16px;
      }
      .route-status {
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 12px;
        font-weight: 500;
      }
      .route-status.active {
        background: #d4edda;
        color: #155724;
      }
      .route-status.inactive {
        background: #f8d7da;
        color: #721c24;
      }
      .route-path {
        margin-bottom: 12px;
        font-size: 14px;
        line-height: 1.5;
        color: #495057;
      }
      .route-stops {
        margin-top: 12px;
      }
      .route-stops ul {
        margin: 8px 0 0 0;
        padding-left: 20px;
      }
      .route-stops li {
        margin-bottom: 4px;
        font-size: 13px;
        color: #6c757d;
      }
      .transport-actions {
        display: flex;
        gap: 12px;
        margin-top: 20px;
        padding-top: 20px;
        border-top: 1px solid #dee2e6;
      }
      .no-data {
        text-align: center;
        color: #6c757d;
        padding: 40px 20px;
        font-style: italic;
      }
    `;
    document.head.appendChild(style);
  }
}

// Функция обновления данных транспорта
async function refreshTransportData() {
  const container = document.getElementById('transport-routes-container');
  if (!container) {
    console.error('Контейнер для маршрутов не найден');
    return;
  }
  
  container.innerHTML = '<div class="loading-spinner">Загрузка маршрутов...</div>';
  
  try {
    const response = await fetch('/api/transport?limit=10');
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Проверяем структуру данных
    if (!data || !data.data) {
      throw new Error('Некорректная структура данных от сервера');
    }
    
    displayTransportModalData(data.data);
    if (typeof showNotification === 'function') {
      showNotification('Данные транспорта обновлены', 'success');
    }
  } catch (error) {
    console.error('Ошибка обновления транспорта:', error);
    container.innerHTML = `
      <div class="no-data">
        <p>Ошибка загрузки данных</p>
        <p style="font-size: 12px; color: #999; margin-top: 8px;">${error.message}</p>
        <button onclick="refreshTransportData()" style="margin-top: 12px; padding: 8px 16px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;">
          Попробовать снова
        </button>
      </div>
    `;
    if (typeof showNotification === 'function') {
      showNotification('Ошибка загрузки данных транспорта', 'error');
    }
  }
}

// ======= Загрузка вакансий =======
async function loadVacancies() {
  const container = document.getElementById('vacanciesContainer');
  if (!container) return;

  try {
    const response = await fetch('/api/vacancies');
    if (!response.ok) {
      throw new Error('Ошибка загрузки вакансий');
    }
    
    const vacancies = await response.json();
    displayVacancies(vacancies, container);
  } catch (error) {
    console.error('Ошибка загрузки вакансий:', error);
    displayVacanciesError(container);
  }
}

function displayVacancies(vacancies, container) {
  if (!vacancies || vacancies.length === 0) {
    container.innerHTML = `
      <div class="no-vacancies">
        <div class="no-vacancies-icon">💼</div>
        <h4>Нет открытых вакансий</h4>
        <p>В данный момент у нас нет открытых позиций. Следите за обновлениями!</p>
      </div>
    `;
    return;
  }

  const vacanciesHTML = vacancies.map(vacancy => `
    <div class="vacancy-card">
      <div class="vacancy-header">
        <div>
          <h3 class="vacancy-title">${vacancy.title}</h3>
          <div class="vacancy-department">${vacancy.department}</div>
        </div>
        ${vacancy.salary ? `<div class="vacancy-salary">${vacancy.salary}</div>` : ''}
      </div>
      
      <div class="vacancy-details">
        <div class="vacancy-detail">
          <span class="vacancy-detail-icon">📍</span>
          <span>${vacancy.location}</span>
        </div>
        <div class="vacancy-detail">
          <span class="vacancy-detail-icon">⏰</span>
          <span>${getEmploymentTypeText(vacancy.employment_type)}</span>
        </div>
        <div class="vacancy-detail">
          <span class="vacancy-detail-icon">📅</span>
          <span>${formatDate(vacancy.created_at)}</span>
        </div>
      </div>
      
      <div class="vacancy-description">
        ${vacancy.description}
      </div>
      
      ${vacancy.requirements ? `
        <div class="vacancy-requirements">
          <h5>Требования:</h5>
          <ul>
            ${vacancy.requirements.split('\n').filter(req => req.trim()).map(req => `<li>${req.trim()}</li>`).join('')}
          </ul>
        </div>
      ` : ''}
      
      <div class="vacancy-actions">
        <button class="btn-apply" onclick="applyForVacancy(${vacancy.id})">
          Откликнуться
        </button>
        <button class="btn-details" onclick="showVacancyDetails(${vacancy.id})">
          Подробнее
        </button>
      </div>
    </div>
  `).join('');

  container.innerHTML = vacanciesHTML;
}

function displayVacanciesError(container) {
  container.innerHTML = `
    <div class="no-vacancies">
      <div class="no-vacancies-icon">⚠️</div>
      <h4>Ошибка загрузки</h4>
      <p>Не удалось загрузить список вакансий. Попробуйте обновить страницу.</p>
    </div>
  `;
}

function getEmploymentTypeText(type) {
  const types = {
    'full-time': 'Полная занятость',
    'part-time': 'Частичная занятость',
    'contract': 'Договор',
    'internship': 'Стажировка'
  };
  return types[type] || type;
}

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('ru-RU', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

function applyForVacancy(vacancyId) {
  // Здесь можно добавить логику для отклика на вакансию
  alert('Функция отклика на вакансию будет добавлена в следующих версиях');
}

function showVacancyDetails(vacancyId) {
  // Здесь можно добавить логику для показа подробной информации о вакансии
  alert('Подробная информация о вакансии будет добавлена в следующих версиях');
}

// Инициализация загрузки вакансий при открытии модального окна
document.addEventListener('DOMContentLoaded', () => {
  const vacanciesModal = document.getElementById('vacancies-modal');
  if (vacanciesModal) {
    const openModalButtons = document.querySelectorAll('[data-open-modal="#vacancies-modal"]');
    openModalButtons.forEach(button => {
      button.addEventListener('click', () => {
        loadVacancies();
      });
    });
  }

  // Инициализация активного пункта мобильного меню
  initMobileMenuActiveState();
});

// Функция для определения активного пункта мобильного меню
function initMobileMenuActiveState() {
  const mobileLinks = document.querySelectorAll('[data-mobile-link]');
  if (!mobileLinks.length) return;

  // Получаем текущую страницу
  const currentPage = getCurrentPageName();
  
  // Убираем активный класс со всех ссылок
  mobileLinks.forEach(link => {
    link.classList.remove('active');
  });

  // Добавляем активный класс к текущей странице
  mobileLinks.forEach(link => {
    const href = link.getAttribute('href');
    const text = link.textContent.trim();
    
    // Специальная обработка для "Главная"
    if (text === 'Главная' && currentPage === 'index') {
      link.classList.add('active');
    }
    // Для остальных страниц проверяем точное совпадение
    else if (href && href === currentPage + '.html') {
      link.classList.add('active');
    }
    // Дополнительная проверка для случаев без .html
    else if (href && href === currentPage) {
      link.classList.add('active');
    }
  });
}

// Функция для определения имени текущей страницы
function getCurrentPageName() {
  const path = window.location.pathname;
  const filename = path.split('/').pop();
  
  // Если это главная страница или index.html
  if (filename === '' || filename === 'index.html' || filename === 'index') {
    return 'index';
  }
  
  // Убираем расширение .html
  return filename.replace('.html', '');
}