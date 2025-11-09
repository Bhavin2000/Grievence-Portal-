// Common functions and utilities
import { isAuthenticated, logout, getUserInfo } from './utils/auth.js';
import { showNotification } from './utils/dom.js';

// Global navigation functions
export const setupNavigation = () => {
    // Setup logout functionality
    const logoutBtns = document.querySelectorAll('[data-action="logout"]');
    logoutBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            if (confirm('Are you sure you want to logout?')) {
                logout();
            }
        });
    });

    // Display user info
    const userInfo = getUserInfo();
    if (userInfo) {
        const userNameElements = document.querySelectorAll('[data-user="name"]');
        userNameElements.forEach(el => {
            el.textContent = userInfo.name || userInfo.email;
        });

        const userRoleElements = document.querySelectorAll('[data-user="role"]');
        userRoleElements.forEach(el => {
            el.textContent = userInfo.role.charAt(0).toUpperCase() + userInfo.role.slice(1);
        });
    }
};

// Common loading functions
export const showLoading = (elementSelector) => {
    const element = document.querySelector(elementSelector);
    if (element) {
        element.innerHTML = '<div class="spinner-border" role="status"><span class="sr-only">Loading...</span></div>';
    }
};

export const hideLoading = (elementSelector) => {
    const element = document.querySelector(elementSelector);
    if (element) {
        element.innerHTML = '';
    }
};

// Common error handling
export const handleError = (error, userMessage = 'An error occurred') => {
    console.error('Error:', error);
    showNotification(userMessage, 'danger');
};

// Initialize common functionality
document.addEventListener('DOMContentLoaded', () => {
    setupNavigation();
    
    // Check authentication for protected pages
    if (!window.location.pathname.includes('login') && 
        !window.location.pathname.includes('register') && 
        !window.location.pathname.includes('index')) {
        if (!isAuthenticated()) {
            window.location.href = '/login.html';
        }
    }
});