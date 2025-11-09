
// import "../../shared/common.js"; // Import common functionality


document.addEventListener('DOMContentLoaded', function () {
    // --- Tab Navigation Logic ---
    const sidebarLinks = document.querySelectorAll('.sidebar-link');
    const contentPanels = document.querySelectorAll('.content-panel');

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

    // --- Teacher Grievance Form Submission ---
    document.getElementById('teacher-grievance-form').addEventListener('submit', function (event) {
        event.preventDefault();

        // Get form values
        const category = document.getElementById('grievance-category').value;
        const subject = document.getElementById('grievance-subject').value;
        const description = document.getElementById('grievance-description').value;

        // Simulate submission
        console.log('Teacher grievance submitted:');
        console.log('Category:', category);
        console.log('Subject:', subject);

        // --- NEW: Add to tracking list ---
        addGrievanceToTracker(category, subject, description);

        // Show success toast
        showToast('Your grievance has been submitted.', 'bg-blue-500'); // Use blue for info

        // Reset form
        this.reset();
    });

    // --- **** MODIFIED FUNCTION: Add to Tracking List **** ---
    // This function now creates the 4-step progress bar as requested
    function addGrievanceToTracker(category, subject, description) {
        const trackingList = document.getElementById('grievance-tracking-list');
        const emptyMessage = document.getElementById('empty-tracking-message');

        // Hide the empty message
        if (emptyMessage) {
            emptyMessage.classList.add('hidden');
        }

        // Generate a fake tracking ID and date
        const trackingId = `T${Math.floor(10000 + Math.random() * 90000)}`;
        const submissionDate = new Date().toISOString().split('T')[0]; // Format as YYYY-MM-DD

        // Create the new card HTML
        const cardHTML = `
                <div class="bg-gray-50 p-5 rounded-lg border border-gray-200 shadow-sm fade-in" data-tracking-id="${trackingId}" data-status="Submitted">
                    <div class="flex flex-wrap justify-between items-center gap-2 mb-2">
                        <h3 class="text-lg font-semibold text-gray-800">${category}: ${subject}</h3>
                        <span class="text-sm font-medium text-blue-600">Status: Submitted</span>
                    </div>
                    <p class="text-gray-600 text-sm mb-4">${description}</p>
                    
                    <div class="w-full mb-3">
                        <div class="flex justify-between text-xs text-gray-600 mb-1">
                            <span class="font-semibold text-blue-600">Submitted</span>
                            <span class="text-gray-400">HOD Review</span>
                            <span class="text-gray-400">Principal Review</span>
                            <span class="text-gray-400">Resolved</span>
                        </div>
                        <div class="w-full bg-gray-200 rounded-full h-2.5">
                            <div class="bg-blue-600 h-2.5 rounded-full" style="width: 25%"></div>
                        </div>
                    </div>

                    <div class="flex flex-wrap justify-between items-center text-sm text-gray-500 gap-x-4 pt-2 border-t border-gray-200">
                        <span>Tracking ID: #${trackingId}</span>
                        <span>Submitted on: ${submissionDate}</span>
                    </div>
                </div>
            `;

        // Add the new card to the top of the list
        trackingList.insertAdjacentHTML('afterbegin', cardHTML);
    }
})