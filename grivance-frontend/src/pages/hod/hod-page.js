
        // --- Tab Navigation Logic ---
        const sidebarLinks = document.querySelectorAll('.sidebar-link');
        const contentPanels = document.querySelectorAll('.content-panel');

        sidebarLinks.forEach(link => {
            link.addEventListener('click', function(event) {
                event.preventDefault();
                const targetId = this.getAttribute('data-target');
                
                contentPanels.forEach(panel => panel.classList.add('hidden'));
                document.getElementById(targetId).classList.remove('hidden');
                
                sidebarLinks.forEach(l => l.classList.remove('active'));
                this.classList.add('active');
            });
        });

        // --- Modal Logic ---
        const modal = document.getElementById('feedback-modal');
        const modalOverlay = document.querySelector('.modal-overlay');
        const modalContainer = document.querySelector('.modal-container');
        const modalTitle = document.getElementById('modal-title');
        const modalDescription = document.getElementById('modal-description');
        const modalSubmitButton = document.getElementById('modal-submit-button');
        const feedbackForm = document.getElementById('feedback-form');
        const feedbackText = document.getElementById('feedback-text');

        let currentCard = null;
        let currentAction = '';

        function openModal(action, button) {
            currentCard = button.closest('.grievance-card');
            currentAction = action;

            if (action === 'approve') {
                modalTitle.textContent = 'Approve and Forward to Principal';
                modalDescription.textContent = 'Please provide your approval notes. This will be forwarded to the Principal.';
                modalSubmitButton.className = 'py-2 px-5 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600 transition-all shadow-md';
                modalSubmitButton.textContent = 'Approve & Submit';
            } else if (action === 'reject') {
                modalTitle.textContent = 'Reject and Send back to Teacher';
                modalDescription.textContent = 'Please provide a clear reason for rejecting. This feedback will be sent to the teacher.';
                modalSubmitButton.className = 'py-2 px-5 bg-red-500 text-white rounded-lg font-semibold hover:bg-red-600 transition-all shadow-md';
                modalSubmitButton.textContent = 'Reject & Submit';
            }
            
            modal.classList.remove('hidden');
            setTimeout(() => {
                modalOverlay.classList.remove('opacity-0');
                modalContainer.classList.remove('scale-95', 'opacity-0');
            }, 10);
        }

        function closeModal() {
            modalOverlay.classList.add('opacity-0');
            modalContainer.classList.add('scale-95', 'opacity-0');
            setTimeout(() => {
                modal.classList.add('hidden');
                feedbackForm.reset();
            }, 300);
        }

        // Handle modal form submission
        feedbackForm.addEventListener('submit', function(event) {
            event.preventDefault();
            const feedback = feedbackText.value;
            const grievanceTitle = currentCard.dataset.title;
            const actionButtons = currentCard.querySelector('.action-buttons');

            let message = '';
            let toastBg = '';
            let newStatusHTML = '';
            let logPanelId = '';
            let logHTML = '';

            if (currentAction === 'approve') {
                message = 'Grievance approved and forwarded to Principal.';
                toastBg = 'bg-green-500';
                newStatusHTML = `<span class="px-4 py-2 bg-green-200 text-green-800 rounded-full text-sm font-bold">Forwarded to Principal</span>`;
                logPanelId = 'forwarded-content';
                logHTML = `
                    <div class="bg-white p-5 rounded-xl shadow-lg">
                        <div class="flex flex-wrap items-center justify-between gap-4 mb-3">
                            <h3 class="text-lg font-bold text-gray-900">${grievanceTitle}</h3>
                            <span class="px-4 py-2 bg-green-200 text-green-800 rounded-full text-sm font-bold">Approved</span>
                        </div>
                        <div class="bg-green-50 border-l-4 border-green-500 text-green-800 p-4 rounded-md">
                            <h4 class="font-bold mb-1">Your Feedback:</h4>
                            <p class="text-sm">${feedback}</p>
                        </div>
                    </div>`;

            } else if (currentAction === 'reject') {
                message = 'Grievance rejected and sent back to teacher.';
                toastBg = 'bg-red-500';
                newStatusHTML = `<span class="px-4 py-2 bg-red-200 text-red-800 rounded-full text-sm font-bold">Rejected (Sent to Teacher)</span>`;
                logPanelId = 'sent-back-content';
                logHTML = `
                    <div class="bg-white p-5 rounded-xl shadow-lg">
                        <div class="flex flex-wrap items-center justify-between gap-4 mb-3">
                            <h3 class="text-lg font-bold text-gray-900">${grievanceTitle}</h3>
                            <span class="px-4 py-2 bg-red-200 text-red-800 rounded-full text-sm font-bold">Rejected</span>
                        </div>
                        <div class="bg-red-50 border-l-4 border-red-500 text-red-800 p-4 rounded-md">
                            <h4 class="font-bold mb-1">Your Feedback:</h4>
                            <p class="text-sm">${feedback}</p>
                        </div>
                    </div>`;
            }

            // Update UI
            actionButtons.innerHTML = newStatusHTML;
            currentCard.classList.add('opacity-70', 'bg-gray-50');
            
            // Add to log panels
            document.querySelector(`#${logPanelId} .space-y-4`).insertAdjacentHTML('afterbegin', logHTML);

            showToast(message, toastBg);
            closeModal();
        });

        // --- Custom Toast Notification ---
        function showToast(message, bgColor) {
            const toast = document.getElementById('toast-notification');
            const toastMessage = document.getElementById('toast-message');
            
            toastMessage.textContent = message;
            toast.className = toast.className.replace(/bg-(green|red|blue)-500/g, bgColor); // Update color
            
            toast.classList.remove('hidden', 'opacity-0', '-translate-y-10');
            toast.classList.add('opacity-100', 'translate-y-0');

            setTimeout(() => {
                toast.classList.remove('opacity-100', 'translate-y-0');
                toast.classList.add('opacity-0', '-translate-y-10');
                setTimeout(() => toast.classList.add('hidden'), 500);
            }, 3000);
        }
