const express = require('express');
const { authenticate, requireRole } = require('../middleware/auth');
const Complaint = require('../models/Complaint');
const User = require('../models/User');

const router = express.Router();

// require admin for all routes
router.use(authenticate, requireRole('admin'));

// stats
router.get('/stats', async (req, res) => {
    try {
        const total = await Complaint.countDocuments();
        const pending = await Complaint.countDocuments({ status: 'pending' });
        const approved = await Complaint.countDocuments({ status: 'approved' });
        const rejected = await Complaint.countDocuments({ status: 'rejected' });
        const autoForwardedCount = await Complaint.countDocuments({ autoForwarded: true });

        // how many rejected by whom (group by last history entry if rejected)
        const rejectedByAgg = await Complaint.aggregate([
            { $match: { status: 'rejected' } },
            { $project: { last: { $arrayElemAt: ['$history', -1] } } },
            { $group: { _id: '$last.role', count: { $sum: 1 } } }
        ]);

        res.json({ total, pending, approved, rejected, autoForwarded: autoForwardedCount, rejectedBy: rejectedByAgg });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// list all complaints pagination
router.get('/complaints', async (req, res) => {
    const page = parseInt(req.query.page || '1');
    const per = parseInt(req.query.per || '50');
    const skip = (page - 1) * per;
    const list = await Complaint.find().sort({ createdAt: -1 }).skip(skip).limit(per);
    res.json(list);
});

// Helper function to enhance complaints with feedback and stage info
const enhanceComplaints = (complaints) => {
    return complaints.map(complaint => {
        const complaintObj = complaint.toObject();
        
        // Add approval/rejection reasons by role from history
        const approvalReasons = {};
        const rejectionReasons = {};
        
        complaint.history.forEach(entry => {
            if (entry.action === 'approved' && entry.role) {
                approvalReasons[entry.role] = entry.reason || null;
            } else if (entry.action === 'rejected' && entry.role) {
                rejectionReasons[entry.role] = entry.reason || null;
            }
        });
        
        // Determine current pending stage
        let currentPendingStage = null;
        if (complaintObj.status === 'pending') {
            currentPendingStage = complaintObj.stage;
        }
        
        return {
            ...complaintObj,
            approvalReasons: Object.keys(approvalReasons).length > 0 ? approvalReasons : null,
            rejectionReasons: Object.keys(rejectionReasons).length > 0 ? rejectionReasons : null,
            currentPendingStage: currentPendingStage
        };
    });
};

// complaints created by teachers
router.get('/complaints/by-teachers', async (req, res) => {
    try {
        const complaints = await Complaint.find({ createdByRole: 'teacher' })
            .populate('createdBy', 'name email role')
            .sort({ createdAt: -1 });
        
        const enhancedComplaints = enhanceComplaints(complaints);
        res.json(enhancedComplaints);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// complaints created by students
router.get('/complaints/by-students', async (req, res) => {
    try {
        const complaints = await Complaint.find({ createdByRole: 'student' })
            .populate('createdBy', 'name email role')
            .sort({ createdAt: -1 });
        
        const enhancedComplaints = enhanceComplaints(complaints);
        res.json(enhancedComplaints);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// all pending complaints
router.get('/complaints/pending', async (req, res) => {
    try {
        const complaints = await Complaint.find({ status: 'pending' })
            .populate('createdBy', 'name email role')
            .sort({ createdAt: -1 });
        
        const enhancedComplaints = enhanceComplaints(complaints);
        res.json(enhancedComplaints);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// all completed complaints (approved + rejected)
router.get('/complaints/completed', async (req, res) => {
    try {
        const complaints = await Complaint.find({ 
            status: { $in: ['approved', 'rejected'] }
        })
            .populate('createdBy', 'name email role')
            .sort({ createdAt: -1 });
        
        const enhancedComplaints = enhanceComplaints(complaints);
        res.json(enhancedComplaints);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// recently active complaints (latest 3 with recent history updates)
router.get('/complaints/recent-activity', async (req, res) => {
    try {
        const complaints = await Complaint.aggregate([
            {
                $addFields: {
                    lastActivity: { $arrayElemAt: ['$history.at', -1] }
                }
            },
            { $sort: { lastActivity: -1 } },
            { $limit: 3 },
            {
                $lookup: {
                    from: 'users',
                    localField: 'createdBy',
                    foreignField: '_id',
                    as: 'createdBy'
                }
            },
            {
                $unwind: '$createdBy'
            },
            {
                $project: {
                    'createdBy.password': 0
                }
            }
        ]);

        // Convert aggregation result to mongoose-like objects and enhance
        const complaintsWithMethods = complaints.map(complaint => ({
            ...complaint,
            toObject: () => complaint
        }));
        
        const enhancedComplaints = enhanceComplaints(complaintsWithMethods);
        res.json(enhancedComplaints);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
