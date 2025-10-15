// Обработка форм услуг с расчетом стоимости

document.addEventListener('DOMContentLoaded', function() {
    // Инициализация обработчиков форм
    initFormHandlers();
});

function initFormHandlers() {
    console.log('=== ИНИЦИАЛИЗАЦИЯ ФОРМ ===');
    
    // Обработчик для формы аренды автовышки
    const towerForm = document.getElementById('tower-rental-form');
    console.log('Форма автовышки найдена:', !!towerForm);
    if (towerForm) {
        setupTowerRentalForm();
        console.log('Форма автовышки инициализирована');
    }

    // Обработчик для формы вызова эвакуатора
    const towForm = document.getElementById('tow-truck-form');
    if (towForm) {
        setupTowTruckForm();
    }

    // Обработчик для формы документации
    const docForm = document.getElementById('documentation-form');
    if (docForm) {
        setupDocumentationForm();
    }
}

// Настройка формы аренды автовышки
function setupTowerRentalForm() {
    console.log('=== НАСТРОЙКА ФОРМЫ АВТОВЫШКИ ===');
    const form = document.getElementById('tower-rental-form');
    const priceCalculation = document.getElementById('tower-price-calculation');
    
    console.log('Форма найдена:', !!form);
    console.log('Блок расчета найден:', !!priceCalculation);
    
    if (!form || !priceCalculation) {
        console.error('Форма или блок расчета не найдены!');
        return;
    }

    // Удаляем существующие обработчики, чтобы избежать конфликтов
    form.replaceWith(form.cloneNode(true));
    const newForm = document.getElementById('tower-rental-form');

    // Поля для отслеживания изменений
    const heightSelect = newForm.querySelector('#tower-height');
    const durationSelect = newForm.querySelector('#tower-duration');
    const daysInput = newForm.querySelector('#tower-days');

    function calculateTowerPrice() {
        if (!heightSelect || !durationSelect) {
            console.warn('Элементы формы не найдены');
            return;
        }
        
        const height = heightSelect.value;
        const duration = durationSelect.value;
        const days = parseInt(duration) || 1;

        // Базовая стоимость
        let basePrice = 3000;
        
        // Доплата за высоту
        let heightExtra = 0;
        if (height === '15-20') heightExtra = 500;
        else if (height === '20-25') heightExtra = 1000;
        else if (height === '25-30') heightExtra = 1500;
        else if (height === '30+') heightExtra = 2000;

        // Доплата за срочность (если аренда на 1 день - срочная)
        let urgencyExtra = 0;
        if (days === 1) urgencyExtra = 500;

        const totalPrice = (basePrice + heightExtra + urgencyExtra) * days;

        // Обновляем отображение
        document.getElementById('tower-base-price').textContent = `${basePrice.toLocaleString()} ₽`;
        document.getElementById('tower-days-count').textContent = days;
        document.getElementById('tower-height-extra').textContent = `${heightExtra.toLocaleString()} ₽`;
        document.getElementById('tower-total-price').innerHTML = `<strong>${totalPrice.toLocaleString()} ₽</strong>`;

        // Всегда показываем блок расчета
        priceCalculation.style.display = 'block';
    }

    // Добавляем обработчики событий
    [heightSelect, durationSelect].forEach(element => {
        if (element) {
            element.addEventListener('change', calculateTowerPrice);
            element.addEventListener('input', calculateTowerPrice);
        }
    });

    // Инициализируем расчет при загрузке формы
    calculateTowerPrice();

    // Обработчик отправки формы - УЛУЧШЕННАЯ ВЕРСИЯ
    newForm.addEventListener('submit', function(e) {
        console.log('=== ФОРМА ОТПРАВЛЕНА (НОВЫЙ ОБРАБОТЧИК) ===');
        
        // Предотвращаем стандартную отправку
        e.preventDefault();
        e.stopImmediatePropagation(); // Важно: останавливаем всплытие
        
        // Собираем данные ПРАВИЛЬНО
        const formData = new FormData(this);
        const data = Object.fromEntries(formData.entries());
        
        // Добавляем расчетную стоимость
        const totalPrice = document.getElementById('tower-total-price').textContent;
        data.calculated_price = totalPrice;

        console.log('=== ДАННЫЕ ДЛЯ ОТПРАВКИ ===');
        console.log('Company:', data.company);
        console.log('Contact:', data.contact);
        console.log('Phone:', data.phone);
        console.log('Email:', data.email);
        console.log('Все данные:', data);

        // Отправляем данные
        handleTowerRentalSubmission(data, this);
    });

    return newForm;
}

// Настройка формы вызова эвакуатора
function setupTowTruckForm() {
    console.log('=== НАСТРОЙКА ФОРМЫ ЭВАКУАТОРА ===');
    const form = document.getElementById('tow-truck-form');
    const priceCalculation = document.getElementById('tow-price-calculation');
    
    console.log('Форма найдена:', !!form);
    console.log('Блок расчета найден:', !!priceCalculation);
    
    if (!form || !priceCalculation) {
        console.error('Форма или блок расчета не найдены!');
        return;
    }

    // Удаляем существующие обработчики, чтобы избежать конфликтов
    form.replaceWith(form.cloneNode(true));
    const newForm = document.getElementById('tow-truck-form');

    // Поля для отслеживания изменений
    const vehicleTypeSelect = newForm.querySelector('#tow-vehicle-type');
    const urgencySelect = newForm.querySelector('#tow-urgency');

    function calculateTowPrice() {
        if (!vehicleTypeSelect || !urgencySelect) {
            console.warn('Элементы формы эвакуатора не найдены');
            return;
        }
        
        const vehicleType = vehicleTypeSelect.value;
        const urgency = urgencySelect.value;

        // Базовая стоимость
        let basePrice = 2500;
        
        // Доплата за тип ТС
        let vehicleExtra = 0;
        if (vehicleType === 'truck') vehicleExtra = 1000;
        else if (vehicleType === 'bus') vehicleExtra = 800;
        else if (vehicleType === 'motorcycle') vehicleExtra = -500;

        // Доплата за срочность
        let urgencyExtra = 0;
        if (urgency === 'urgent') urgencyExtra = 1500;
        else if (urgency === 'normal') urgencyExtra = 0;
        else if (urgency === 'planned') urgencyExtra = -200;

        const totalPrice = basePrice + vehicleExtra + urgencyExtra;

        // Обновляем отображение
        document.getElementById('tow-base-price').textContent = `${basePrice.toLocaleString()} ₽`;
        document.getElementById('tow-vehicle-extra').textContent = `${vehicleExtra.toLocaleString()} ₽`;
        document.getElementById('tow-urgency-extra').textContent = `${urgencyExtra.toLocaleString()} ₽`;
        document.getElementById('tow-total-price').innerHTML = `<strong>${totalPrice.toLocaleString()} ₽</strong>`;

        // Всегда показываем блок расчета
        priceCalculation.style.display = 'block';
    }

    // Добавляем обработчики событий
    [vehicleTypeSelect, urgencySelect].forEach(element => {
        if (element) {
            element.addEventListener('change', calculateTowPrice);
        }
    });

    // Инициализируем расчет при загрузке формы
    calculateTowPrice();

    // Обработчик отправки формы - УЛУЧШЕННАЯ ВЕРСИЯ
    newForm.addEventListener('submit', function(e) {
        console.log('=== ФОРМА ЭВАКУАТОРА ОТПРАВЛЕНА ===');
        
        // Предотвращаем стандартную отправку
        e.preventDefault();
        e.stopImmediatePropagation(); // Важно: останавливаем всплытие
        
        // Собираем данные ПРАВИЛЬНО
        const formData = new FormData(this);
        const data = Object.fromEntries(formData.entries());
        
        // Добавляем расчетную стоимость
        const totalPrice = document.getElementById('tow-total-price').textContent;
        data.calculated_price = totalPrice;

        console.log('=== ДАННЫЕ ЭВАКУАТОРА ДЛЯ ОТПРАВКИ ===');
        console.log('Company:', data.company);
        console.log('Contact:', data.contact);
        console.log('Name:', data.name);
        console.log('Phone:', data.phone);
        console.log('Все данные:', data);
        
        // Проверяем конкретные поля
        const companyField = this.querySelector('input[name="company"]');
        const contactField = this.querySelector('input[name="contact"]');
        const nameField = this.querySelector('input[name="name"]');
        const phoneField = this.querySelector('input[name="phone"]');
        
        console.log('=== ПРОВЕРКА ПОЛЕЙ ЭВАКУАТОРА ===');
        console.log('Company field:', companyField);
        console.log('Contact field:', contactField);
        console.log('Name field:', nameField);
        console.log('Phone field:', phoneField);
        
        if (companyField) console.log('Company value:', companyField.value);
        if (contactField) console.log('Contact value:', contactField.value);
        if (nameField) console.log('Name value:', nameField.value);
        if (phoneField) console.log('Phone value:', phoneField.value);

        // Отправляем данные
        handleTowTruckSubmission(data, this);
    });

    return newForm;
}

// Настройка формы документации
function setupDocumentationForm() {
    const form = document.getElementById('documentation-form');
    
    if (!form) return;

    // Обработчик отправки формы
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        handleDocumentationSubmission(form);
    });
}

// Обновленная функция обработки отправки
async function handleTowerRentalSubmission(data, formElement) {
    console.log('=== ОБРАБОТКА ОТПРАВКИ ФОРМЫ ===');
    console.log('Полученные данные:', data);
    
    try {
        const response = await fetch('/api/orders/tower-rental', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });

        console.log('Ответ сервера:', response.status, response.statusText);
        
        if (response.ok) {
            const result = await response.json();
            console.log('Успешный результат:', result);
            
            alert('Заявка на аренду автовышки успешно отправлена! Мы свяжемся с вами в ближайшее время.');
            formElement.reset();
            closeModal('tower-rental-modal');
        } else {
            const errorText = await response.text();
            console.error('Ошибка сервера:', errorText);
            throw new Error('Ошибка отправки заявки: ' + response.status);
        }
    } catch (error) {
        console.error('Ошибка отправки заявки:', error);
        alert('Произошла ошибка при отправке заявки. Попробуйте позже или свяжитесь с нами по телефону.');
    }
}

// Обновленная функция обработки отправки эвакуатора
async function handleTowTruckSubmission(data, formElement) {
    console.log('=== ОБРАБОТКА ОТПРАВКИ ЭВАКУАТОРА ===');
    console.log('Полученные данные:', data);
    
    try {
        const response = await fetch('/api/orders/tow-truck', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });

        console.log('Ответ сервера:', response.status, response.statusText);
        
        if (response.ok) {
            const result = await response.json();
            console.log('Успешный результат:', result);
            
            alert('Заявка на вызов эвакуатора успешно отправлена! Мы свяжемся с вами в ближайшее время.');
            formElement.reset();
            closeModal('tow-truck-modal');
        } else {
            const errorText = await response.text();
            console.error('Ошибка сервера:', errorText);
            throw new Error('Ошибка отправки заявки: ' + response.status);
        }
    } catch (error) {
        console.error('Ошибка отправки заявки:', error);
        alert('Произошла ошибка при отправке заявки. Попробуйте позже или свяжитесь с нами по телефону.');
    }
}

// Обработка отправки формы документации
async function handleDocumentationSubmission(form) {
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());

    try {
        const response = await fetch('/api/orders/documentation', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });

        if (response.ok) {
            alert('Заявка на разработку проектно-сметной документации успешно отправлена! Мы свяжемся с вами в ближайшее время.');
            form.reset();
            closeModal('documentation-modal');
        } else {
            throw new Error('Ошибка отправки заявки');
        }
    } catch (error) {
        console.error('Ошибка отправки заявки:', error);
        alert('Произошла ошибка при отправке заявки. Попробуйте позже или свяжитесь с нами по телефону.');
    }
}

// Функция закрытия модального окна
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
    }
}
