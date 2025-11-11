
import "../../shared/common.js"; // Import common functionality
import { handleGrievanceFormSubmit, inboxCardBtnHandler, loadExistingComplaints, showInbox } from "../../shared/common-dom/common-dom";



document.addEventListener('DOMContentLoaded', function () {
    // --- Tab Navigation Logic ---
    const sidebarLinks = document.querySelectorAll('.sidebar-link');
    const contentPanels = document.querySelectorAll('.content-panel');
    const grievanceForm = document.getElementById('teacher-grievance-form');

    sidebarLinks.forEach(link => {
        link.addEventListener('click', function (event) {
            event.preventDefault();

            // Get the target content ID from data-target attribute
            const targetId = this.getAttribute('data-target');

            // Hide all content panels
            contentPanels.forEach(panel => {
                panel.classList.add('hidden');
            });

            // Show the target panel
            const targetPanel = document.getElementById(targetId);
            if (targetPanel) {
                targetPanel.classList.remove('hidden');
            }

            // Update active link styling
            sidebarLinks.forEach(l => l.classList.remove('active'));
            this.classList.add('active');
        });
    });

        // --- Teacher Grievance Form Submission ---
    loadExistingComplaints();

    grievanceForm?.addEventListener('submit', handleGrievanceFormSubmit);

    showInbox();
    inboxCardBtnHandler();

    // --- Grievance Handling Logic ---
    function handleGrievance(button, action) {
        const card = button.closest('.grievance-card');
        const actionButtons = card.querySelector('.action-buttons');
        let message = '';
        let toastBg = '';

        // This is a simulation. In a real app, you'd call an API.
        if (action === 'approved') {
            message = 'Grievance approved and forwarded to HOD.';
            toastBg = 'bg-green-500';
            actionButtons.innerHTML = `<span class="px-4 py-2 bg-green-200 text-green-800 rounded-full text-sm font-bold">Forwarded to HOD</span>`;
        } else if (action === 'denied') {
            message = 'Grievance has been rejected.';
            toastBg = 'bg-red-500';
            actionButtons.innerHTML = `<span class="px-4 py-2 bg-red-200 text-red-800 rounded-full text-sm font-bold">Rejected</span>`;
        }

        // Show toast notification
        showToast(message, toastBg);

        // Make the card look processed
        card.classList.add('opacity-70', 'bg-gray-50');
    }

    // --- Custom Toast Notification ---
    function showToast(message, bgColor) {
        const toast = document.getElementById('toast-notification');
        const toastMessage = document.getElementById('toast-message');

        // Set message and color
        toastMessage.textContent = message;
        // Clear previous color classes
        toast.classList.remove('bg-green-500', 'bg-red-500', 'bg-blue-500');
        toast.classList.add(bgColor); // Add new color

        // Show toast
        toast.classList.remove('hidden', 'opacity-0', '-translate-y-10');
        toast.classList.add('opacity-100', 'translate-y-0');

        // Hide toast after 3 seconds
        setTimeout(() => {
            toast.classList.remove('opacity-100', 'translate-y-0');
            toast.classList.add('opacity-0', '-translate-y-10');
            setTimeout(() => toast.classList.add('hidden'), 500); // Wait for fade out
        }, 3000);
    }

    // --- **** NEW ACKNOWLEDGE FEEDBACK LOGIC **** ---
    function acknowledgeFeedback(button) {
        const card = button.closest('.grievance-card');

        // Simulate acknowledging
        showToast('Feedback acknowledged and moved to archive.', 'bg-blue-500'); // Use blue for info

        // Hide the card
        card.style.transition = 'opacity 0.5s, transform 0.5s';
        card.style.opacity = '0';
        card.style.transform = 'scale(0.95)';
        setTimeout(() => {
            card.remove(); // Or just card.classList.add('hidden');
        }, 500);
    }
    // --- **** END OF NEW LOGIC **** ---

    
})