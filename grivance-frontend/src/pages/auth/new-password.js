// New password page functionality
import { apiRequest } from '../../shared/utils/api.js';
import { validateForm, displayFormErrors, clearFormErrors } from '../../shared/utils/validation.js';
import { getFormData, showNotification } from '../../shared/utils/dom.js';

document.addEventListener('DOMContentLoaded', () => {
    initializeNewPasswordPage();
});

function initializeNewPasswordPage() {
    setupNewPasswordForm();
    setupPasswordConfirmation();
    validateResetToken();
}

function validateResetToken() {
    // Get token from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    
    if (!token) {
        showNotification('Invalid or missing reset token.', 'danger');
        setTimeout(() => {
            window.location.href = '/forgot-password.html';
        }, 3000);
    }
}

function setupNewPasswordForm() {
    const newPasswordForm = document.getElementById('newPasswordForm') || document.querySelector('form');
    
    if (newPasswordForm) {
        newPasswordForm.addEventListener('submit', handleNewPassword);
    }
}

function setupPasswordConfirmation() {
    const passwordField = document.querySelector('input[name="password"]');
    const confirmPasswordField = document.querySelector('input[name="confirmPassword"]') || 
                                 document.querySelector('input[name="confirm_password"]');
    
    if (confirmPasswordField) {
        confirmPasswordField.addEventListener('blur', validatePasswordMatch);
        passwordField.addEventListener('input', validatePasswordMatch);
    }
}

function validatePasswordMatch() {
    const password = document.querySelector('input[name="password"]').value;
    const confirmPassword = document.querySelector('input[name="confirmPassword"]')?.value || 
                           document.querySelector('input[name="confirm_password"]')?.value;
    
    const matchIndicator = document.getElementById('password-match-indicator');
    
    if (password && confirmPassword) {
        if (password === confirmPassword) {
            if (matchIndicator) {
                matchIndicator.innerHTML = '<small class="text-success">✓ Passwords match</small>';
            }
            return true;
        } else {
            if (matchIndicator) {
                matchIndicator.innerHTML = '<small class="text-danger">✗ Passwords do not match</small>';
            }
            return false;
        }
    }
    
    if (matchIndicator) {
        matchIndicator.innerHTML = '';
    }
    return true;
}

async function handleNewPassword(e) {
    e.preventDefault();
    
    const formData = getFormData('form');
    const validationRules = {
        password: { required: true, password: true },
        confirmPassword: { required: true }
    };
    
    clearFormErrors('form');
    
    // Check password confirmation
    if (!validatePasswordMatch()) {
        showNotification('Passwords do not match', 'danger');
        return;
    }
    
    const validation = validateForm(formData, validationRules);
    
    if (!validation.isValid) {
        displayFormErrors(validation.errors, 'form');
        return;
    }
    
    try {
        showLoading();
        
        // Get token from URL
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get('token');
        
        const response = await apiRequest('/auth/reset-password', {
            method: 'POST',
            body: JSON.stringify({
                token: token,
                password: formData.password
            })
        });
        
        showNotification('Password reset successful!', 'success');
        
        // Show success message and redirect
        showSuccessMessage();
        
    } catch (error) {
        console.error('Reset password error:', error);
        showNotification(
            error.message || 'Failed to reset password. Please try again.', 
            'danger'
        );
        
        // If token is invalid, redirect to forgot password
        if (error.message?.includes('token') || error.message?.includes('expired')) {
            setTimeout(() => {
                window.location.href = '/forgot-password.html';
            }, 3000);
        }
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
            <h5>Password Reset Successful!</h5>
            <p>Your password has been successfully reset.</p>
            <p>You can now login with your new password.</p>
        </div>
        <div class="mt-3">
            <a href="/login.html" class="btn btn-primary">Go to Login</a>
        </div>
    `;
    
    form.style.display = 'none';
    container.appendChild(successDiv);
    
    // Auto redirect after 5 seconds
    setTimeout(() => {
        window.location.href = '/login.html';
    }, 5000);
}

function showLoading() {
    const submitBtn = document.querySelector('button[type="submit"]');
    if (submitBtn) {
        submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Resetting...';
        submitBtn.disabled = true;
    }
}

function hideLoading() {
    const submitBtn = document.querySelector('button[type="submit"]');
    if (submitBtn) {
        submitBtn.innerHTML = 'Reset Password';
        submitBtn.disabled = false;
    }
}