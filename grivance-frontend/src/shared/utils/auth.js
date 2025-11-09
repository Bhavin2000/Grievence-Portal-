// Authentication utility functions
import { apiRequest } from './api.js';

export const saveToken = (token) => {
    localStorage.setItem('token', token);
};

export const getToken = () => {
    return localStorage.getItem('token');
};

export const removeToken = () => {
    localStorage.removeItem('token');
};

export const isAuthenticated = () => {
    const token = getToken();
    if (!token) return false;
    
    try {
        // Decode JWT token to check expiration
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.exp > Date.now() / 1000;
    } catch (error) {
        return false;
    }
};

export const getUserRole = () => {
    const token = getToken();
    if (!token) return null;
    
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.role;
    } catch (error) {
        return null;
    }
};

export const getUserInfo = () => {
    const token = getToken();
    if (!token) return null;
    
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return {
            id: payload.id,
            email: payload.email,
            role: payload.role,
            name: payload.name
        };
    } catch (error) {
        return null;
    }
};

export const logout = () => {
    removeToken();
    window.location.href = '/login.html';
};

export const redirectIfNotAuthenticated = () => {
    if (!isAuthenticated()) {
        window.location.href = '/login.html';
    }
};

export const redirectBasedOnRole = () => {
    const role = getUserRole();
    
    switch (role) {
        case 'admin':
            window.location.href = '/admin-portal.html';
            break;
        case 'hod':
            window.location.href = '/hod-page.html';
            break;
        case 'principal':
            window.location.href = '/principal-dashboard.html';
            break;
        case 'teacher':
            window.location.href = '/teachers-portal.html';
            break;
        case 'student':
            window.location.href = '/student-home.html';
            break;
        default:
            window.location.href = '/login.html';
    }
};

// API functions for authentication
export const login = async (credentials) => {
    return apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials)
    });
};

export const register = async (userData) => {
    return apiRequest('/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData)
    });
};