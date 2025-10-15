// Contacts Page JavaScript
class ContactsPage {
    constructor() {
        this.apiBase = window.API_BASE || '';
        this.init();
    }

    async init() {
        await this.loadContacts();
        await this.loadDepartments();
    }

    async loadContacts() {
        try {
            const response = await fetch(`${this.apiBase}/api/contacts`);
            if (!response.ok) throw new Error('Ошибка загрузки контактов');
            
            const contacts = await response.json();
            this.updateContactInfo(contacts);
        } catch (error) {
            console.error('Ошибка загрузки контактов:', error);
            // Используем значения по умолчанию
            this.setDefaultContacts();
        }
    }

    async loadDepartments() {
        try {
            const response = await fetch(`${this.apiBase}/api/contacts/departments`);
            if (!response.ok) throw new Error('Ошибка загрузки отделов');
            
            const departments = await response.json();
            this.renderDepartments(departments);
        } catch (error) {
            console.error('Ошибка загрузки отделов:', error);
            // Используем отделы по умолчанию
            this.setDefaultDepartments();
        }
    }

    updateContactInfo(contacts) {
        // Основные контакты
        const mainContact = contacts.find(c => c.type === 'main');
        if (mainContact) {
            this.updateElement('mainPhone', mainContact.phone);
            this.updateElement('mainEmail', mainContact.email);
            this.updateElement('mainAddress', mainContact.address);
            this.updateElement('workingHours', mainContact.working_hours);
        }

        // Документооборот
        const docsContact = contacts.find(c => c.type === 'documents');
        if (docsContact) {
            this.updateElement('docsPhone', docsContact.phone);
            this.updateElement('docsEmail', docsContact.email);
            this.updateElement('docsHours', docsContact.working_hours);
        }

        // Экстренные службы
        const emergencyContact = contacts.find(c => c.type === 'emergency');
        if (emergencyContact) {
            this.updateElement('emergencyPhone', emergencyContact.phone);
            this.updateElement('emergencyEmail', emergencyContact.email);
        }
    }

    updateElement(id, value) {
        const element = document.getElementById(id);
        if (element && value) {
            element.textContent = value;
        }
    }

    renderDepartments(departments) {
        const container = document.getElementById('departmentsContainer');
        if (!container) return;

        if (departments.length === 0) {
            this.setDefaultDepartments();
            return;
        }

        container.innerHTML = departments.map(dept => `
            <div class="department-card">
                <h3>${dept.name}</h3>
                <p>${dept.description}</p>
                <div class="contact-info">
                    <p><strong>Телефон:</strong> ${dept.phone}</p>
                    <p><strong>Email:</strong> ${dept.email}</p>
                    <p><strong>Часы работы:</strong> ${dept.working_hours}</p>
                </div>
            </div>
        `).join('');
    }

    setDefaultContacts() {
        // Устанавливаем контакты по умолчанию, если API недоступен
        const defaultContacts = {
            mainPhone: '+7 (4812) 12-34-56',
            mainEmail: 'info@codd-smolensk.ru',
            mainAddress: 'г. Смоленск, ул. Ленина, 1',
            workingHours: 'пн-пт: 9:00-18:00',
            docsPhone: '+7 (4812) 12-34-56',
            docsEmail: 'docs@codd-smolensk.ru',
            docsHours: 'пн-пт 9:00-18:00',
            emergencyPhone: '+7 (4812) 12-34-57',
            emergencyEmail: 'emergency@codd-smolensk.ru'
        };

        Object.entries(defaultContacts).forEach(([id, value]) => {
            this.updateElement(id, value);
        });
    }

    setDefaultDepartments() {
        const container = document.getElementById('departmentsContainer');
        if (!container) return;

        const defaultDepartments = [
            {
                name: 'Отдел документооборота',
                description: 'Обработка и регистрация документов',
                phone: '+7 (4812) 12-34-58',
                email: 'documents@codd-smolensk.ru',
                working_hours: 'пн-пт: 9:00-17:00'
            },
            {
                name: 'Техническая поддержка',
                description: 'Поддержка информационных систем',
                phone: '+7 (4812) 12-34-59',
                email: 'support@codd-smolensk.ru',
                working_hours: 'пн-пт: 8:00-20:00'
            },
            {
                name: 'Отдел кадров',
                description: 'Вопросы трудоустройства и кадров',
                phone: '+7 (4812) 12-34-60',
                email: 'hr@codd-smolensk.ru',
                working_hours: 'пн-пт: 9:00-18:00'
            }
        ];

        container.innerHTML = defaultDepartments.map(dept => `
            <div class="department-card">
                <h3>${dept.name}</h3>
                <p>${dept.description}</p>
                <div class="contact-info">
                    <p><strong>Телефон:</strong> ${dept.phone}</p>
                    <p><strong>Email:</strong> ${dept.email}</p>
                    <p><strong>Часы работы:</strong> ${dept.working_hours}</p>
                </div>
            </div>
        `).join('');
    }
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    new ContactsPage();
});
