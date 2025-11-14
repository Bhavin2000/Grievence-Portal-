
import "../../shared/common.js"; // Import common functionality
import { emptyState, handleGrievanceFormSubmit, loadExistingComplaints, showTeacherInbox } from "../../shared/common-dom/common-dom";
import { getComplaintsForwardedByMe } from "../../shared/utils/api.js";
import { feedbackCardDom } from "./helper.js";



document.addEventListener('DOMContentLoaded', async function () {
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

    showTeacherInbox();
    const forwardedByMe = await getComplaintsForwardedByMe();
    console.log('forwardedByMe:', forwardedByMe);
    const forwardedContainer = document.getElementById('forwarded-by-me-list');
    forwardedContainer.innerHTML = '';
    if (forwardedByMe.length) {
        forwardedByMe.forEach(complaint => {
            if (complaint.status !== 'pending') {
                forwardedContainer.innerHTML += feedbackCardDom(complaint);
            }
        })
    } else {
        forwardedContainer.innerHTML = emptyState('No grievances forwarded by you');
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