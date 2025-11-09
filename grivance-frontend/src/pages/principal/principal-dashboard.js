

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

        // --- Custom Toast Notification ---
        function showToast(message, bgColor) {
            const toast = document.getElementById('toast-notification');
            const toastMessage = document.getElementById('toast-message');
            toastMessage.textContent = message;
            toast.classList.remove('bg-green-500', 'bg-red-500', 'bg-blue-500', 'bg-indigo-500');
            toast.classList.add(bgColor);
            toast.classList.remove('hidden', 'opacity-0', '-translate-y-10');
            toast.classList.add('opacity-100', 'translate-y-0');
            setTimeout(() => {
                toast.classList.remove('opacity-100', 'translate-y-0');
                toast.classList.add('opacity-0', '-translate-y-10');
                setTimeout(() => toast.classList.add('hidden'), 500);
            }, 3000);
        }

        // --- New Modal Logic ---
        const modal = document.getElementById('feedback-modal');
        const modalBackdrop = modal;
        const modalContent = modal.querySelector('.modal-content');
        const modalTitle = document.getElementById('modal-title');
        const feedbackForm = document.getElementById('feedback-form');
        const feedbackInput = document.getElementById('principal-feedback');
        const cancelBtn = document.getElementById('cancel-feedback-btn');
        const submitBtn = document.getElementById('submit-feedback-btn');

        let currentCard = null;
        let currentAction = null;

        function openModal(card, action) {
            currentCard = card;
            currentAction = action;

            // Set modal title and text based on action
            if (action === 'Approved') {
                modalTitle.textContent = 'Add Approval Comment';
                feedbackInput.value = 'Approved. The necessary action will be taken.';
                submitBtn.className = 'bg-green-600 text-white py-2 px-5 rounded-lg font-semibold hover:bg-green-700 transition-all';
            } else {
                modalTitle.textContent = 'Add Rejection Comment';
                feedbackInput.value = 'This has been reviewed at all levels and rejected. Thank you for your patience.';
                submitBtn.className = 'bg-red-600 text-white py-2 px-5 rounded-lg font-semibold hover:bg-red-700 transition-all';
            }
            
            // Show modal with animation
            modal.classList.remove('hidden');
            setTimeout(() => {
                modalBackdrop.classList.remove('opacity-0');
                modalContent.classList.remove('scale-95', 'opacity-0');
                modalContent.classList.add('scale-100', 'opacity-100');
                feedbackInput.focus();
            }, 10);
        }

        function closeModal() {
            // Hide modal with animation
            modalBackdrop.classList.add('opacity-0');
            modalContent.classList.add('scale-95', 'opacity-0');
            modalContent.classList.remove('scale-100', 'opacity-100');
            setTimeout(() => {
                modal.classList.add('hidden');
                feedbackForm.reset();
                currentCard = null;
                currentAction = null;
            }, 300);
        }

        // Modal event listeners
        cancelBtn.addEventListener('click', closeModal);
        modalBackdrop.addEventListener('click', (e) => {
            if (e.target === modalBackdrop) {
                closeModal();
            }
        });
        feedbackForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const principalFeedback = feedbackInput.value.trim();
            if (!principalFeedback) {
                showToast('Feedback cannot be empty.', 'bg-red-500');
                return;
            }

            // Move card to processed list
            moveCardToProcessed(currentCard, currentAction, principalFeedback);

            // Show toast
            const toastMessage = `Complaint has been ${currentAction}.`;
            const toastBg = currentAction === 'Approved' ? 'bg-green-500' : 'bg-red-500';
            showToast(toastMessage, toastBg);
            
            closeModal();
        });


        // --- Principal Action Logic ---
        function handlePrincipalAction(button, action) {
            const card = button.closest('.complaint-card');
            // Open the custom modal instead of prompt
            openModal(card, action);
        }

        // --- Move Card to Processed History ---
        function moveCardToProcessed(cardElement, finalStatus, principalFeedback) {
            const processedList = document.getElementById('processed-list');
            document.getElementById('empty-processed-message').classList.add('hidden');
            
            // Clone the card
            const processedCard = cardElement.cloneNode(true);
            
            // Remove action buttons
            processedCard.querySelector('.flex.justify-end.gap-3').remove();
            
            // Update status badge
            const statusBadgeContainer = processedCard.querySelector('.action-buttons');
            let statusBadge = '';
            if (finalStatus === 'Approved') {
                statusBadge = `<span class="px-4 py-2 bg-green-200 text-green-800 rounded-full text-sm font-bold">Approved by Principal</span>`;
            } else {
                statusBadge = `<span class="px-4 py-2 bg-red-200 text-red-800 rounded-full text-sm font-bold">Rejected by Principal</span>`;
            }
            statusBadgeContainer.innerHTML = statusBadge;

            // --- Add Principal's Feedback Block ---
            const principalFeedbackBlock = document.createElement('div');
            principalFeedbackBlock.className = "bg-gray-100 border-l-4 border-gray-500 text-gray-800 p-4 rounded-md mt-4";
            principalFeedbackBlock.innerHTML = `
                <h4 class="font-bold mb-1">Principal's Final Comment:</h4>
                <p class="text-sm">${principalFeedback}</p>
            `;
            // Append it after the HOD's feedback
            processedCard.querySelector('.bg-blue-50').insertAdjacentElement('afterend', principalFeedbackBlock);

            // Remove original card
            cardElement.style.transition = 'opacity 0.5s, transform 0.5s';
            cardElement.style.opacity = '0';
            cardElement.style.transform = 'scale(0.95)';
            setTimeout(() => {
                cardElement.remove();
                // Check if pending list is now empty
                if (document.getElementById('pending-list').children.length === 0) {
                    document.getElementById('pending-list').innerHTML = `
                        <div class="text-center text-gray-500 py-10">
                            <svg xmlns="http://www.w3.org/2000/svg" class="w-16 h-16 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke-width="1" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <p class="mt-2 text-lg">All complaints have been reviewed.</p>
                        </div>`;
                }
            }, 500);

            // Add new card to processed list
            processedList.insertAdjacentElement('afterbegin', processedCard);
        }
