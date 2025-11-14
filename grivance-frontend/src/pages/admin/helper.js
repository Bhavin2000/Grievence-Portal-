import { getAllCompletedComplaints, getAllPendingComplaints, getComplaintsByStudents, getComplaintsByTeachers, getRecentActivityComplaints } from "../../shared/utils/api";

export async function initializeAdminPortal() {
    setupTabNavigation();
    const recentlyActiveComplaints = await getRecentActivityComplaints();
    const recentActivityContainer = document.getElementById('recent-complaints-activity');
    if (!recentlyActiveComplaints.length) {
        recentActivityContainer.innerHTML = emptyState('No recent activity found');
    } else {
        recentActivityContainer.innerHTML = recentlyActiveComplaints.map(complaint => recentActivityCard(complaint)).join('');
    }
    
    const studentsComplaintsContainer = document.getElementById('student-list');
    const studentsComplaints = await getComplaintsByStudents();
    if (!studentsComplaints.length) {
        studentsComplaintsContainer.innerHTML = emptyState('No complaints from students');
    } else {
        studentsComplaintsContainer.innerHTML = studentsComplaints.map(complaint => complaintCard(complaint)).join('');
    }
    
    const TeachercomplaintList = document.getElementById('teacher-list');
    const teachersComplaints = await getComplaintsByTeachers();
    if (!teachersComplaints.length) {
        TeachercomplaintList.innerHTML = emptyState('No complaints from teachers');
    } else {
        TeachercomplaintList.innerHTML = teachersComplaints.map(complaint => complaintCard(complaint)).join('');
    }
    
    const pendingComplaintsList = document.getElementById('pending-list-all');
    const pendingComplaints = await getAllPendingComplaints();
    if (!pendingComplaints.length) {
        pendingComplaintsList.innerHTML = emptyState('No pending complaints');
    } else {
        pendingComplaintsList.innerHTML = pendingComplaints.map(complaint => complaintCard(complaint)).join('');
    }
    
    const completedComplaintsList = document.getElementById('completed-list-all');
    const completedComplaints = await getAllCompletedComplaints();
    if (!completedComplaints.length) {
        completedComplaintsList.innerHTML = emptyState('No completed complaints');
    } else {
        completedComplaintsList.innerHTML = completedComplaints.map(complaint => complaintCard(complaint)).join('');
    }
}

export function setupTabNavigation() {
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

export function recentActivityCard(complaint) {
    let statusBadge;
    if (complaint.status === 'rejected') {
        statusBadge = `<span class="px-4 py-2 bg-red-100 text-red-800 rounded-full text-sm font-bold">Rejected</span>`;
    } else if (complaint.status === 'approved') {
        statusBadge = `<span class="px-4 py-2 bg-green-100 text-green-800 rounded-full text-sm font-bold">Approved & Resolved</span>`;
    } else {
        statusBadge = `<span class="px-4 py-2 bg-yellow-100 text-yellow-800 rounded-full text-sm font-bold">Pending ${complaint.currentPendingStage} Action</span>`;
    }

    return `
    <div class="bg-white p-5 rounded-xl shadow-lg flex flex-wrap items-center justify-between gap-4">
        <div class="flex-1 min-w-[200px]">
            <h3 class="text-lg font-bold text-gray-900">${complaint.title}</h3>
            <p class="text-gray-600 text-sm mt-1">From: ${complaint.createdBy.name} (${complaint.createdBy.role})</p>
        </div>
        <div class="text-right">
            ${statusBadge}
        </div>
    </div>`;
}

export function complaintCard(complaint) {
    let statusBadge;
    if (complaint.status === 'rejected') {
        statusBadge = `<span class="px-4 py-2 bg-red-100 text-red-800 rounded-full text-sm font-bold">Rejected</span>`;
    } else if (complaint.status === 'approved') {
        statusBadge = `<span class="px-4 py-2 bg-green-100 text-green-800 rounded-full text-sm font-bold">Approved & Resolved</span>`;
    } else {
        statusBadge = `<span class="px-4 py-2 bg-yellow-100 text-yellow-800 rounded-full text-sm font-bold">Pending With : ${complaint.currentPendingStage.toUpperCase() || 'Review'}</span>`;
    }

    return `
    <div class="complaint-card bg-white p-6 rounded-xl shadow-lg">
        <div class="flex items-center justify-between gap-4 mb-3">
            <h3 class="text-lg font-bold text-gray-900">${complaint.title} <span class="text-gray-500 text-sm font-normal">(From: ${complaint.createdBy.name})</span></h3>
            <div class="text-right">
                ${statusBadge}
            </div>
        </div>
        <p class="text-gray-600 text-sm mb-4">${complaint.description}</p>
        <div class="space-y-2">
            ${complaint.approvalReasons && complaint.approvalReasons.teacher ? `
                <div class="bg-green-50 border-l-4 border-green-500 text-green-800 p-3 rounded-md">
                    <p class="text-sm"><strong class="font-bold">Teacher:</strong> ${complaint.approvalReasons.teacher}</p>
                </div>` : ''}
            ${complaint.approvalReasons && complaint.approvalReasons.hod ? `
                <div class="bg-blue-50 border-l-4 border-blue-500 text-blue-800 p-3 rounded-md">
                    <p class="text-sm"><strong class="font-bold">HOD:</strong> ${complaint.approvalReasons.hod}</p>
                </div>` : ''}
            ${complaint.approvalReasons && complaint.approvalReasons.principal ? `
                <div class="bg-purple-50 border-l-4 border-purple-500 text-purple-800 p-3 rounded-md">
                    <p class="text-sm"><strong class="font-bold">Principal:</strong> ${complaint.approvalReasons.principal}</p>
                </div>` : ''}
        </div>
    </div>`;
}

export function emptyState(message = 'No items found') {
    return `
    <div class="text-center py-12">
        <div class="flex flex-col items-center justify-center space-y-4">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-16 h-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <div>
                <h3 class="text-lg font-medium text-gray-900">${message}</h3>
                <p class="mt-1 text-sm text-gray-500">Check back later or try refreshing the page.</p>
            </div>
        </div>
    </div>`;
}



