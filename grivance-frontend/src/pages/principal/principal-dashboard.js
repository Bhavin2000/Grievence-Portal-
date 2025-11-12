const { showToast } = require("../../shared/common-dom/common-dom");
const { getInboxComplaints, getComplaintsAutoApprovedByMe, getComplaintsForwardedByMe, getComplaintsRejectedByMe } = require("../../shared/utils/api");
const { principalModalManager, moveCardToProcessed, showPrincipalInbox } = require("./helper");


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

    showPrincipalInbox();
});