// Register page functionality
import { register } from '../../shared/utils/auth.js';
import { validateForm, displayFormErrors, clearFormErrors } from '../../shared/utils/validation.js';
import { getFormData, showNotification } from '../../shared/utils/dom.js';

document.addEventListener('DOMContentLoaded', () => {
    initializeRegisterPage();
});

function initializeRegisterPage() {
    setupRegisterForm();
    setupLoginLink();
    // setupPasswordConfirmation();
}

function setupRegisterForm() {
    const registerForm = document.getElementById('register-form') || document.querySelector('form');
    
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }
}

function setupPasswordConfirmation() {
    const passwordField = document.querySelector('input[name="password"]');
    const confirmPasswordField = document.querySelector('input[name="confirmPassword"]') || 
                                 document.querySelector('input[name="confirm_password"]');
    
    if (confirmPasswordField) {
        confirmPasswordField.addEventListener('blur', validatePasswordMatch);
    }
}

function validatePasswordMatch() {
    const password = document.querySelector('input[name="password"]').value;
    const confirmPassword = document.querySelector('input[name="confirmPassword"]')?.value || 
                           document.querySelector('input[name="confirm_password"]')?.value;
    
    if (password && confirmPassword && password !== confirmPassword) {
        showNotification('Passwords do not match', 'warning');
        return false;
    }
    return true;
}

async function handleRegister(e) {
    e.preventDefault();
    
    const formData = getFormData('form');
    const validationRules = {
        name: { required: true, minLength: 2 },
        email: { required: true, email: true },
        password: { required: true, password: true },
        role: { required: true },
    };
    
    clearFormErrors('form');
    
    // Check password confirmation
    if (!validatePasswordMatch()) {
        return;
    }
    
    const validation = validateForm(formData, validationRules);
    
    if (!validation.isValid) {
        displayFormErrors(validation.errors, 'form');
        return;
    }
    
    try {
        showLoading();
        
        // Remove confirmPassword from data before sending
        const { confirmPassword, confirm_password, ...registrationData } = formData;
        
        const response = await register(registrationData);
        
        showNotification('Registration successful! Please login with your credentials.', 'success');
        
        // Redirect to login page after successful registration
        setTimeout(() => {
            window.location.href = '/login.html';
        }, 2000);
        
    } catch (error) {
        console.error('Registration error:', error);
        showNotification(error.message || 'Registration failed. Please try again.', 'danger');
    } finally {
        hideLoading();
    }
}

function setupLoginLink() {
    const loginLink = document.querySelector('a[href*="login"]') || 
                     document.querySelector('#login-link');
    
    if (loginLink) {
        loginLink.addEventListener('click', (e) => {
            e.preventDefault();
            window.location.href = '/login.html';
        });
    }
}

function showLoading() {
    const submitBtn = document.querySelector('button[type="submit"]');
    if (submitBtn) {
        submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Registering...';
        submitBtn.disabled = true;
    }
}

function hideLoading() {
    const submitBtn = document.querySelector('button[type="submit"]');
    if (submitBtn) {
        submitBtn.innerHTML = 'Register';
        submitBtn.disabled = false;
    }
}