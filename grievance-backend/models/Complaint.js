const mongoose = require('mongoose');

const historyEntry = new mongoose.Schema({
  by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  role: String,
  actorEmail: String,
  action: { type: String, enum: ['created','forwarded','approved','rejected','commented','auto-forwarded'] },
  comment: String,
  reason: String,
  at: { type: Date, default: Date.now }
}, { _id: false });

const complaintSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  category: { type: String, default: 'other' }, // free string or use enum if you want
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdByRole: { type: String },           // snapshot: 'student'|'teacher'
  stage: { type: String, enum: ['teacher','hod','principal','done','rejected'], default: 'teacher' },
  status: { type: String, enum: ['pending','approved','rejected'], default: 'pending' },
  history: [historyEntry],
  responseDueAt: { type: Date },             // when current stage's response is due
  autoForwarded: { type: Boolean, default: false }
}, { timestamps: true });

complaintSchema.index({ stage: 1, status: 1, createdAt: -1 });
complaintSchema.index({ createdBy: 1, createdAt: -1 });

module.exports = mongoose.model('Complaint', complaintSchema);
