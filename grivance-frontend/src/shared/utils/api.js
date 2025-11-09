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
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return await response.json();
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
export const approveComplaint = async (id) => {
    return apiRequest(`/complaints/${id}/approve`, {
        method: 'POST'
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