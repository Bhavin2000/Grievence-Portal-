// Forgot password page functionality
import { apiRequest } from '../../shared/utils/api.js';
import { validateForm, displayFormErrors, clearFormErrors } from '../../shared/utils/validation.js';
import { getFormData, showNotification } from '../../shared/utils/dom.js';

document.addEventListener('DOMContentLoaded', () => {
    initializeForgotPasswordPage();
});

function initializeForgotPasswordPage() {
    setupForgotPasswordForm();
    setupBackToLoginLink();
}

function setupForgotPasswordForm() {
    const forgotPasswordForm = document.getElementById('forgotPasswordForm') || document.querySelector('form');
    
    if (forgotPasswordForm) {
        forgotPasswordForm.addEventListener('submit', handleForgotPassword);
    }
}

async function handleForgotPassword(e) {
    e.preventDefault();
    
    const formData = getFormData('form');
    const validationRules = {
        email: { required: true, email: true }
    };
    
    clearFormErrors('form');
    
    const validation = validateForm(formData, validationRules);
    
    if (!validation.isValid) {
        displayFormErrors(validation.errors, 'form');
        return;
    }
    
    try {
        showLoading();
        
        const response = await apiRequest('/auth/forgot-password', {
            method: 'POST',
            body: JSON.stringify({ email: formData.email })
        });
        
        showNotification(
            'Password reset instructions have been sent to your email address.', 
            'success'
        );
        
        // Hide form and show success message
        showSuccessMessage();
        
    } catch (error) {
        console.error('Forgot password error:', error);
        showNotification(
            error.message || 'Failed to send reset instructions. Please try again.', 
            'danger'
        );
    } finally {
        hideLoading();
    }
}

function showSuccessMessage() {
    const form = document.querySelector('form');
    const container = form.parentElement;
    
    const successDiv = document.createElement('div');
    successDiv.className = 'text-center';
    successDiv.innerHTML = `
        <div class="alert alert-success">
            <h5>Check Your Email</h5>
            <p>We've sent password reset instructions to your email address.</p>
            <p>Please check your inbox and follow the instructions to reset your password.</p>
        </div>
        <div class="mt-3">
            <a href="/login.html" class="btn btn-primary">Back to Login</a>
        </div>
    `;
    
    form.style.display = 'none';
    container.appendChild(successDiv);
}

function setupBackToLoginLink() {
    const backToLoginLink = document.querySelector('a[href*="login"]') || 
                           document.querySelector('#back-to-login');
    
    if (backToLoginLink) {
        backToLoginLink.addEventListener('click', (e) => {
            e.preventDefault();
            window.location.href = '/login.html';
        });
    }
}

function showLoading() {
    const submitBtn = document.querySelector('button[type="submit"]');
    if (submitBtn) {
        submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Sending...';
        submitBtn.disabled = true;
    }
}

function hideLoading() {
    const submitBtn = document.querySelector('button[type="submit"]');
    if (submitBtn) {
        submitBtn.innerHTML = 'Send Reset Instructions';
        submitBtn.disabled = false;
    }
}