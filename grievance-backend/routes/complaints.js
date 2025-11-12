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
      const list = await Complaint.find(baseFilter).populate('createdBy', 'name email role').sort({ createdAt: -1 });
      
      // Add time left for auto-approve and reasons for admin view
      const listWithTimeLeft = list.map(complaint => {
        const complaintObj = complaint.toObject();
        if (complaint.responseDueAt) {
          const now = new Date();
          const timeLeft = complaint.responseDueAt - now;
          complaintObj.timeLeftForAutoApprove = timeLeft > 0 ? Math.ceil(timeLeft / (1000 * 60 * 60 * 24)) : 0; // days left
          complaintObj.isOverdue = timeLeft <= 0;
        } else {
          complaintObj.timeLeftForAutoApprove = null;
          complaintObj.isOverdue = false;
        }

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
        
        complaintObj.approvalReasons = Object.keys(approvalReasons).length > 0 ? approvalReasons : null;
        complaintObj.rejectionReasons = Object.keys(rejectionReasons).length > 0 ? rejectionReasons : null;

        return complaintObj;
      });
      
      return res.json(listWithTimeLeft);
    }

    const role = req.user.role;
    if (!['teacher','hod','principal'].includes(role)) return res.json([]);

    baseFilter.stage = role;
    if (category) baseFilter.category = category;

    const list = await Complaint.find(baseFilter).populate('createdBy', 'name email role').sort({ createdAt: -1 });
    
    // Add time left for auto-approve and reasons for role-based view
    const listWithTimeLeft = list.map(complaint => {
      const complaintObj = complaint.toObject();
      if (complaint.responseDueAt) {
        const now = new Date();
        const timeLeft = complaint.responseDueAt - now;
        complaintObj.timeLeftForAutoApprove = timeLeft > 0 ? Math.ceil(timeLeft / (1000 * 60 * 60 * 24)) : 0; // days left
        complaintObj.isOverdue = timeLeft <= 0;
      } else {
        complaintObj.timeLeftForAutoApprove = null;
        complaintObj.isOverdue = false;
      }

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
      
      complaintObj.approvalReasons = Object.keys(approvalReasons).length > 0 ? approvalReasons : null;
      complaintObj.rejectionReasons = Object.keys(rejectionReasons).length > 0 ? rejectionReasons : null;

      return complaintObj;
    });
    
    res.json(listWithTimeLeft);
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

// Get complaints forwarded/approved by current user
router.get('/forwarded-by-me', authenticate, async (req, res) => {
    try {
        const complaints = await Complaint.find({
            'history.by': req.user._id,
            'history.action': 'approved'
        })
        .populate('createdBy', 'name email role')
        .populate('history.by', 'name email role')
        .sort({ createdAt: -1 });

        // Filter to only include complaints where this user actually approved
        const filtered = complaints.filter(complaint => 
            complaint.history.some(entry => 
                entry.by && entry.by._id.equals(req.user._id) && entry.action === 'approved'
            )
        );

        // Add the approval details to each complaint
        const result = filtered.map(complaint => {
            const approvalEntry = complaint.history.find(entry => 
                entry.by && entry.by._id.equals(req.user._id) && entry.action === 'approved'
            );

            // Check if this was auto-approved by HOD
            const isAutoApprovedByHod = complaint.history.some(entry => 
                entry.action === 'auto-forwarded' && entry.role === 'hod'
            );

            // Add approval/rejection reasons by role from history
            const complaintObj = complaint.toObject();
            const approvalReasons = {};
            const rejectionReasons = {};
            
            complaint.history.forEach(entry => {
              if (entry.action === 'approved' && entry.role) {
                approvalReasons[entry.role] = entry.reason || null;
              } else if (entry.action === 'rejected' && entry.role) {
                rejectionReasons[entry.role] = entry.reason || null;
              }
            });
            
            return {
                ...complaintObj,
                approvalReasons: Object.keys(approvalReasons).length > 0 ? approvalReasons : null,
                rejectionReasons: Object.keys(rejectionReasons).length > 0 ? rejectionReasons : null,
                isAutoApprovedByHod: isAutoApprovedByHod
            };
        });

        res.json(result);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get complaints rejected by current user
router.get('/rejected-by-me', authenticate, async (req, res) => {
    try {
        const complaints = await Complaint.find({
            'history.by': req.user._id,
            'history.action': 'rejected'
        })
        .populate('createdBy', 'name email role')
        .populate('history.by', 'name email role')
        .sort({ createdAt: -1 });

        // Filter to only include complaints where this user actually rejected
        const filtered = complaints.filter(complaint => 
            complaint.history.some(entry => 
                entry.by && entry.by._id.equals(req.user._id) && entry.action === 'rejected'
            )
        );

        // Add the rejection details to each complaint
        const result = filtered.map(complaint => {
            const rejectionEntry = complaint.history.find(entry => 
                entry.by && entry.by._id.equals(req.user._id) && entry.action === 'rejected'
            );

            // Add approval/rejection reasons by role from history
            const complaintObj = complaint.toObject();
            const approvalReasons = {};
            const rejectionReasons = {};
            
            complaint.history.forEach(entry => {
              if (entry.action === 'approved' && entry.role) {
                approvalReasons[entry.role] = entry.reason || null;
              } else if (entry.action === 'rejected' && entry.role) {
                rejectionReasons[entry.role] = entry.reason || null;
              }
            });
            
            return {
                ...complaintObj,
                myRejectionDetails: {
                    rejectedAt: rejectionEntry.at,
                    reason: rejectionEntry.reason,
                    myRole: rejectionEntry.role
                },
                approvalReasons: Object.keys(approvalReasons).length > 0 ? approvalReasons : null,
                rejectionReasons: Object.keys(rejectionReasons).length > 0 ? rejectionReasons : null
            };
        });

        res.json(result);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get complaints auto-approved by current user
router.get('/auto-approved-by-me', authenticate, async (req, res) => {
    try {
        const complaints = await Complaint.find({
            'history.by': req.user._id,
            'history.action': 'auto-forwarded'
        })
        .populate('createdBy', 'name email role')
        .populate('history.by', 'name email role')
        .sort({ createdAt: -1 });

        // Filter to only include complaints where this user actually auto-forwarded
        const filtered = complaints.filter(complaint => 
            complaint.history.some(entry => 
                entry.by && entry.by._id.equals(req.user._id) && entry.action === 'auto-forwarded'
            )
        );

        // Add the auto-approval details to each complaint
        const result = filtered.map(complaint => {
            const autoForwardEntry = complaint.history.find(entry => 
                entry.by && entry.by._id.equals(req.user._id) && entry.action === 'auto-forwarded'
            );
            
            return {
                ...complaint.toObject(),
                myAutoApprovalDetails: {
                    autoForwardedAt: autoForwardEntry.at,
                    reason: autoForwardEntry.reason || 'Auto-forwarded due to response deadline',
                    myRole: autoForwardEntry.role,
                    comment: autoForwardEntry.comment
                }
            };
        });

        res.json(result);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get complaints that were approved by current user but later rejected by next stage
router.get('/my-approvals-later-rejected', authenticate, async (req, res) => {
    try {
        // Find complaints where:
        // 1. Current user approved them
        // 2. The complaint was later rejected
        const complaints = await Complaint.find({
            'history.by': req.user._id,
            'history.action': 'approved',
            'status': 'rejected'
        })
        .populate('createdBy', 'name email role')
        .populate('history.by', 'name email role')
        .sort({ createdAt: -1 });

        // Filter and add details about both approval and rejection
        const result = [];
        
        for (const complaint of complaints) {
            // Find my approval entry
            const myApprovalEntry = complaint.history.find(entry => 
                entry.by && entry.by._id.equals(req.user._id) && entry.action === 'approved'
            );

            if (!myApprovalEntry) continue;

            // Find the rejection entry that happened after my approval
            const rejectionEntry = complaint.history.find(entry => 
                entry.action === 'rejected' && entry.at > myApprovalEntry.at
            );

            if (rejectionEntry) {
                result.push({
                    ...complaint.toObject(),
                    myApprovalDetails: {
                        approvedAt: myApprovalEntry.at,
                        reason: myApprovalEntry.reason,
                        myRole: myApprovalEntry.role
                    },
                    laterRejectionDetails: {
                        rejectedAt: rejectionEntry.at,
                        rejectedBy: rejectionEntry.by,
                        rejectedByRole: rejectionEntry.role,
                        rejectedByEmail: rejectionEntry.actorEmail,
                        rejectionReason: rejectionEntry.reason
                    }
                });
            }
        }

        res.json(result);
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
        const { reason } = req.body; // Optional reason for approval
        const complaint = await Complaint.findById(req.params.id);
        const hodDays = Number(process.env.HOD_RESPONSE_DAYS || 3);
        if (!complaint) return res.status(404).json({ message: 'Not found' });

        const role = req.user.role;
        const stage = complaint.stage;
        const okStage = (stage === 'teacher' && role === 'teacher') ||
            (stage === 'hod' && role === 'hod') ||
            (stage === 'principal' && role === 'principal');
        if (!okStage) return res.status(403).json({ message: 'You can’t approve at this stage' });

        // add history with actor email and optional reason
        const historyEntry = {
            by: req.user._id,
            role,
            actorEmail: req.user.email,
            action: 'approved'
        };
        if (reason) {
            historyEntry.reason = reason;
        }
        complaint.history.push(historyEntry);

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

        // notify creator with who approved and optional reason
        const creator = await User.findById(complaint.createdBy);
        if (creator) {
            const reasonText = reason ? ` with reason: ${reason}` : '';
            creator.notifications.push({ text: `Your complaint "${complaint.title}" was approved by ${role} (${req.user.email})${reasonText}.` });
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


module.exports = router;
