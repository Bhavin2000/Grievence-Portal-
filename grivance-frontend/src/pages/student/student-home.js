import "../../shared/common.js"; // Import common functionality
import { handleGrievanceFormSubmit, loadExistingComplaints, showToast } from "../../shared/common-dom/common-dom.js";

document.addEventListener('DOMContentLoaded', function () {

    loadExistingComplaints();

    // --- Tab Navigation Logic ---
    const sidebarLinks = document.querySelectorAll('.sidebar-link');
    const contentPanels = document.querySelectorAll('.content-panel');
    const grivanceForm = document.getElementById('student-grievance-form');

    sidebarLinks.forEach(link => {
        link.addEventListener('click', function (event) {
            event.preventDefault();
            const targetId = this.getAttribute('data-target');

            contentPanels.forEach(panel => panel.classList.add('hidden'));

            const targetPanel = document.getElementById(targetId);
            if (targetPanel) {
                targetPanel.classList.remove('hidden');
            }

            sidebarLinks.forEach(l => l.classList.remove('active'));
            this.classList.add('active');
        });
    });

    // --- Student Grievance Form Submission ---
    grivanceForm?.addEventListener('submit', handleGrievanceFormSubmit);

    // Make functions global for onclick handlers
    window.updateGrievanceStatus = updateGrievanceStatus;

    // --- SIMULATE Status Update (placeholder for future API integration) ---
    function updateGrievanceStatus(button) {
        const card = button.closest('[data-tracking-id]');
        const currentStage = card.getAttribute('data-stage');

        // For now, just show a message
        showToast('Status check feature will be integrated with backend API.', 'bg-blue-500');

        button.disabled = true;
        button.textContent = 'Checking...';

        setTimeout(() => {
            button.disabled = false;
            button.textContent = 'Check Status';
        }, 2000);
    }

});

