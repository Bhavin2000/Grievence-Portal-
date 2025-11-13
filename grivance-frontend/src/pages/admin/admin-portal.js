
// Import utility modules
import { getComplaints, updateComplaint, deleteComplaint, getAdminStats } from '../../shared/utils/api.js';
import { redirectIfNotAuthenticated, getUserRole, logout } from '../../shared/utils/auth.js';
import { showNotification, formatDate, addEventListeners } from '../../shared/utils/dom.js';
import { setupNavigation, showLoading, hideLoading, handleError } from '../../shared/common.js';

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

    redirectIfNotAuthenticated();

    const userRole = getUserRole();
    if (userRole !== 'admin') {
        showNotification('Access denied. Admin privileges required.', 'danger');
        setTimeout(() => window.location.href = '/login.html', 2000);
        return;
    }

    initializeAdminPortal();
});

function initializeAdminPortal() {
    setupNavigation();
    setupTabNavigation();
    loadComplaints();
    setupEventListeners();
}

function setupTabNavigation() {
    // --- Tab Navigation Logic ---
    const sidebarLinks = document.querySelectorAll('.sidebar-link');
    const contentPanels = document.querySelectorAll('.content-panel');

    sidebarLinks.forEach(link => {
        link.addEventListener('click', function (event) {
            event.preventDefault();
            const targetId = this.getAttribute('data-target');
            // Hide all panels
            contentPanels.forEach(panel => {
                if (panel) panel.classList.add('hidden');
            });
            // Show target panel
            const targetPanel = document.getElementById(targetId);
            if (targetPanel) {
                targetPanel.classList.remove('hidden');
            }
            // Update active link
            sidebarLinks.forEach(l => l.classList.remove('active'));
            this.classList.add('active');
        });
    });
}

async function loadComplaints() {
    try {
        showLoading('#complaints-container');
        const complaints = await getComplaints();
        displayComplaints(complaints);
    } catch (error) {
        handleError(error, 'Failed to load complaints');
    } finally {
        hideLoading('#complaints-container');
    }
}

function displayComplaints(complaints) {
    const container = document.getElementById('complaints-container');
    if (!container) return;

    if (complaints.length === 0) {
        container.innerHTML = '<p>No complaints found.</p>';
        return;
    }

    const complaintsHtml = complaints.map(complaint => `
        <div class="complaint-card" data-id="${complaint._id}">
            <h5>${complaint.title}</h5>
            <p><strong>Status:</strong> ${complaint.status}</p>
            <p><strong>Priority:</strong> ${complaint.priority}</p>
            <p><strong>Submitted by:</strong> ${complaint.submittedBy.name}</p>
            <p><strong>Date:</strong> ${formatDate(complaint.createdAt)}</p>
            <div class="actions">
                <button class="btn btn-primary btn-sm edit-complaint" data-id="${complaint._id}">Edit</button>
                <button class="btn btn-danger btn-sm delete-complaint" data-id="${complaint._id}">Delete</button>
            </div>
        </div>
    `).join('');

    container.innerHTML = complaintsHtml;
}

function setupEventListeners() {
    // Edit complaint buttons
    addEventListeners('.edit-complaint', 'click', async (e) => {
        const complaintId = e.target.getAttribute('data-id');
        // Implementation for editing complaint
        showNotification('Edit functionality coming soon!', 'info');
    });

    // Delete complaint buttons
    addEventListeners('.delete-complaint', 'click', async (e) => {
        const complaintId = e.target.getAttribute('data-id');
        if (confirm('Are you sure you want to delete this complaint?')) {
            try {
                await deleteComplaint(complaintId);
                showNotification('Complaint deleted successfully!', 'success');
                loadComplaints(); // Reload the list
            } catch (error) {
                handleError(error, 'Failed to delete complaint');
            }
        }
    });
}

// Custom Toast Notification (keeping existing functionality)
function showToast(message, bgColor) {
    const toast = document.getElementById('toast-notification');
    const toastMessage = document.getElementById('toast-message');
    if (!toast || !toastMessage) return; // Guard clause

    toastMessage.textContent = message;
    toast.classList.remove('bg-green-500', 'bg-red-500', 'bg-blue-500', 'bg-slate-500');
    toast.classList.add(bgColor);

    toast.classList.remove('hidden', 'opacity-0', '-translate-y-10');
    toast.classList.add('opacity-100', 'translate-y-0');

    setTimeout(() => {
        toast.classList.remove('opacity-100', 'translate-y-0');
        toast.classList.add('opacity-0', '-translate-y-10');
        setTimeout(() => toast.classList.add('hidden'), 500);
    }, 3000);
}
