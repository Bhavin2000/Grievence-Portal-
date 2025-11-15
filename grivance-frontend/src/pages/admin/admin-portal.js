
import { getAdminStats } from '../../shared/utils/api.js';
import { initializeAdminPortal } from './helper.js';
import "../../shared/common.js";
import { getFormData, showNotification } from '../../shared/utils/dom.js';
import { hideLoading, showLoading } from '../../shared/common.js';
import { register } from '../../shared/utils/auth.js';


// Check if user is authenticated and has admin role
document.addEventListener('DOMContentLoaded', async () => {
    const totalPending = document.getElementById('total-pending');
    const totalApproved = document.getElementById('total-approved');
    const totalRejected = document.getElementById('total-rejected');
    const totalSubmit = document.getElementById('total-submited');

    const stats = await getAdminStats();
    totalPending.innerText = stats.pending;
    totalApproved.innerText = stats.approved;
    totalRejected.innerText = stats.rejected;
    totalSubmit.innerText = stats.total;

    initializeAdminPortal();
    document.getElementById('register-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = getFormData('#register-form');

        try {
            showLoading();
            const { confirmPassword, confirm_password, ...registrationData } = formData;

            const response = await register(registrationData);
            
            showNotification(response.message, 'success');
            console.log('response message:', response.message);
            
            // Reset form on success
            document.getElementById('register-form').reset();

        } catch (error) {
            console.error('Registration error:', error);
            showNotification(error.message || 'Registration failed. Please try again.', 'danger');
        } finally {
            hideLoading();
        }

    });
});

