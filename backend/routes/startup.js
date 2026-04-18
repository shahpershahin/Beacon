const express = require('express');
const jwt = require('jsonwebtoken');
const StartupData = require('../models/StartupData');
const User = require('../models/User');
const { triggerSlackNotification } = require('../utils/slack');
const Stripe = require('stripe');

const router = express.Router();

const auth = (req, res, next) => {
    const token = req.header('x-auth-token');
    if (!token) return res.status(401).json({ message: 'No token, authorization denied' });
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded.user;
        next();
    } catch (err) {
        res.status(401).json({ message: 'Token is not valid' });
    }
};

const getAccessQuery = (userId) => {
    return { $or: [{ user: userId }, { 'teamMembers.user': userId }] };
};

const checkAdminAccess = (data, userId) => {
    if (data.user.toString() === userId) return true;
    const member = data.teamMembers.find(m => (m.user && m.user.toString() === userId) || m.toString() === userId);
    return member && member.role === 'Admin';
};

const checkHRAccess = (data, userId) => {
    if (data.user.toString() === userId) return true;
    const member = data.teamMembers.find(m => (m.user && m.user.toString() === userId) || m.toString() === userId);
    return member && (member.role === 'Admin' || member.role === 'HR');
};

// Get Dashboard Data
router.get('/', auth, async (req, res) => {
    try {
        let data = await StartupData.findOne(getAccessQuery(req.user.id))
            .populate('user', 'name email')
            .populate('tasks.assignee', 'name email')
            .populate('teamMembers.user', 'name email');

        if (!data) {
            data = new StartupData({ user: req.user.id, tasks: [], milestones: [], financials: {} });
            await data.save();
        }

        // Calculate role and department for the current user
        let userRole = 'Employee'; 
        let userDepartment = 'General';
        const currentUserId = req.user.id.toString();
        const ownerId = data.user.toString();

        if (ownerId === currentUserId) {
            userRole = 'Admin';
            userDepartment = 'General'; // Admins are master of all
        } else {
            const member = data.teamMembers.find(m => m.user && m.user.toString() === currentUserId);
            if (member) {
                userRole = member.role;
                userDepartment = member.department || 'General';
            }
        }

        // Get the actual user document to check for the 'founder' role key
        const userDoc = await User.findById(req.user.id);
        const physicsRole = userDoc ? userDoc.role : null;

        // Map team members to include populated user details at top level for component compatibility
        const populatedTeam = data.teamMembers.map(m => ({
            ...m.toObject(),
            name: m.user?.name || m.user?.email,
            email: m.user?.email
        }));

        res.json({ ...data.toObject(), teamMembers: populatedTeam, userRole, userDepartment, role: physicsRole });
    } catch (err) {
        console.error("GET /api/startup ERROR:", err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

// Update Financials (Admin Only)
router.post('/financials', auth, async (req, res) => {
    try {
        let data = await StartupData.findOne(getAccessQuery(req.user.id));
        if (!data) data = new StartupData({ user: req.user.id });

        if (!checkAdminAccess(data, req.user.id)) {
            return res.status(403).json({ message: 'RBAC: Admin role required to mutate financials' });
        }

        const oldRunway = data.financials.burnRate > 0 ? (data.financials.funding / data.financials.burnRate) : Infinity;
        data.financials = { ...data.financials, ...req.body };
        const newRunway = data.financials.burnRate > 0 ? (data.financials.funding / data.financials.burnRate) : Infinity;

        await data.save();
        if (req.io) req.io.emit('startup_updated', { startupId: data._id.toString() });

        if (newRunway < 6 && oldRunway >= 6 && data.integrations?.slackWebhookUrl) {
            await triggerSlackNotification(
                data.integrations.slackWebhookUrl, 
                `⚠️ *Critical Runway Alert*\nYour runway has dropped below 6 months (Current: ${newRunway.toFixed(1)} months). Time to review spending or start fundraising! 🚨`
            );
        }

        res.json(data.financials);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Add Task
router.post('/tasks', auth, async (req, res) => {
    try {
        let data = await StartupData.findOne(getAccessQuery(req.user.id));
        if (!data) data = new StartupData({ user: req.user.id });

        // RBAC: Check if user is Admin OR if the task department matches their own
        const isAdmin = data.user.toString() === req.user.id || 
                        data.teamMembers.some(m => m.user && m.user.toString() === req.user.id && m.role === 'Admin');
        
        const member = data.teamMembers.find(m => m.user && m.user.toString() === req.user.id);
        const userDept = member?.department || 'General';

        // If not admin, they can ONLY create tasks for their own department
        if (!isAdmin && req.body.department && req.body.department !== userDept) {
            return res.status(403).json({ message: `RBAC: You can only create tasks for your own department (${userDept})` });
        }

        data.tasks.push(req.body);
        await data.save();
        if (req.io) req.io.emit('startup_updated', { startupId: data._id.toString() });
        res.json(data.tasks);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Update Task
router.put('/tasks/:id', auth, async (req, res) => {
    try {
        let data = await StartupData.findOne(getAccessQuery(req.user.id));
        const task = data.tasks.id(req.params.id);
        if (!task) return res.status(404).json({ message: 'Task not found' });

        // RBAC: Check if user is Admin OR if the task department matches their own
        const isAdmin = data.user.toString() === req.user.id || 
                        data.teamMembers.some(m => m.user && m.user.toString() === req.user.id && m.role === 'Admin');
        
        const member = data.teamMembers.find(m => m.user && m.user.toString() === req.user.id);
        const userDept = member?.department || 'General';
        const taskDept = task.department || 'General';

        if (!isAdmin && taskDept !== userDept) {
            return res.status(403).json({ message: `RBAC: Cross-channel editing restricted. This task belongs to ${taskDept}.` });
        }

        Object.assign(task, req.body);
        await data.save();
        if (req.io) req.io.emit('startup_updated', { startupId: data._id.toString() });
        res.json(data.tasks);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Add Milestone
router.post('/milestones', auth, async (req, res) => {
    try {
        let data = await StartupData.findOne(getAccessQuery(req.user.id));
        if (!data) return res.status(404).json({ message: 'Startup not found' });

        if (!checkAdminAccess(data, req.user.id)) {
            return res.status(403).json({ message: 'RBAC: Admin role required to manage milestones' });
        }

        data.milestones.push(req.body);
        await data.save();
        if (req.io) req.io.emit('startup_updated', { startupId: data._id.toString() });
        res.json(data.milestones);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Update Milestone
router.put('/milestones/:id', auth, async (req, res) => {
    try {
        let data = await StartupData.findOne(getAccessQuery(req.user.id));
        const milestone = data.milestones.id(req.params.id);
        if (!milestone) return res.status(404).json({ message: 'Milestone not found' });

        if (!checkAdminAccess(data, req.user.id)) {
            return res.status(403).json({ message: 'RBAC: Admin role required to update milestones' });
        }

        const { achieved } = req.body;
        Object.assign(milestone, req.body);
        await data.save();

        if (req.io) req.io.emit('startup_updated', { startupId: data._id.toString() });

        if (achieved && data.integrations?.slackWebhookUrl) {
            await triggerSlackNotification(
                data.integrations.slackWebhookUrl, 
                `🎯 *Milestone Achieved!*\n"${milestone.title}" has been completed! 🚀`
            );
        }

        res.json(data.milestones);
    } catch (err) {
        console.error("Milestone Update Error:", err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update Integration Settings (Admin Only)
router.put('/integrations', auth, async (req, res) => {
    try {
        const { stripeKey, slackWebhookUrl } = req.body;
        const data = await StartupData.findOne(getAccessQuery(req.user.id));
        if (!data) return res.status(404).json({ message: 'Startup data not found' });

        if (!checkAdminAccess(data, req.user.id)) {
            return res.status(403).json({ message: 'RBAC: Admin role required' });
        }

        if (stripeKey !== undefined) data.integrations.stripeKey = stripeKey;
        if (slackWebhookUrl !== undefined) data.integrations.slackWebhookUrl = slackWebhookUrl;

        await data.save();
        res.json(data.integrations);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Sync Stripe Revenue (Admin Only)
router.post('/sync-stripe', auth, async (req, res) => {
    try {
        const data = await StartupData.findOne(getAccessQuery(req.user.id));
        if (!data || !data.integrations.stripeKey) {
            return res.status(400).json({ message: 'Stripe integration not configured' });
        }

        if (!checkAdminAccess(data, req.user.id)) {
            return res.status(403).json({ message: 'RBAC: Admin role required' });
        }

        const stripe = new Stripe(data.integrations.stripeKey);
        const charges = await stripe.charges.list({ limit: 100 });
        const totalRevenue = charges.data
            .filter(c => c.paid && !c.refunded)
            .reduce((acc, c) => acc + (c.amount / 100), 0);

        data.financials.revenue = totalRevenue;
        await data.save();

        if (req.io) req.io.emit('startup_updated', { startupId: data._id.toString() });
        
        if (data.integrations.slackWebhookUrl) {
            await triggerSlackNotification(data.integrations.slackWebhookUrl, `💰 *Stripe Sync Complete*\nRevenue updated to $${totalRevenue.toLocaleString()}`);
        }

        res.json({ success: true, revenue: totalRevenue });
    } catch (err) {
        res.status(500).json({ message: 'Stripe sync failed', error: err.message });
    }
});

// Invite Team Member (Admin Only)
router.post('/invite', auth, async (req, res) => {
    try {
        const { email, role = 'Viewer', jobTitle = 'Team Member', department = 'General' } = req.body;

        let data = await StartupData.findOne(getAccessQuery(req.user.id));
        if (!data) return res.status(404).json({ message: 'Startup not found' });

        if (!checkHRAccess(data, req.user.id)) {
            return res.status(403).json({ message: 'RBAC: Access denied. HR or Admin role required.' });
        }
        
        const User = require('../models/User');
        const inviter = await User.findById(req.user.id);
        
        let member = await User.findOne({ email });
        let tempPassword = null;

        if (!member) {
            tempPassword = '123456'; 
            const bcrypt = require('bcryptjs');
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(tempPassword, salt);
            
            member = new User({
                name: email.split('@')[0], 
                email,
                password: hashedPassword,
                startupName: inviter?.startupName || 'Partner Startup'
            });
            await member.save();
        }

        const isAlreadyMember = data.teamMembers.some(m => (m.user && m.user.toString() === member._id.toString()) || m.toString() === member._id.toString());
        if (isAlreadyMember) return res.status(400).json({ message: 'Already a team member' });

        data.teamMembers.push({ user: member._id, role, jobTitle, department });
        await data.save();
        res.json({ 
            message: 'Team member added with ' + role + ' role!',
            tempPassword 
        });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Update Team Member Role (Admin Only)
router.put('/members/:id', auth, async (req, res) => {
    try {
        let data = await StartupData.findOne(getAccessQuery(req.user.id));
        if (!data) return res.status(404).json({ message: 'Startup not found' });
        
        if (!checkHRAccess(data, req.user.id)) {
            return res.status(403).json({ message: 'RBAC: Access denied. HR or Admin role required.' });
        }
        
        const { role } = req.body;
        const memberId = req.params.id; // This is the user._id of the team member
        
        const memberIndex = data.teamMembers.findIndex(m => (m.user && m.user.toString() === memberId) || m.toString() === memberId);
        if (memberIndex === -1) return res.status(404).json({ message: 'Member not found in roster' });
        
        // Handle migration if they are still legacy flat array string
        if (!data.teamMembers[memberIndex].user) {
             data.teamMembers[memberIndex] = { user: memberId, role };
        } else {
             data.teamMembers[memberIndex].role = role;
        }
        
        await data.save();
        res.json({ message: 'Role updated successfully' });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Remove Team Member (Admin Only)
router.delete('/members/:id', auth, async (req, res) => {
    try {
        let data = await StartupData.findOne(getAccessQuery(req.user.id));
        if (!data) return res.status(404).json({ message: 'Startup not found' });
        
        if (!checkHRAccess(data, req.user.id)) {
            return res.status(403).json({ message: 'RBAC: Access denied. HR or Admin role required.' });
        }
        
        const memberId = req.params.id;
        
        const initialLen = data.teamMembers.length;
        data.teamMembers = data.teamMembers.filter(m => (m.user && m.user.toString() !== memberId) && m.toString() !== memberId);
        
        if (data.teamMembers.length === initialLen) return res.status(404).json({ message: 'Member not found in roster' });
        
        data.tasks.forEach(task => {
            if (task.assignee && task.assignee.toString() === memberId) {
                task.assignee = undefined;
            }
        });
        
        await data.save();
        res.json({ message: 'Member removed from workspace' });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Get team members for Assignment dropdowns
router.get('/members', auth, async (req, res) => {
    try {
        let data = await StartupData.findOne(getAccessQuery(req.user.id))
            .populate('user', 'name email')
            .populate('teamMembers.user', 'name email');

        if (!data) return res.json([]);

        const fullRoster = [];
        fullRoster.push({ _id: data.user._id, name: data.user.name, email: data.user.email, role: 'Founder' });

        data.teamMembers.forEach(m => {
            if (m.user) {
                fullRoster.push({ _id: m.user._id, name: m.user.name || m.user.email, email: m.user.email, role: m.role || 'Viewer', jobTitle: m.jobTitle });
            } else if (m._id) {
                fullRoster.push({ _id: m._id, name: m.name || m.email, email: m.email, role: 'Viewer', jobTitle: m.jobTitle });
            }
        });

        res.json(fullRoster);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Sprints Endpoints
router.post('/sprints', auth, async (req, res) => {
    try {
        let data = await StartupData.findOne(getAccessQuery(req.user.id));
        if (!data) return res.status(404).json({ message: 'Startup not found' });
        
        if (!checkAdminAccess(data, req.user.id)) {
            return res.status(403).json({ message: 'RBAC: Admin role required to manage sprints' });
        }

        if (req.body.active) {
            data.sprints.forEach(s => s.active = false);
        }
        
        data.sprints.push(req.body);
        await data.save();
        if (req.io) req.io.emit('startup_updated', { startupId: data._id.toString() });
        res.json(data.sprints);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

router.put('/sprints/:id', auth, async (req, res) => {
    try {
        let data = await StartupData.findOne(getAccessQuery(req.user.id));
        const sprint = data.sprints.id(req.params.id);
        if (!sprint) return res.status(404).json({ message: 'Sprint not found' });
        
        if (req.body.active === true) {
            data.sprints.forEach(s => s.active = false);
        }
        
        Object.assign(sprint, req.body);
        await data.save();
        if (req.io) req.io.emit('startup_updated', { startupId: data._id.toString() });
        res.json(data.sprints);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// CRM Contacts Endpoints
router.post('/contacts', auth, async (req, res) => {
    try {
        let data = await StartupData.findOne(getAccessQuery(req.user.id));
        if (!data) return res.status(404).json({ message: 'Startup not found' });
        
        if (!checkAdminAccess(data, req.user.id)) {
            return res.status(403).json({ message: 'RBAC: Admin role required to manage CRM' });
        }

        data.contacts.push(req.body);
        await data.save();
        if (req.io) req.io.emit('startup_updated', { startupId: data._id.toString() });
        res.json(data.contacts);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

router.put('/contacts/:id', auth, async (req, res) => {
    try {
        let data = await StartupData.findOne(getAccessQuery(req.user.id));
        const contact = data.contacts.id(req.params.id);
        if (!contact) return res.status(404).json({ message: 'Contact not found' });
        
        Object.assign(contact, req.body);
        contact.updatedAt = Date.now();
        await data.save();
        if (req.io) req.io.emit('startup_updated', { startupId: data._id.toString() });
        res.json(data.contacts);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

router.delete('/contacts/:id', auth, async (req, res) => {
    try {
        let data = await StartupData.findOne(getAccessQuery(req.user.id));
        data.contacts.pull(req.params.id);
        await data.save();
        if (req.io) req.io.emit('startup_updated', { startupId: data._id.toString() });
        res.json(data.contacts);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
