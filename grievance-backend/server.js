// server.js
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const complaintRoutes = require('./routes/complaints');
const adminRoutes = require('./routes/admin');

const app = express();
app.use(cors());
app.use(express.json());

const Complaint = require('./models/Complaint');
const User = require('./models/User');

function startScheduler() {
    const intervalMinutes = Number(process.env.CHECK_INTERVAL_MINUTES || 15);
    const ms = intervalMinutes * 60 * 1000;

    setInterval(async () => {
        try {
            const now = new Date();
            // find stale hod complaints
            const stale = await Complaint.find({
                stage: 'hod',
                status: 'pending',
                responseDueAt: { $lte: now },
                autoForwarded: false
            });

            if (!stale.length) return;

            for (const complaint of stale) {
                // mark as forwarded to principal
                complaint.history.push({
                    role: 'system',
                    actorEmail: 'system@auto',
                    action: 'auto-forwarded',
                    comment: `Auto-forwarded after HOD no-response till ${complaint.responseDueAt}`
                });

                complaint.stage = 'principal';
                complaint.autoForwarded = true;
                complaint.responseDueAt = null; // or set for principal if you want

                await complaint.save();

                // notify principals (all principals)
                const principals = await User.find({ role: 'principal' });
                for (const p of principals) {
                    p.notifications.push({ text: `Complaint "${complaint.title}" was auto-forwarded to Principal (no HOD response).` });
                    await p.save();
                }

                // notify creator
                const creator = await User.findById(complaint.createdBy);
                if (creator) {
                    creator.notifications.push({ text: `Your complaint "${complaint.title}" was auto-forwarded to Principal because HOD didn't respond in time.` });
                    await creator.save();
                }
            }
        } catch (err) {
            console.error('Scheduler error', err);
        }
    }, ms);
}


// Connect to MongoDB first
(async function connectDB() {
    try {
        await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true, useUnifiedTopology: true
        });
        console.log('MongoDB connected');
        // Start server only after DB connection
        const PORT = process.env.PORT || 4000;
        app.listen(PORT, () => console.log(`Server running on ${PORT}`));
        startScheduler();
    } catch (err) {
        console.error('Failed to connect to MongoDB', err);
        process.exit(1);
    }
})();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/complaints', complaintRoutes);l
app.use('/api/admin', adminRoutes);

// Basic health
app.get('/', (req, res) => res.send('Grievance backend OK'));
