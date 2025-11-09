// DOM utility functions
export const createElement = (tag, attributes = {}, textContent = '') => {
    const element = document.createElement(tag);

    Object.keys(attributes).forEach(key => {
        if (key === 'className') {
            element.className = attributes[key];
        } else {
            element.setAttribute(key, attributes[key]);
        }
    });

    if (textContent) {
        element.textContent = textContent;
    }

    return element;
};

export const addEventListeners = (selector, event, handler) => {
    const elements = document.querySelectorAll(selector);
    elements.forEach(element => {
        element.addEventListener(event, handler);
    });
};

export const showElement = (selector) => {
    const element = document.querySelector(selector);
    if (element) {
        element.style.display = 'block';
    }
};

export const hideElement = (selector) => {
    const element = document.querySelector(selector);
    if (element) {
        element.style.display = 'none';
    }
};

export const toggleElement = (selector) => {
    const element = document.querySelector(selector);
    if (element) {
        element.style.display = element.style.display === 'none' ? 'block' : 'none';
    }
};

export const clearForm = (formSelector) => {
    const form = document.querySelector(formSelector);
    if (form) {
        form.reset();
    }
};

export const getFormData = (formSelector) => {
    const form = document.querySelector(formSelector);
    if (!form) return {};

    const formData = new FormData(form);

    if (!formData.has('role')) {
        formData.append('role', 'student');
    }
    
    const data = {};

    for (let [key, value] of formData.entries()) {
        data[key] = value;
    }

    return data;
};

export const setFormData = (formSelector, data) => {
    const form = document.querySelector(formSelector);
    if (!form) return;

    Object.keys(data).forEach(key => {
        const input = form.querySelector(`[name="${key}"]`);
        if (input) {
            input.value = data[key];
        }
    });
};

export const showNotification = (message, type = 'info') => {
    const notification = createElement('div', {
        className: `alert alert-${type} notification`,
        role: 'alert'
    }, message);

    document.body.appendChild(notification);

    // Auto remove after 3 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 3000);
};

export const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};