import { showHodInbox } from "../../shared/common-dom/common-dom";
import "../../shared/common.js";
import { getComplaintsForwardedByMe, getComplaintsRejectedByMe } from "../../shared/utils/api";

document.addEventListener('DOMContentLoaded', async function () {
    // --- Tab Navigation Logic ---
    const sidebarLinks = document.querySelectorAll('.sidebar-link');
    const contentPanels = document.querySelectorAll('.content-panel');

    sidebarLinks.forEach(link => {
        link.addEventListener('click', function (event) {
            event.preventDefault();
            const targetId = this.getAttribute('data-target');

            contentPanels.forEach(panel => panel.classList.add('hidden'));
            document.getElementById(targetId).classList.remove('hidden');

            sidebarLinks.forEach(l => l.classList.remove('active'));
            this.classList.add('active');
        });
    });
    showHodInbox();

    const approvedcomplaints = await getComplaintsForwardedByMe();
    const forwardedContainer = document.querySelector('.forwarded-principal');
    const principalFeedbackContainer = document.querySelector('.principal-feedback-card-wrapper');
    forwardedContainer.innerHTML = '';
    console.log(approvedcomplaints)
    approvedcomplaints.forEach(complaint => {
        if (complaint.status === 'pending') {
            forwardedContainer.innerHTML += forwardedComplaintCard(complaint);
        } else {
            principalFeedbackContainer.innerHTML += principalFeedbackCard(complaint);
        }
    });

    const rejectedComplaints = await getComplaintsRejectedByMe();
    const rejectedContainer = document.querySelector('.sent-back-teachers');
    rejectedContainer.innerHTML = '';
    rejectedComplaints.forEach(complaint => {
        rejectedContainer.innerHTML += rejectComplaintCard(complaint);
    });


});

export function forwardedComplaintCard(complaint) {
    return `
    <div class="bg-white p-5 rounded-xl shadow-lg">
        <div class="flex flex-wrap items-center justify-between gap-4 mb-3">
            <div class="flex-1 min-w-[200px]">
                <h3 class="text-lg font-bold text-gray-900">${complaint.title}</h3>
                <span class="text-gray-500 text-sm">From: ${complaint.createdBy.name} (${complaint.createdBy.email})</span>
            </div>
            <div class="action-buttons">
                <span class="px-4 py-2 bg-gray-200 text-gray-800 rounded-full text-sm font-bold">${complaint.autoForwarded ? 'Auto-Forwarded' : 'Forwarded'}</span>
            </div>
        </div>
    </div>
    `
}

export function rejectComplaintCard(complaint) {
    return `
    <div class="bg-white p-5 rounded-xl shadow-lg">
        <div class="flex flex-wrap items-center justify-between gap-4 mb-3">
            <h3 class="text-lg font-bold text-gray-900">${complaint.title}</h3>
            <span class="px-4 py-2 bg-red-200 text-red-800 rounded-full text-sm font-bold">Rejected</span>
        </div>
        <span class="text-gray-500 text-sm">From: ${complaint.createdBy.name} (${complaint.createdBy.email})</span>
        <div class="bg-red-50 border-l-4 border-red-500 text-red-800 p-4 rounded-md">
            <h4 class="font-bold mb-1">Your Feedback:</h4>
            <p class="text-sm">${complaint.myRejectionDetails.reason}</p>
        </div>
    </div>
    `
}

export function principalFeedbackCard(complaint) {
    return `
    <div class="bg-white p-5 rounded-xl shadow-lg">
        <div class="flex flex-wrap items-center justify-between gap-4 mb-3">
            <div class="flex-1 min-w-[200px]">
                <h3 class="text-lg font-bold text-gray-900">${complaint.title}</h3>
                <span class="text-gray-500 text-sm">From: ${complaint.createdBy.name} (${complaint.createdBy.email})</span>
            </div>
            <div class="action-buttons">
                <span class="px-4 py-2 ${complaint.status === 'approved' ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'} rounded-full text-sm font-bold">${complaint.status === 'approved' ? 'Action Taken' : 'Rejected'}</span>
            </div>
        </div>
        <div class="${complaint.status === 'approved' ? 'bg-green-50 border-l-4 border-green-500 text-green-800' : 'bg-red-50 border-l-4 border-red-500 text-red-800'} p-4 rounded-md">
            <h4 class="font-bold mb-1">Principal's Feedback (Helpful):</h4>
            <p class="text-sm">${complaint?.approvalReasons?.principal || complaint?.rejectionReasons?.principal}</p>
        </div>
    </div>`
}
