const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  passwordHash: { type: String, required: true },
  role: { 
    type: String, 
    enum: ['student', 'teacher', 'hod', 'principal', 'admin'], 
    required: true 
  },
  // optional: for mapping student -> teacher relationship
  teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, 
  notifications: [{
    text: String,
    read: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
