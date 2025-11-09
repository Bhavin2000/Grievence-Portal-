const express = require('express');
const { authenticate, requireRole } = require('../middleware/auth');
const Complaint = require('../models/Complaint');
const User = require('../models/User');

const router = express.Router();

function computeDueDate(days) {
    const d = new Date();
    d.setDate(d.getDate() + Number(days));
    return d;
}

// Create complaint (students or teachers can create)
router.post('/', authenticate, async (req, res) => {
    try {
        const { title, description, category } = req.body;

        const initialStage = (req.user.role === 'teacher') ? 'hod' : 'teacher';
        const createdByRole = req.user.role;

        // use HOD_RESPONSE_DAYS for stage = hod, but for teacher stage you may want different days (reuse same)
        const hodDays = process.env.HOD_RESPONSE_DAYS || 3;
        const responseDueAt = initialStage === 'hod' ? computeDueDate(hodDays) : null;

        const complaint = await Complaint.create({
            title,
            description,
            category: category || 'other',
            createdBy: req.user._id,
            createdByRole,
            stage: initialStage,
            responseDueAt,
            history: [{
                by: req.user._id,
                role: req.user.role,
                actorEmail: req.user.email,
                action: 'created',
                comment: description
            }]
        });

        res.status(201).json(complaint);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// GET /api/complaints/inbox?category=Workload
router.get('/inbox', authenticate, async (req, res) => {
  try {
    const { category } = req.query;
    const baseFilter = { status: 'pending' };

    if (req.user.role === 'admin') {
      // admins see all pending (optionally filter category)
      if (category) baseFilter.category = category;
      const list = await Complaint.find(baseFilter).sort({ createdAt: -1 });
      return res.json(list);
    }

    const role = req.user.role;
    if (!['teacher','hod','principal'].includes(role)) return res.json([]);

    baseFilter.stage = role;
    if (category) baseFilter.category = category;

    const list = await Complaint.find(baseFilter).sort({ createdAt: -1 });
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});



router.get('/mine', authenticate, async (req, res) => {
    try {
        const list = await Complaint.find({ createdBy: req.user._id }).sort({ createdAt: -1 });
        res.json(list);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get complaint (owner, currentAssignee, admin can view)
router.get('/:id', authenticate, async (req, res) => {
    try {
        const c = await Complaint.findById(req.params.id).populate('createdBy', 'name email role').populate('history.by', 'name role');
        if (!c) return res.status(404).json({ message: 'Not found' });
        const allowed = (c.createdBy._id.equals(req.user._id) || (c.currentAssignee && c.currentAssignee.equals(req.user._id)) || req.user.role === 'admin');
        if (!allowed) return res.status(403).json({ message: 'Forbidden' });
        res.json(c);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Approve (role-based): teacher -> hod -> principal -> done
router.post('/:id/approve', authenticate, async (req, res) => {
    try {
        const complaint = await Complaint.findById(req.params.id);
        const hodDays = Number(process.env.HOD_RESPONSE_DAYS || 3);
        if (!complaint) return res.status(404).json({ message: 'Not found' });

        const role = req.user.role;
        const stage = complaint.stage;
        const okStage = (stage === 'teacher' && role === 'teacher') ||
            (stage === 'hod' && role === 'hod') ||
            (stage === 'principal' && role === 'principal');
        if (!okStage) return res.status(403).json({ message: 'You can’t approve at this stage' });

        // add history with actor email
        complaint.history.push({
            by: req.user._id,
            role,
            actorEmail: req.user.email,
            action: 'approved'
        });

        if (stage === 'teacher') {
            complaint.stage = 'hod';
            complaint.responseDueAt = computeDueDate(hodDays);
        } else if (stage === 'hod') {
            complaint.stage = 'principal';
            complaint.responseDueAt = null;
        } else if (stage === 'principal') {
            complaint.stage = 'done';
            complaint.status = 'approved';
            complaint.responseDueAt = null;
        }

        await complaint.save();

        // notify creator with who approved
        const creator = await User.findById(complaint.createdBy);
        if (creator) {
            creator.notifications.push({ text: `Your complaint "${complaint.title}" was approved by ${role} (${req.user.email}).` });
            await creator.save();
        }

        res.json(complaint);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});


// Reject (must provide reason)
router.post('/:id/reject', authenticate, async (req, res) => {
    try {
        const { reason } = req.body;
        if (!reason) return res.status(400).json({ message: 'Reject reason required' });

        const complaint = await Complaint.findById(req.params.id);
        if (!complaint) return res.status(404).json({ message: 'Not found' });

        const role = req.user.role;
        const stage = complaint.stage;
        const okStage = (stage === 'teacher' && role === 'teacher') ||
            (stage === 'hod' && role === 'hod') ||
            (stage === 'principal' && role === 'principal');
        if (!okStage) return res.status(403).json({ message: 'You can’t reject at this stage' });

        complaint.stage = 'rejected';
        complaint.status = 'rejected';
        complaint.responseDueAt = null;
        complaint.history.push({
            by: req.user._id,
            role,
            actorEmail: req.user.email,
            action: 'rejected',
            reason
        });

        await complaint.save();

        const creator = await User.findById(complaint.createdBy);
        if (creator) {
            creator.notifications.push({ text: `Your complaint "${complaint.title}" was rejected by ${role} (${req.user.email}): ${reason}` });
            await creator.save();
        }

        res.json(complaint);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});


// List complaints for a user (their created complaints or assigned)
router.get('/', authenticate, async (req, res) => {
    try {
        const q = {};
        if (req.user.role === 'admin') {
            // admin: see all
        } else {
            // students: show own
            // teacher/hod/principal: show those assigned to them + their own created
            q.$or = [
                { createdBy: req.user._id },
                { currentAssignee: req.user._id }
            ];
        }
        const list = await Complaint.find(q).sort({ createdAt: -1 }).limit(200);
        res.json(list);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Add comment (anyone involved)
router.post('/:id/comment', authenticate, async (req, res) => {
    try {
        const { comment } = req.body;
        if (!comment) return res.status(400).json({ message: 'Comment required' });
        const complaint = await Complaint.findById(req.params.id);
        if (!complaint) return res.status(404).json({ message: 'Not found' });

        // allowed if creator, currentAssignee, or admin
        const allowed = complaint.createdBy.equals(req.user._id) || (complaint.currentAssignee && complaint.currentAssignee.equals(req.user._id)) || req.user.role === 'admin';
        if (!allowed) return res.status(403).json({ message: 'Forbidden' });

        complaint.history.push({ by: req.user._id, role: req.user.role, action: 'commented', comment });
        await complaint.save();

        // notify creator and assignee
        const creator = await User.findById(complaint.createdBy);
        if (creator) {
            creator.notifications.push({ text: `New comment on "${complaint.title}"` });
            await creator.save();
        }
        if (complaint.currentAssignee) {
            const ass = await User.findById(complaint.currentAssignee);
            if (ass) { ass.notifications.push({ text: `New comment on complaint "${complaint.title}"` }); await ass.save(); }
        }

        res.json(complaint);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});


router.get('/:id/track', authenticate, async (req, res) => {
    try {
        const c = await Complaint.findById(req.params.id)
            .populate('createdBy', 'name email role')
            .populate('history.by', 'name email role');

        if (!c) return res.status(404).json({ message: 'Not found' });

        // visibility: creator can always see; role members can see if at/was at their stage; admin sees all
        const isCreator = c.createdBy._id.equals(req.user._id);
        const isPrivilegedRole = ['teacher', 'hod', 'principal', 'admin'].includes(req.user.role);
        if (!isCreator && !isPrivilegedRole) return res.status(403).json({ message: 'Forbidden' });

        res.json(c);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.get('/raised/by-role/:role', authenticate, async (req, res) => {
    const role = req.params.role; // 'student' or 'teacher'
    if (!['student', 'teacher'].includes(role)) return res.status(400).json({ message: 'invalid role' });

    try {
        const list = await Complaint.find()
            .populate('createdBy', 'role')
            .sort({ createdAt: -1 });

        const filtered = list.filter(c => c.createdBy?.role === role && c.createdBy._id.equals(req.user._id));
        res.json(filtered);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});


module.exports = router;
