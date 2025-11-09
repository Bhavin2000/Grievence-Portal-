// Login page functionality
import { getToken, login, saveToken } from '../../shared/utils/auth.js';
import { validateForm, displayFormErrors, clearFormErrors } from '../../shared/utils/validation.js';
import { getFormData, showNotification } from '../../shared/utils/dom.js';

document.addEventListener('DOMContentLoaded', () => {
    initializeLoginPage();
});

function initializeLoginPage() {
    setupLoginForm();
    setupForgotPasswordLink();
    setupRegisterLink();
}

function setupLoginForm() {
    const loginForm = document.getElementById('loginForm') || document.querySelector('form');
    
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
}

async function handleLogin(e) {
    e.preventDefault();
    
    const formData = getFormData('form');
    const validationRules = {
        email: { required: true, email: true },
        password: { required: true, minLength: 6 }
    };
    
    clearFormErrors('form');
    
    const validation = validateForm(formData, validationRules);
    
    if (!validation.isValid) {
        displayFormErrors(validation.errors, 'form');
        return;
    }
    
    try {
        showLoading();
        
        const response = await login({
            email: formData.email,
            password: formData.password
        });
        
        if (response.token) {
            saveToken(response.token);
            showNotification('Login successful!', 'success');
            
            // Redirect based on user role
            setTimeout(() => {
                redirectBasedOnRole(response.user.role);
            }, 1000);
        }
        
    } catch (error) {
        console.error('Login error:', error);
        showNotification(error.message || 'Login failed. Please try again.', 'danger');
    } finally {
        hideLoading();
    }
}

function redirectBasedOnRole(role) {
    const roleRedirects = {
        admin: '/admin-portal.html',
        hod: '/hod-page.html',
        principal: '/principal-dashboard.html',
        teacher: '/teachers-portal.html',
        student: '/student-home.html'
    };
    
    const redirectUrl = roleRedirects[role] || '/index.html';
    window.location.href = redirectUrl;
}

function setupForgotPasswordLink() {
    const forgotPasswordLink = document.querySelector('a[href*="forgot"]') || 
                              document.querySelector('#forgot-password-link');
    
    if (forgotPasswordLink) {
        forgotPasswordLink.addEventListener('click', (e) => {
            e.preventDefault();
            window.location.href = '/forgot-password.html';
        });
    }
}

function setupRegisterLink() {
    const registerLink = document.querySelector('a[href*="register"]') || 
                        document.querySelector('#register-link');
    
    if (registerLink) {
        registerLink.addEventListener('click', (e) => {
            e.preventDefault();
            window.location.href = '/register.html';
        });
    }
}

function showLoading() {
    const submitBtn = document.querySelector('button[type="submit"]');
    if (submitBtn) {
        submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Logging in...';
        submitBtn.disabled = true;
    }
}

function hideLoading() {
    const submitBtn = document.querySelector('button[type="submit"]');
    if (submitBtn) {
        submitBtn.innerHTML = 'Login';
        submitBtn.disabled = false;
    }
}