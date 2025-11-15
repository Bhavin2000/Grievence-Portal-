// API utility functions
export const API_BASE_URL = 'http://localhost:4000/api';

export const apiRequest = async (endpoint, options = {}) => {
    const token = localStorage.getItem('token');

    const config = {
        headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` })
        },
        ...options
    };

    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
        const data = await response.json();

        if (!response.ok) {
            // Throw error with the message from the API response
            throw new Error(data.message || `HTTP error! status: ${response.status}`);
        }

        return data;
    } catch (error) {
        console.error('API request failed:', error);
        throw error;
    }
};

export const getComplaints = async () => {
    return apiRequest('/complaints');
};

// Get complaints created by the current user (for students)
export const getMyComplaints = async () => {
    return apiRequest('/complaints/mine');
};

// Get complaints in inbox (for processing by teachers/hod/principal)
export const getInboxComplaints = async (category = null) => {
    const endpoint = category ? `/complaints/inbox?category=${encodeURIComponent(category)}` : '/complaints/inbox';
    return apiRequest(endpoint);
};

// Get specific complaint with tracking info
export const getComplaintWithTracking = async (id) => {
    return apiRequest(`/complaints/${id}/track`);
};

export const createComplaint = async (complaint) => {
    return apiRequest('/complaints', {
        method: 'POST',
        body: JSON.stringify(complaint)
    });
};

export const updateComplaint = async (id, complaint) => {
    return apiRequest(`/complaints/${id}`, {
        method: 'PUT',
        body: JSON.stringify(complaint)
    });
};

export const deleteComplaint = async (id) => {
    return apiRequest(`/complaints/${id}`, {
        method: 'DELETE'
    });
};

// Complaint actions (approve/reject)
export const approveComplaint = async (id, reason) => {
    return apiRequest(`/complaints/${id}/approve`, {
        method: 'POST',
        body: JSON.stringify({ reason })
    });
};

export const rejectComplaint = async (id, reason) => {
    return apiRequest(`/complaints/${id}/reject`, {
        method: 'POST',
        body: JSON.stringify({ reason })
    });
};

// Add comment to complaint
export const addComment = async (id, comment) => {
    return apiRequest(`/complaints/${id}/comment`, {
        method: 'POST',
        body: JSON.stringify({ comment })
    });
};

export const getComplaintsForwardedByMe = async () => {
    return apiRequest('/complaints/forwarded-by-me');
};

export const getComplaintsRejectedByMe = async () => {
    return apiRequest('/complaints/rejected-by-me');
};

export const getComplaintsAutoApprovedByMe = async () => {
    return apiRequest('/complaints/auto-approved-by-me');
};

export const getMyApprovalsLaterRejected = async () => {
    return apiRequest('/complaints/my-approvals-later-rejected');
};

export const getComplaintsRaisedByRole = async (role) => {
    if (!['student', 'teacher'].includes(role)) {
        throw new Error('Role must be either "student" or "teacher"');
    }
    return apiRequest(`/complaints/raised/by-role/${role}`);
};

export const getAdminStats = async () => {
    return apiRequest('/admin/stats');
};

export const getAdminComplaints = async (page = 1, per = 50) => {
    return apiRequest(`/admin/complaints?page=${page}&per=${per}`);
};

// Get complaints created by teachers
export const getComplaintsByTeachers = async () => {
    return apiRequest('/admin/complaints/by-teachers');
};

// Get complaints created by students
export const getComplaintsByStudents = async () => {
    return apiRequest('/admin/complaints/by-students');
};

// Get all pending complaints
export const getAllPendingComplaints = async () => {
    return apiRequest('/admin/complaints/pending');
};

// Get all completed complaints (approved + rejected)
export const getAllCompletedComplaints = async () => {
    return apiRequest('/admin/complaints/completed');
};

// Get recently active complaints (latest 3)
export const getRecentActivityComplaints = async () => {
    return apiRequest('/admin/complaints/recent-activity');
};