import { showToast } from "../../shared/common-dom/common-dom";
import { approveComplaint, getComplaintsForwardedByMe, getComplaintsRejectedByMe, getInboxComplaints, rejectComplaint } from "../../shared/utils/api";

function createPrincipalModalManager() {
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

    // Private methods
    function openModal(action, button) {
        currentCard = button.closest('.complaint-card');
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

    // Public API (returned object)
    return {
        open: openModal,
        close: closeModal,
        getCurrentCard: () => currentCard,
        getCurrentAction: () => currentAction,
        getForm: () => feedbackForm,
        getFeedbackInput: () => feedbackInput,
        getCancelBtn: () => cancelBtn,
        getSubmitBtn: () => submitBtn
    };
}


export const principalModalManager = createPrincipalModalManager();

// --- Move Card to Processed History ---
export function moveCardToProcessed(cardElement, finalStatus, principalFeedback, cardId) {
    const processedList = document.getElementById('processed-list');
    document.getElementById('empty-processed-message')?.classList.add('hidden');

    // Clone the card
    const processedCard = cardElement.cloneNode(true);

    // Remove action buttons
    processedCard.querySelector('.flex.justify-end.gap-3').remove();

    // Update status badge
    const statusBadgeContainer = processedCard.querySelector('.action-buttons');
    let statusBadge = '';
    if (finalStatus === 'Approved') {
        approveComplaint(cardId, principalFeedback);
        statusBadge = `<span class="px-4 py-2 bg-green-200 text-green-800 rounded-full text-sm font-bold">Approved by Principal</span>`;
    } else {
        rejectComplaint(cardId, principalFeedback);
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

export async function showPrincipalInbox() {
    const inbox = await getInboxComplaints();
    const InboxWrapper = document.querySelector('#pending-list');
    if (!inbox.length) return;

    InboxWrapper.innerHTML = '';
    inbox.forEach(item => {
        const card = GrievanceInboxCardDom(item);
        InboxWrapper.insertAdjacentHTML('beforeend', card);
    });
    InboxCardBtnHandler(InboxWrapper);
    buttonHandlerForModal();
    submitReviewPrincipal();

}

export async function showPrincipalProcessed() {
    const processedListWrapper = document.querySelector('.principal-Processed-complaints');
    processedListWrapper.innerHTML = '';
    const approved = await getComplaintsForwardedByMe();
    const rejected = await getComplaintsRejectedByMe();
    approved.forEach(complaint => {
        const card = processedComplaintCardApproved(complaint);
        processedListWrapper.insertAdjacentHTML('beforeend', card);
    });
    rejected.forEach(complaint => {
        const card = processedComplaintCardRejected(complaint);
        processedListWrapper.insertAdjacentHTML('beforeend', card);
    }); 
}


export function submitReviewPrincipal() {
    principalModalManager.getForm().addEventListener('submit', (e) => {
        e.preventDefault();
        const principalFeedback = principalModalManager.getFeedbackInput().value.trim();
        const currentCard = principalModalManager.getCurrentCard();
        const currentAction = principalModalManager.getCurrentAction();
        const cardId = currentCard.dataset.cardId;

        if (!principalFeedback) {
            showToast('Feedback cannot be empty.', 'bg-red-500');
            return;
        }

        // Move card to processed list
        moveCardToProcessed(currentCard, currentAction, principalFeedback, cardId);

        // Show toast
        const toastMessage = `Complaint has been ${currentAction}.`;
        const toastBg = currentAction === 'Approved' ? 'bg-green-500' : 'bg-red-500';
        showToast(toastMessage, toastBg);

        principalModalManager.close();
    });
}

export function GrievanceInboxCardDom(item) {
    return `
    <div class="complaint-card bg-white p-6 rounded-xl shadow-lg" data-card-id=${item._id}>
        <div class="flex flex-wrap items-center justify-between gap-4 mb-3">
            <div class="flex-1 min-w-[200px]">
                <div class="flex items-center gap-3 mb-1">
                    <span class="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-semibold">${item.category}</span>
                    <span class="text-gray-500 text-sm">from: ${item.createdBy.name} (${item.createdBy.email})</span>
                </div>
                <h3 class="text-lg font-bold text-gray-900">${item.title}</h3>
                <p class="text-gray-600 text-sm mt-1">"${item.description}"</p>
            </div>
            <div class="action-buttons">
                <span class="px-4 py-2 bg-yellow-100 text-yellow-800 rounded-full text-sm font-bold">Pending Principal Action</span>
            </div>
        </div>

        <div class="bg-blue-50 border-l-4 border-blue-500 text-blue-800 p-4 rounded-md mb-4">
            <h4 class="font-bold mb-1">HOD's Feedback:</h4>
            <p class="text-sm">${item.approvalReasons.hod || "No feedback provided."}</p>
        </div>

        <div class="flex justify-end gap-3">
            <button data-action="approve" class="bg-green-500 text-white py-2 px-5 rounded-lg font-semibold hover:bg-green-600 transition-all shadow-md">Final Approve</button>
            <button data-action="reject" class="bg-red-500 text-white py-2 px-5 rounded-lg font-semibold hover:bg-red-600 transition-all shadow-md">Final Reject</button>
        </div>
    </div>`;
}


export function buttonHandlerForModal() {
    const modal = document.getElementById('feedback-modal');
    modal.addEventListener('click', (e) => {
        if (e.target.dataset.action === 'cancel') {
            principalModalManager.close();
        } else if (e.target.dataset.action === 'submit') {
            const feedback = principalModalManager.getFeedbackInput().value;
            if (feedback) {
                console.log('Feedback submitted:', feedback);
                principalModalManager.close();
            }
        }
    });
}

export function InboxCardBtnHandler(cardWrapper) {
    cardWrapper.addEventListener('click', (e) => {
        if (e.target.dataset.action === 'approve') {
            principalModalManager.open('Approved', e.target);
        } else if (e.target.dataset.action === 'reject') {
            principalModalManager.open('Rejected', e.target);
        }
    });
}


export function processedComplaintCardApproved(complaint) {
    return `
    <div class="complaint-card bg-white p-6 rounded-xl shadow-lg" data-card-id="${complaint._id}">
        <div class="flex flex-wrap items-center justify-between gap-4 mb-3">
            <div class="flex-1 min-w-[200px]">
                <div class="flex items-center gap-3 mb-1">
                    <span class="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-semibold">${complaint.category}</span>
                    <span class="text-gray-500 text-sm">from: Bob Teacher (bob@teacher.edu)</span>
                </div>
                <h3 class="text-lg font-bold text-gray-900">${complaint.title}</h3>
                <p class="text-gray-600 text-sm mt-1">"${complaint.description}"</p>
            </div>
            <div class="action-buttons"><span class="px-4 py-2 bg-green-200 text-green-800 rounded-full text-sm font-bold">Approved by Principal</span></div>
        </div>

        <div class="bg-blue-50 border-l-4 border-blue-500 text-blue-800 p-4 rounded-md mb-4">
            <h4 class="font-bold mb-1">HOD's Feedback:</h4>
            <p class="text-sm">${complaint.approvalReasons.hod || "No feedback provided."}</p>
        </div><div class="bg-gray-100 border-l-4 border-gray-500 text-gray-800 p-4 rounded-md mt-4">
            <h4 class="font-bold mb-1">Principal's Final Comment:</h4>
            <p class="text-sm">${complaint.approvalReasons.principal || "No comment provided."}</p>
        </div>
    </div>`;
}

export function processedComplaintCardRejected(complaint) {
    return `
    <div class="complaint-card bg-white p-6 rounded-xl shadow-lg" data-card-id="${complaint._id}">
        <div class="flex flex-wrap items-center justify-between gap-4 mb-3">
            <div class="flex-1 min-w-[200px]">
                <div class="flex items-center gap-3 mb-1">
                    <span class="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-semibold">${complaint.category}</span>
                    <span class="text-gray-500 text-sm">from: Bob Teacher (bob@teacher.edu)</span>
                </div>
                <h3 class="text-lg font-bold text-gray-900">${complaint.title}</h3>
                <p class="text-gray-600 text-sm mt-1">"${complaint.description}"</p>
            </div>
            <div class="action-buttons"><span class="px-4 py-2 bg-red-200 text-red-800 rounded-full text-sm font-bold">Rejected by Principal</span></div>
        </div>

        <div class="bg-blue-50 border-l-4 border-blue-500 text-blue-800 p-4 rounded-md mb-4">
            <h4 class="font-bold mb-1">HOD's Feedback:</h4>
            <p class="text-sm">${complaint.approvalReasons.hod || "No feedback provided."}</p>
        </div><div class="bg-gray-100 border-l-4 border-gray-500 text-gray-800 p-4 rounded-md mt-4">
            <h4 class="font-bold mb-1">Principal's Final Comment:</h4>
            <p class="text-sm">${complaint.rejectionReasons.principal || "No comment provided."}</p>
        </div>


    </div>`
}
