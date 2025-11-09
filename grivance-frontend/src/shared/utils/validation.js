// Validation utility functions
export const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

export const validatePassword = (password) => {
    // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
    return passwordRegex.test(password);
};

export const validatePhone = (phone) => {
    const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
    return phoneRegex.test(phone);
};

export const validateRequired = (value) => {
    return value && value.trim().length > 0;
};

export const validateForm = (formData, rules) => {
    const errors = {};
    
    Object.keys(rules).forEach(field => {
        const value = formData[field];
        const fieldRules = rules[field];
        
        if (fieldRules.required && !validateRequired(value)) {
            errors[field] = `${field} is required`;
            return;
        }
        
        if (value && fieldRules.email && !validateEmail(value)) {
            errors[field] = 'Invalid email format';
        }
        
        if (value && fieldRules.password && !validatePassword(value)) {
            errors[field] = 'Password must be at least 8 characters with uppercase, lowercase, and number';
        }
        
        if (value && fieldRules.phone && !validatePhone(value)) {
            errors[field] = 'Invalid phone number format';
        }
        
        if (value && fieldRules.minLength && value.length < fieldRules.minLength) {
            errors[field] = `${field} must be at least ${fieldRules.minLength} characters`;
        }
        
        if (value && fieldRules.maxLength && value.length > fieldRules.maxLength) {
            errors[field] = `${field} must be less than ${fieldRules.maxLength} characters`;
        }
    });
    
    return {
        isValid: Object.keys(errors).length === 0,
        errors
    };
};

export const displayFormErrors = (errors, formSelector) => {
    // Clear previous errors
    const form = document.querySelector(formSelector);
    if (!form) return;
    
    const errorElements = form.querySelectorAll('.error-message');
    errorElements.forEach(el => el.remove());
    
    // Display new errors
    Object.keys(errors).forEach(field => {
        const input = form.querySelector(`[name="${field}"]`);
        if (input) {
            const errorDiv = document.createElement('div');
            errorDiv.className = 'error-message text-danger small';
            errorDiv.textContent = errors[field];
            input.parentNode.appendChild(errorDiv);
            input.classList.add('is-invalid');
        }
    });
};

export const clearFormErrors = (formSelector) => {
    const form = document.querySelector(formSelector);
    if (!form) return;
    
    const errorElements = form.querySelectorAll('.error-message');
    errorElements.forEach(el => el.remove());
    
    const invalidInputs = form.querySelectorAll('.is-invalid');
    invalidInputs.forEach(input => input.classList.remove('is-invalid'));
};