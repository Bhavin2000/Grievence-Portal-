
import { getAdminStats } from '../../shared/utils/api.js';
import { initializeAdminPortal } from './helper.js';
import "../../shared/common.js";


// Check if user is authenticated and has admin role
document.addEventListener('DOMContentLoaded', async () => {
    const totalPending = document.getElementById('total-pending');
    const totalApproved = document.getElementById('total-approved');
    const totalRejected = document.getElementById('total-rejected');
    const totalSubmit = document.getElementById('total-submited');

    const stats = await getAdminStats();
    totalPending.innerText = stats.pending;
    totalApproved.innerText = stats.approved;
    totalRejected.innerText = stats.rejected;
    totalSubmit.innerText = stats.total;

    initializeAdminPortal();
});

