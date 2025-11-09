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

module.exports = router;
