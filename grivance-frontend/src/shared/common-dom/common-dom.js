import { approveComplaint, createComplaint, getInboxComplaints, getMyComplaints, rejectComplaint } from "../utils/api.js";
import { getUserRole } from "../utils/auth.js";

export async function loadExistingComplaints() {
    try {
        // Use getMyComplaints() which already filters by authenticated user
        const role = getUserRole();

        const complaints = await getMyComplaints();
        if (role === 'teacher') {
            complaints.forEach(complaint => {
                addGrievanceToTeacherTracker(complaint);
            });
            return;
        }

        // Separate complaints into active and completed
        const activeComplaints = complaints.filter(complaint =>
            complaint.status !== 'resolved' && complaint.status !== 'rejected'
        );
        const completedComplaints = complaints.filter(complaint =>
            complaint.status === 'resolved' || complaint.status === 'rejected'
        );

        // Add active complaints to tracking list
        activeComplaints.forEach(complaint => {
            addGrievanceToStudentTracker(complaint);
        });

        // Add completed complaints to history
        completedComplaints.forEach(complaint => {
            addToHistory(complaint);
        });

        // Show empty messages if needed
        if (activeComplaints.length === 0) {
            const emptyMessage = document.getElementById('empty-tracking-message');
            if (emptyMessage) {
                emptyMessage.classList.remove('hidden');
            }
        }

        if (completedComplaints.length === 0) {
            const emptyHistoryMessage = document.getElementById('empty-history-message');
            if (emptyHistoryMessage) {
                emptyHistoryMessage.classList.remove('hidden');
            }
        }

    } catch (error) {
        console.error('Error loading existing complaints:', error);
        showToast('Failed to load existing complaints.', 'bg-red-500');
    }
}


export function addGrievanceToStudentTracker(complaintData) {
    // If complaint is resolved or rejected, add to history instead
    if (complaintData.status === 'resolved' || complaintData.status === 'rejected') {
        addToHistory(complaintData);
        return;
    }

    const trackingList = document.getElementById('grievance-tracking-list');
    document.getElementById('empty-tracking-message').classList.add('hidden');

    // Extract data from API response
    const trackingId = complaintData._id;
    const category = complaintData.category;
    const title = complaintData.title;
    const description = complaintData.description;
    const status = complaintData.status;
    const stage = complaintData.stage;
    const createdAt = new Date(complaintData.createdAt).toLocaleDateString();

    // Map stage to display status for active complaints
    const getDisplayStatus = (stage, status) => {
        switch (stage) {
            case 'teacher': return 'With Teacher';
            case 'hod': return 'With HOD';
            case 'principal': return 'With Principal';
            default: return 'Submitted';
        }
    };

    const displayStatus = getDisplayStatus(stage, status);

    const card = document.createElement('div');
    card.className = "bg-gray-50 p-6 rounded-lg border border-gray-200 shadow-sm fade-in";
    card.setAttribute('data-tracking-id', trackingId);
    card.setAttribute('data-status', displayStatus);
    card.setAttribute('data-stage', stage);
    card.setAttribute('data-api-status', status);

    // Generate tracker HTML with API data
    card.innerHTML = generateTrackerHTML(category, title, description, displayStatus, trackingId, createdAt, stage);

    trackingList.insertAdjacentElement('afterbegin', card);
}

export function addGrievanceToTeacherTracker(complaintData) {
    const trackingList = document.getElementById('grievance-tracking-list');
    const emptyMessage = document.getElementById('empty-tracking-message');

    const trackingId = complaintData._id;
    const category = complaintData.category;
    const title = complaintData.title;
    const description = complaintData.description;
    const status = complaintData.status;
    const stage = complaintData.stage;
    const submissionDate = new Date(complaintData.createdAt).toLocaleDateString();

    // Hide the empty message
    if (emptyMessage) {
        emptyMessage.classList.add('hidden');
    }

    // Map stage to display status for teacher view
    const getDisplayStatus = (stage, status) => {
        switch (stage) {
            case 'teacher': return 'Under Review';
            case 'hod': return 'Forwarded to HOD';
            case 'principal': return 'With Principal';
            default: return 'New Assignment';
        }
    };

    const displayStatus = getDisplayStatus(stage, status);

    // Create card element
    const card = document.createElement('div');
    card.className = "bg-gray-50 p-6 rounded-lg border border-gray-200 shadow-sm fade-in";
    card.setAttribute('data-tracking-id', trackingId);
    card.setAttribute('data-status', displayStatus);
    card.setAttribute('data-stage', stage);
    card.setAttribute('data-api-status', status);

    // Generate tracker HTML with proper tracking structure
    card.innerHTML = generateTeacherTrackerHTML(category, title, description, displayStatus, trackingId, submissionDate, stage);

    // Add the new card to the top of the list
    trackingList.insertAdjacentElement('afterbegin', card);
}

function generateTeacherTrackerHTML(category, title, description, displayStatus, trackingId, submissionDate, stage) {
    const getStageStyles = (currentStage, targetStage) => {
        const stages = ['teacher', 'hod', 'principal'];
        const currentIndex = stages.indexOf(currentStage);
        const targetIndex = stages.indexOf(targetStage);

        if (targetIndex < currentIndex) {
            return {
                icon: 'bg-green-600 text-white',
                label: 'text-green-600',
                content: '✓'
            };
        } else if (targetIndex === currentIndex) {
            return {
                icon: 'bg-blue-600 text-white',
                label: 'text-blue-600',
                content: targetIndex + 1
            };
        } else {
            return {
                icon: 'bg-gray-300 text-gray-600',
                label: 'text-gray-400',
                content: targetIndex + 1
            };
        }
    };

    const teacherStyles = getStageStyles(stage, 'teacher');
    const hodStyles = getStageStyles(stage, 'hod');
    const principalStyles = getStageStyles(stage, 'principal');

    return `
        <div class="flex flex-wrap justify-between items-center gap-2 mb-2">
            <h3 class="text-lg font-semibold text-gray-800">${category}: ${title}</h3>
            <span class="status-badge text-sm font-medium text-blue-600">Status: ${displayStatus}</span>
        </div>
        <p class="text-gray-600 text-sm mb-6">${description}</p>
        
        <div class="live-tracker-container w-full my-4 px-2">
            <div class="flex items-start">
                <div class="flex-1 flex flex-col items-center relative">
                    <div class="tracker-step-icon flex items-center justify-center w-8 h-8 ${teacherStyles.icon} rounded-full font-bold">
                        ${teacherStyles.content}
                    </div>
                    <span class="tracker-step-label text-xs font-medium ${teacherStyles.label} mt-1">Submitted</span>
                    <div class="tracker-connector absolute top-4 left-1/2 w-full h-1 bg-gray-200 -z-10">
                        <div class="h-1 ${stage === 'teacher' ? 'bg-blue-600' : stage === 'hod' || stage === 'principal' ? 'bg-green-600' : 'bg-gray-200'}" style="width: ${stage === 'teacher' ? '50%' : '100%'};"></div>
                    </div>
                </div>
                
                <div class="flex-1 flex flex-col items-center relative">
                    <div class="tracker-step-icon flex items-center justify-center w-8 h-8 ${hodStyles.icon} rounded-full font-bold">
                        ${hodStyles.content}
                    </div>
                    <span class="tracker-step-label text-xs font-medium ${hodStyles.label} mt-1">HOD Review</span>
                    <div class="tracker-connector absolute top-4 left-1/2 w-full h-1 bg-gray-200 -z-10">
                        <div class="h-1 ${stage === 'hod' ? 'bg-blue-600' : stage === 'principal' ? 'bg-green-600' : 'bg-gray-200'}" style="width: ${stage === 'hod' ? '50%' : stage === 'principal' ? '100%' : '0%'};"></div>
                    </div>
                </div>

                <div class="flex-1 flex flex-col items-center relative">
                    <div class="tracker-step-icon flex items-center justify-center w-8 h-8 ${principalStyles.icon} rounded-full font-bold">
                        ${principalStyles.content}
                    </div>
                    <span class="tracker-step-label text-xs font-medium ${principalStyles.label} mt-1">Principal Review</span>
                </div>
            </div>
        </div>

        <div class="flex flex-wrap justify-between items-center text-sm text-gray-500 gap-x-4 pt-4 border-t border-gray-200">
            <span>Tracking ID: #${trackingId}</span>
            <span>Submitted on: ${submissionDate}</span>
            <button class="bg-gray-200 text-gray-800 py-1 px-3 rounded-lg font-semibold hover:bg-gray-300 transition-all text-xs" onclick="updateGrievanceStatus(this)">Check Status</button>
        </div>
    `;
}

// --- Add to History ---
export function addToHistory(complaintData) {
    const historyList = document.getElementById('grievance-history-list');
    if (!historyList) return;
    document.getElementById('empty-history-message').classList.add('hidden');

    const card = document.createElement('div');
    card.className = "bg-gray-50 p-6 rounded-lg border border-gray-200 shadow-sm";

    const status = complaintData.status;
    const statusClass = status === 'resolved' ? 'text-green-600' : 'text-red-600';
    const statusText = status === 'resolved' ? 'Resolved' : 'Denied';

    card.innerHTML = `
            <div class="flex flex-wrap justify-between items-center gap-2 mb-2">
                <h3 class="text-lg font-semibold text-gray-800">${complaintData.category.split(' ')[0]}: ${complaintData.title}</h3>
                <span class="status-badge text-sm font-medium ${statusClass}">Status: ${statusText}</span>
            </div>
            <p class="text-gray-600 text-sm mb-4">${complaintData.description}</p>
            <div class="flex flex-wrap justify-between items-center text-sm text-gray-500 gap-x-4 pt-4 border-t border-gray-200">
                <span>Tracking ID: #${complaintData._id}</span>
                <span>Submitted on: ${new Date(complaintData.createdAt).toLocaleDateString()}</span>
            </div>
        `;

    historyList.insertAdjacentElement('afterbegin', card);
}

export function generateTrackerHTML(category, title, description, displayStatus, trackingId, createdAt, stage) {
    const getStageStyles = (currentStage, targetStage) => {
        const stages = ['teacher', 'hod', 'principal'];
        const currentIndex = stages.indexOf(currentStage);
        const targetIndex = stages.indexOf(targetStage);

        if (targetIndex < currentIndex) {
            return {
                icon: 'bg-green-600 text-white',
                label: 'text-green-600',
                content: '✓'
            };
        } else if (targetIndex === currentIndex) {
            return {
                icon: 'bg-blue-600 text-white',
                label: 'text-blue-600',
                content: targetIndex + 1
            };
        } else {
            return {
                icon: 'bg-gray-300 text-gray-600',
                label: 'text-gray-400',
                content: targetIndex + 1
            };
        }
    };

    const teacherStyles = getStageStyles(stage, 'teacher');
    const hodStyles = getStageStyles(stage, 'hod');
    const principalStyles = getStageStyles(stage, 'principal');

    return `
            <div class="flex flex-wrap justify-between items-center gap-2 mb-2">
                <h3 class="text-lg font-semibold text-gray-800">${category.split(' ')[0]}: ${title}</h3>
                <span class="status-badge text-sm font-medium text-blue-600">Status: ${displayStatus}</span>
            </div>
            <p class="text-gray-600 text-sm mb-6">${description}</p>
            
            <div class="live-tracker-container w-full my-4 px-2">
                <div class="flex items-start">
                    <div class="flex-1 flex flex-col items-center relative">
                        <div class="tracker-step-icon flex items-center justify-center w-8 h-8 bg-green-600 text-white rounded-full font-bold">
                            ✓
                        </div>
                        <span class="tracker-step-label text-xs font-medium text-green-600 mt-1">Submitted</span>
                        <div class="tracker-connector absolute top-4 left-1/2 w-full h-1 bg-gray-200 -z-10">
                            <div class="h-1 bg-green-600" style="width: 100%;"></div>
                        </div>
                    </div>

                    <div class="flex-1 flex flex-col items-center relative">
                        <div class="tracker-step-icon flex items-center justify-center w-8 h-8 ${teacherStyles.icon} rounded-full font-bold">
                            ${teacherStyles.content}
                        </div>
                        <span class="tracker-step-label text-xs font-medium ${teacherStyles.label} mt-1">With Teacher</span>
                        <div class="tracker-connector absolute top-4 left-1/2 w-full h-1 bg-gray-200 -z-10">
                            <div class="h-1 ${stage === 'teacher' ? 'bg-blue-600' : stage === 'hod' || stage === 'principal' ? 'bg-green-600' : 'bg-gray-200'}" style="width: ${stage === 'teacher' ? '0%' : '100%'};"></div>
                        </div>
                    </div>
                    
                    <div class="flex-1 flex flex-col items-center relative">
                        <div class="tracker-step-icon flex items-center justify-center w-8 h-8 ${hodStyles.icon} rounded-full font-bold">
                            ${hodStyles.content}
                        </div>
                        <span class="tracker-step-label text-xs font-medium ${hodStyles.label} mt-1">With HOD</span>
                        <div class="tracker-connector absolute top-4 left-1/2 w-full h-1 bg-gray-200 -z-10">
                            <div class="h-1 ${stage === 'hod' ? 'bg-blue-600' : stage === 'principal' ? 'bg-green-600' : 'bg-gray-200'}" style="width: ${stage === 'hod' ? '0%' : stage === 'principal' ? '100%' : '0%'};"></div>
                        </div>
                    </div>

                    <div class="flex-1 flex flex-col items-center relative">
                        <div class="tracker-step-icon flex items-center justify-center w-8 h-8 ${principalStyles.icon} rounded-full font-bold">
                            ${principalStyles.content}
                        </div>
                        <span class="tracker-step-label text-xs font-medium ${principalStyles.label} mt-1">With Principal</span>
                    </div>
                </div>
            </div>

            <div class="flex flex-wrap justify-between items-center text-sm text-gray-500 gap-x-4 pt-4 border-t border-gray-200">
                <span>Tracking ID: #${trackingId}</span>
                <span>Submitted on: ${createdAt}</span>
                <button class="bg-gray-200 text-gray-800 py-1 px-3 rounded-lg font-semibold hover:bg-gray-300 transition-all text-xs" onclick="updateGrievanceStatus(this)">Check Status</button>
            </div>
        `;
}


export async function handleGrievanceFormSubmit(event) {
    event.preventDefault();

    const category = document.getElementById('grievance-category').value;
    const title = document.getElementById('grievance-subject').value;
    const description = document.getElementById('grievance-description').value;

    try {
        const role = getUserRole();
        // Show loading state
        const submitBtn = this.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Submitting...';
        submitBtn.disabled = true;

        // Create complaint via API
        const response = await createComplaint({ category, title, description });

        // Add to tracking list using API response
        if (role === 'student') {
            addGrievanceToStudentTracker(response);
        } else if (role === 'teacher') {
            addGrievanceToTeacherTracker(response);
        }
        showToast('Your complaint has been submitted successfully.', 'bg-blue-500');
        this.reset();

        // Reset button
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;

    } catch (error) {
        console.error('Error submitting complaint:', error);
        showToast('Failed to submit complaint. Please try again.', 'bg-red-500');

        // Reset button on error
        const submitBtn = this.querySelector('button[type="submit"]');
        submitBtn.textContent = 'Submit Complaint';
        submitBtn.disabled = false;
    }
}


export function showToast(message, bgColor) {
    const toast = document.getElementById('toast-notification');
    const toastMessage = document.getElementById('toast-message');

    toastMessage.textContent = message;
    toast.classList.remove('bg-green-500', 'bg-red-500', 'bg-blue-500', 'bg-yellow-500', 'bg-orange-500'); // Clear all colors
    toast.classList.add(bgColor);

    toast.classList.remove('hidden', 'opacity-0', '-translate-y-10');
    toast.classList.add('opacity-100', 'translate-y-0');

    setTimeout(() => {
        toast.classList.remove('opacity-100', 'translate-y-0');
        toast.classList.add('opacity-0', '-translate-y-10');
        setTimeout(() => toast.classList.add('hidden'), 500);
    }, 3000);
}

export async function showTeacherInbox() {
    const inbox = await getInboxComplaints();
    console.log('Inbox Complaints:', inbox);
    const InboxWrapper = document.querySelector('.grievance-card-wrapper');
    if (!inbox.length) return;
    InboxWrapper.innerHTML = '';
    inbox.forEach(item => {
        const card = GrievanceInboxCardDom(item);
        InboxWrapper.insertAdjacentHTML('beforeend', card);
    });
    teacherInboxCardBtnHandler(InboxWrapper);
}

export function teacherInboxCardBtnHandler(cardWrapper) {
    cardWrapper.addEventListener('click', (e) => {
        if (e.target.dataset.action === 'approve') {
            const cardId = e.target.closest('.grievance-card').dataset.cardId;
            approveComplaint(cardId);
            handleGrievance(e.target);
        } else if (e.target.dataset.action === 'denied') {
            const cardId = e.target.closest('.grievance-card').dataset.cardId;
            rejectComplaint(cardId, 'User did not provide a reason');
            handleGrievance(e.target);
        }
    });
}

export async function showHodInbox() {
    const inbox = await getInboxComplaints();
    const InboxWrapper = document.querySelector('.grievance-card-wrapper');
    const teacherPersonal = document.querySelector('.teacher-personal');
    if (!inbox.length) return;

    const studentComplaints = inbox.filter(complaint => complaint.createdBy.role === 'student');
    const teacherComplaints = inbox.filter(complaint => complaint.createdBy.role === 'teacher');

    InboxWrapper.innerHTML = '';
    teacherPersonal.innerHTML = '';
    studentComplaints.forEach(item => {
        const card = GrievanceInboxCardDom(item);
        InboxWrapper.insertAdjacentHTML('beforeend', card);
    });
    teacherComplaints.forEach(item => {
        const card = GrievanceInboxCardDom(item);
        teacherPersonal.insertAdjacentHTML('beforeend', card);
    });
    hodInboxCardBtnHandler(InboxWrapper);
    hodInboxCardBtnHandler(teacherPersonal);
    buttonHandlerForModal();
    submitReviewHod();
}


function createModalManager() {
    // Private variables (encapsulated within closure)
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

    // Private methods
    function openModal(action, button) {
        console.log('Opening modal for action:', button);
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

    // Public API (returned object)
    return {
        open: openModal,
        close: closeModal,
        getCurrentCard: () => currentCard,
        getCurrentAction: () => currentAction,
        getForm: () => feedbackForm,
        getFeedbackText: () => feedbackText
    };
}

// Create modal manager instance
export const modalManager = createModalManager();

export function hodInboxCardBtnHandler(cardWrapper) {
    cardWrapper.addEventListener('click', (e) => {
        if (e.target.dataset.action === 'approve') {
            modalManager.open('approve', e.target);
        } else if (e.target.dataset.action === 'denied') {
            modalManager.open('reject', e.target);
        }
    });
}

export function submitReviewHod() {
    modalManager.getForm().addEventListener('submit', function (event) {
        event.preventDefault();
        const feedback = modalManager.getFeedbackText().value;
        const currentCard = modalManager.getCurrentCard();
        const currentAction = modalManager.getCurrentAction();
        const grievanceTitle = currentCard.querySelector('h3').textContent;
        const actionButtons = currentCard.querySelector('.action-buttons');
        const cardId = currentCard.dataset.cardId;

        let message = '';
        let toastBg = '';
        let newStatusHTML = '';
        let logPanelId = '';
        let logHTML = '';

        if (currentAction === 'approve') {
            approveComplaint(cardId, feedback);
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
            rejectComplaint(cardId, feedback);
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
        modalManager.close();
    });
}

export function buttonHandlerForModal() {
    const modal = document.getElementById('feedback-modal');
    modal.addEventListener('click', (e) => {
        if (e.target.dataset.action === 'cancel') {
            modalManager.close();
        } else if (e.target.dataset.action === 'submit') {
            const feedback = modalManager.getFeedbackText().value;
            if (feedback) {
                console.log('Feedback submitted:', feedback);
                modalManager.close();
            }
        }
    });
}


export function ForwardedToPrincipalCardDom(item) {
    return `
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

export function SentBackToTeacherCardDom(item) {
    return `
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




export function GrievanceInboxCardDom(item) {
    return ` <div class="grievance-card bg-white p-5 rounded-xl shadow-lg flex flex-wrap items-center justify-between gap-4" data-card-id=${item._id}>
        <div class="flex-1 min-w-[200px]">
            <div class="flex items-center gap-3 mb-1">
                <span class="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold">${item.category}</span>
                <span class="text-gray-500 text-sm">From: ${item.createdBy.email} (${item.createdBy.name})</span>
            </div>
            <h3 class="text-lg font-bold text-gray-900">${item.title}</h3>
            <p class="text-gray-600 text-sm mt-1">${item.description}</p>
        </div>
        <div class="action-buttons flex gap-3">
            <button class="bg-green-500 text-white py-2 px-5 rounded-lg font-semibold hover:bg-green-600 transition-all shadow-md" data-action="approve">Approve</button>
            <button class="bg-red-500 text-white py-2 px-5 rounded-lg font-semibold hover:bg-red-600 transition-all shadow-md " data-action="denied">Deny</button>
        </div>
    </div>`;
}

function handleGrievance(button) {
    const card = button.closest('.grievance-card');
    const actionStatus = button.dataset.action;
    const actionButtons = card.querySelector('.action-buttons');
    let message = '';
    let toastBg = '';

    // This is a simulation. In a real app, you'd call an API.
    if (actionStatus === 'approve') {
        message = 'Grievance approved and forwarded to HOD.';
        toastBg = 'bg-green-500';
        actionButtons.innerHTML = `<span class="px-4 py-2 bg-green-200 text-green-800 rounded-full text-sm font-bold">Forwarded to HOD</span>`;
    } else if (actionStatus === 'denied') {
        message = 'Grievance has been rejected.';
        toastBg = 'bg-red-500';
        actionButtons.innerHTML = `<span class="px-4 py-2 bg-red-200 text-red-800 rounded-full text-sm font-bold">Rejected</span>`;
    }

    // Show toast notification
    showToast(message, toastBg);

    // Make the card look processed
    card.classList.add('opacity-70', 'bg-gray-50');
}