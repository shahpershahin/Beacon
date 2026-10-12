const express = require('express');
const StartupData = require('../models/StartupData');
const User = require('../models/User');
const { triggerSlackNotification } = require('../utils/slack');
const Stripe = require('stripe');
const { auth, requireVerified } = require('../middleware/auth');
const { validateObjectIdParam, sanitizeBodyStrings } = require('../middleware/validation');

const router = express.Router();

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

const logActivity = (data, userId, action, detail) => {
    if (!data.activities) data.activities = [];
    data.activities.unshift({ user: userId, action, detail });
    if (data.activities.length > 50) data.activities = data.activities.slice(0, 50); // Keep last 50
};

// Automation Rules Engine
const evaluateAutomations = async (triggerEvent, data, payload) => {
    if (!data.automations) return;
    const rules = data.automations.filter(a => a.active && a.trigger === triggerEvent);
    
    for (let rule of rules) {
        if (rule.action === 'CREATE_ONBOARDING_TASKS' && triggerEvent === 'USER_INVITED') {
            const newUserId = payload.newUserId;
            if (newUserId) {
                data.tasks.push({ title: 'Set up your workstation profile', status: 'pending', department: payload.department || 'General', assignee: newUserId });
                data.tasks.push({ title: 'Review Company Readme / Docs', status: 'pending', department: payload.department || 'General', assignee: newUserId });
                logActivity(data, newUserId, 'triggered automation', 'Assigned onboarding flow');
            }
        }
        
        if (rule.action === 'SLACK_ALERT' && triggerEvent === 'TASK_COMPLETED') {
            if (data.integrations?.slackWebhookUrl) {
                // Fire and forget (don't await to avoid blocking response)
                triggerSlackNotification(
                    data.integrations.slackWebhookUrl, 
                    `✅ *Task Completed*\n${payload.title}`
                ).catch(e => console.error("Auto-Slack failed", e));
            }
        }
    }
};

// Get Dashboard Data
router.get('/', auth, async (req, res) => {
    try {
        let data = await StartupData.findOne(getAccessQuery(req.user.id))
            .populate('user', 'name email')
            .populate('tasks.assignee', 'name email')
            .populate('tasks.comments.user', 'name email')
            .populate('activities.user', 'name email')
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
        res.status(500).json({ message: 'Server error' });
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

        const oldRunway = data.financials.burnRate > 0 ? ((data.financials.cashInBank || data.financials.funding) / data.financials.burnRate) : Infinity;
        data.financials = { ...data.financials, ...req.body };
        const newRunway = data.financials.burnRate > 0 ? ((data.financials.cashInBank || data.financials.funding) / data.financials.burnRate) : Infinity;

        // Push memory event
        if (!data.memoryEvents) data.memoryEvents = [];
        data.memoryEvents.push({
            type: 'financial',
            title: 'Financials Updated',
            detail: `Cash in Bank: $${data.financials.cashInBank || 0}, Burn Rate: $${data.financials.burnRate || 0}/mo, Revenue: $${data.financials.revenue || 0}/mo`
        });

        await data.save();
        logActivity(data, req.user.id, 'updated financials', `Target Burn: $${data.financials.burnRate}`);
        
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

// --- GOALS Section ---
router.get('/goals', auth, async (req, res) => {
    try {
        let data = await StartupData.findOne(getAccessQuery(req.user.id));
        res.json(data?.goals || []);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

router.post('/goals', auth, sanitizeBodyStrings, async (req, res) => {
    try {
        let data = await StartupData.findOne(getAccessQuery(req.user.id));
        if (!data) data = new StartupData({ user: req.user.id });
        
        if (!checkAdminAccess(data, req.user.id)) {
            return res.status(403).json({ message: 'RBAC: Admin role required to create goals' });
        }

        data.goals.push(req.body);
        await data.save();
        if (req.io) req.io.emit('startup_updated', { startupId: data._id.toString() });
        res.json(data.goals);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

router.put('/goals/:id', auth, validateObjectIdParam('id'), sanitizeBodyStrings, async (req, res) => {
    try {
        let data = await StartupData.findOne(getAccessQuery(req.user.id));
        if (!data) return res.status(404).json({ message: 'Startup not found' });
        const goal = data.goals.id(req.params.id);
        if (!goal) return res.status(404).json({ message: 'Goal not found' });

        if (!checkAdminAccess(data, req.user.id)) {
            return res.status(403).json({ message: 'RBAC: Admin role required' });
        }

        Object.assign(goal, req.body);
        await data.save();
        if (req.io) req.io.emit('startup_updated', { startupId: data._id.toString() });
        res.json(data.goals);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

router.delete('/goals/:id', auth, validateObjectIdParam('id'), async (req, res) => {
    try {
        let data = await StartupData.findOne(getAccessQuery(req.user.id));
        if (!data) return res.status(404).json({ message: 'Startup not found' });
        data.goals.pull(req.params.id);
        
        // Cleanup links
        data.milestones.forEach(m => {
            if (m.goalId && m.goalId.toString() === req.params.id) m.goalId = undefined;
        });

        await data.save();
        if (req.io) req.io.emit('startup_updated', { startupId: data._id.toString() });
        res.json(data.goals);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

router.post('/tasks', auth, requireVerified, sanitizeBodyStrings, async (req, res) => {
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
        logActivity(data, req.user.id, 'created task', req.body.title);
        
        await data.save();
        if (req.io) req.io.emit('startup_updated', { startupId: data._id.toString() });
        res.json(data.tasks);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Update Task
router.put('/tasks/:id', auth, validateObjectIdParam('id'), sanitizeBodyStrings, async (req, res) => {
    try {
        let data = await StartupData.findOne(getAccessQuery(req.user.id));
        if (!data) return res.status(404).json({ message: 'Startup not found' });
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

        const statusChanged = req.body.status && req.body.status !== task.status;
        Object.assign(task, req.body);
        
        if (statusChanged && task.status === 'completed') {
            logActivity(data, req.user.id, 'completed task', task.title);
            if (!data.memoryEvents) data.memoryEvents = [];
            data.memoryEvents.push({
                type: 'task',
                title: `Task Completed: ${task.title}`,
                detail: `Completed by ${req.user.name || 'team member'}`,
                sourceId: task._id
            });
            // --- TRIGGER AUTOMATION ENGINE ---
            await evaluateAutomations('TASK_COMPLETED', data, { taskId: task._id, title: task.title, assignee: task.assignee });
        }

        await data.save();
        if (req.io) {
            req.io.emit('startup_updated', { startupId: data._id.toString() });
            if (statusChanged && task.status === 'completed') {
                req.io.emit('notification', { message: `${req.user.name || 'Teammate'} completed "${task.title}"` });
            }
        }
        res.json(data.tasks);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Add Task Comment (Built-in Communication Layer)
router.post('/tasks/:id/comments', auth, validateObjectIdParam('id'), sanitizeBodyStrings, async (req, res) => {
    try {
        let data = await StartupData.findOne(getAccessQuery(req.user.id));
        if (!data) return res.status(404).json({ message: 'Startup not found' });

        const task = data.tasks.id(req.params.id);
        if (!task) return res.status(404).json({ message: 'Task not found' });

        const newComment = {
            user: req.user.id,
            text: req.body.text
        };

        if (!task.comments) task.comments = [];
        task.comments.push(newComment);
        
        // Log activity for adding comment
        logActivity(data, req.user.id, 'left a comment on task', task.title);

        await data.save();
        
        // Trigger socket update for the specific task chat
        if (req.io) {
            req.io.emit('startup_updated', { startupId: data._id.toString() });
            req.io.emit('notification', { message: `${req.user.name || 'Teammate'} commented on "${task.title}"` });
        }

        res.json(task.comments);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// --- Task Document Links ---
router.post('/tasks/:id/docs', auth, validateObjectIdParam('id'), sanitizeBodyStrings, async (req, res) => {
    try {
        let data = await StartupData.findOne(getAccessQuery(req.user.id));
        if (!data) return res.status(404).json({ message: 'Startup not found' });

        const task = data.tasks.id(req.params.id);
        if (!task) return res.status(404).json({ message: 'Task not found' });

        const newDocLink = {
            _id: req.body.docId, // Use the MongoDB object ID of the doc
            title: req.body.title // Cache the title so the task board doesn't need to join Document schema
        };

        if (!task.linkedDocs) task.linkedDocs = [];
        // Prevent duplicates
        if (!task.linkedDocs.some(d => d._id.toString() === req.body.docId)) {
            task.linkedDocs.push(newDocLink);
            logActivity(data, req.user.id, 'attached a document to task', task.title);
            await data.save();
            if (req.io) req.io.emit('startup_updated', { startupId: data._id.toString() });
        }

        res.json(task.linkedDocs);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Add Milestone
router.post('/milestones', auth, requireVerified, sanitizeBodyStrings, async (req, res) => {
    try {
        let data = await StartupData.findOne(getAccessQuery(req.user.id));
        if (!data) return res.status(404).json({ message: 'Startup not found' });

        if (!checkAdminAccess(data, req.user.id)) {
            return res.status(403).json({ message: 'RBAC: Admin role required to manage milestones' });
        }

        data.milestones.push(req.body);
        logActivity(data, req.user.id, 'planted milestone', req.body.title);
        
        await data.save();
        if (req.io) req.io.emit('startup_updated', { startupId: data._id.toString() });
        res.json(data.milestones);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Update Milestone
router.put('/milestones/:id', auth, validateObjectIdParam('id'), sanitizeBodyStrings, async (req, res) => {
    try {
        let data = await StartupData.findOne(getAccessQuery(req.user.id));
        if (!data) return res.status(404).json({ message: 'Startup not found' });
        const milestone = data.milestones.id(req.params.id);
        if (!milestone) return res.status(404).json({ message: 'Milestone not found' });

        if (!checkAdminAccess(data, req.user.id)) {
            return res.status(403).json({ message: 'RBAC: Admin role required to update milestones' });
        }

        const { achieved } = req.body;
        const newlyAchieved = achieved && !milestone.achieved;
        
        Object.assign(milestone, req.body);
        
        if (newlyAchieved) {
            logActivity(data, req.user.id, 'achieved milestone', milestone.title);
            if (!data.memoryEvents) data.memoryEvents = [];
            data.memoryEvents.push({
                type: 'milestone',
                title: `Milestone Achieved: ${milestone.title}`,
                detail: milestone.description || '',
                sourceId: milestone._id
            });
        }
        
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
        res.status(500).json({ message: 'Stripe sync failed' });
    }
});

// Invite Team Member (Admin Only)
router.post('/invite', auth, requireVerified, async (req, res) => {
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
            
            member = new User({
                name: email.split('@')[0], 
                email,
                password: tempPassword,
                startupName: inviter?.startupName || 'Partner Startup'
            });
            await member.save();
        }

        const isAlreadyMember = data.teamMembers.some(m => (m.user && m.user.toString() === member._id.toString()) || m.toString() === member._id.toString());
        if (isAlreadyMember) return res.status(400).json({ message: 'Already a team member' });

        data.teamMembers.push({ user: member._id, role, jobTitle, department });
        
        // Push memory event
        if (!data.memoryEvents) data.memoryEvents = [];
        data.memoryEvents.push({
            type: 'team',
            title: `Team Member Invited: ${member.name || email}`,
            detail: `Role: ${role}, Title: ${jobTitle}, Department: ${department}`,
            sourceId: member._id
        });

        // --- TRIGGER AUTOMATION ENGINE ---
        await evaluateAutomations('USER_INVITED', data, { newUserId: member._id, department });

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
router.put('/members/:id', auth, validateObjectIdParam('id'), sanitizeBodyStrings, async (req, res) => {
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
router.delete('/members/:id', auth, requireVerified, validateObjectIdParam('id'), async (req, res) => {
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
        const addedIds = new Set();
        
        fullRoster.push({ _id: data.user._id, name: data.user.name, email: data.user.email, role: 'Founder' });
        addedIds.add(data.user._id.toString());

        data.teamMembers.forEach(m => {
            const memberId = m.user ? m.user._id?.toString() : m._id?.toString();
            if (memberId && !addedIds.has(memberId)) {
                addedIds.add(memberId);
                if (m.user) {
                    fullRoster.push({ _id: m.user._id, name: m.user.name || m.user.email, email: m.user.email, role: m.role || 'Viewer', jobTitle: m.jobTitle });
                } else if (m._id) {
                    fullRoster.push({ _id: m._id, name: m.name || m.email, email: m.email, role: 'Viewer', jobTitle: m.jobTitle });
                }
            }
        });

        res.json(fullRoster);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Sprints Endpoints
router.post('/sprints', auth, sanitizeBodyStrings, async (req, res) => {
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

router.put('/sprints/:id', auth, validateObjectIdParam('id'), sanitizeBodyStrings, async (req, res) => {
    try {
        let data = await StartupData.findOne(getAccessQuery(req.user.id));
        if (!data) return res.status(404).json({ message: 'Startup not found' });
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
router.post('/contacts', auth, sanitizeBodyStrings, async (req, res) => {
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

router.put('/contacts/:id', auth, validateObjectIdParam('id'), sanitizeBodyStrings, async (req, res) => {
    try {
        let data = await StartupData.findOne(getAccessQuery(req.user.id));
        if (!data) return res.status(404).json({ message: 'Startup not found' });
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

router.delete('/contacts/:id', auth, validateObjectIdParam('id'), async (req, res) => {
    try {
        let data = await StartupData.findOne(getAccessQuery(req.user.id));
        if (!data) return res.status(404).json({ message: 'Startup not found' });
        data.contacts.pull(req.params.id);
        await data.save();
        if (req.io) req.io.emit('startup_updated', { startupId: data._id.toString() });
        res.json(data.contacts);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Automations Endpoints (Admin Only)
router.get('/automations', auth, async (req, res) => {
    try {
        let data = await StartupData.findOne(getAccessQuery(req.user.id));
        res.json(data?.automations || []);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

router.post('/automations', auth, sanitizeBodyStrings, async (req, res) => {
    try {
        let data = await StartupData.findOne(getAccessQuery(req.user.id));
        if (!data) return res.status(404).json({ message: 'Startup not found' });
        
        if (!checkAdminAccess(data, req.user.id)) {
            return res.status(403).json({ message: 'RBAC: Admin role required' });
        }

        data.automations.push(req.body);
        await data.save();
        if (req.io) req.io.emit('startup_updated', { startupId: data._id.toString() });
        res.json(data.automations);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

router.delete('/automations/:id', auth, validateObjectIdParam('id'), async (req, res) => {
    try {
        let data = await StartupData.findOne(getAccessQuery(req.user.id));
        if (!data) return res.status(404).json({ message: 'Startup not found' });
        if (!checkAdminAccess(data, req.user.id)) {
            return res.status(403).json({ message: 'RBAC: Admin role required' });
        }
        
        data.automations.pull(req.params.id);
        await data.save();
        if (req.io) req.io.emit('startup_updated', { startupId: data._id.toString() });
        res.json(data.automations);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// --- DECISION JOURNAL CRUD ---
router.post('/decisions', auth, requireVerified, sanitizeBodyStrings, async (req, res) => {
    try {
        let data = await StartupData.findOne(getAccessQuery(req.user.id));
        if (!data) return res.status(404).json({ message: 'Startup not found' });
        
        if (!checkAdminAccess(data, req.user.id)) {
            return res.status(403).json({ message: 'RBAC: Admin role required to create decisions' });
        }

        const decision = {
            ...req.body,
            author: req.user.id
        };
        if (!data.decisions) data.decisions = [];
        data.decisions.push(decision);
        const savedDecision = data.decisions[data.decisions.length - 1];

        // Push memory event
        if (!data.memoryEvents) data.memoryEvents = [];
        data.memoryEvents.push({
            type: 'decision',
            title: `Decision Tracked: ${req.body.title}`,
            detail: `Category: ${req.body.category || 'General'}. Context: ${req.body.context}. Confidence: ${req.body.confidenceScore || 50}%. Expected Outcome: ${req.body.expectedOutcome}. Review Date: ${new Date(req.body.reviewDate).toLocaleDateString()}`,
            sourceId: savedDecision._id
        });

        await data.save();
        if (req.io) req.io.emit('startup_updated', { startupId: data._id.toString() });
        res.json(data.decisions);
    } catch (err) {
        console.error("Create Decision Error:", err);
        res.status(500).json({ message: 'Server error' });
    }
});

router.put('/decisions/:id', auth, validateObjectIdParam('id'), sanitizeBodyStrings, async (req, res) => {
    try {
        let data = await StartupData.findOne(getAccessQuery(req.user.id));
        if (!data) return res.status(404).json({ message: 'Startup not found' });

        if (!checkAdminAccess(data, req.user.id)) {
            return res.status(403).json({ message: 'RBAC: Admin role required' });
        }

        const decision = data.decisions.id(req.params.id);
        if (!decision) return res.status(404).json({ message: 'Decision not found' });

        const statusChanged = req.body.status && req.body.status !== decision.status;
        Object.assign(decision, req.body);

        if (statusChanged || req.body.actualOutcome || req.body.lessonLearned) {
            if (!data.memoryEvents) data.memoryEvents = [];
            data.memoryEvents.push({
                type: 'decision',
                title: `Decision Evaluated: ${decision.title}`,
                detail: `Status: ${decision.status}. Actual Outcome: ${decision.actualOutcome || 'None'}. Lesson: ${decision.lessonLearned || 'None'}. Revenue Impact: ${decision.impactRevenue || 0}%, Runway Impact: ${decision.impactRunway || 0}m, Velocity Impact: ${decision.impactVelocity || 0}%`,
                sourceId: decision._id
            });
        }

        await data.save();
        if (req.io) req.io.emit('startup_updated', { startupId: data._id.toString() });
        res.json(data.decisions);
    } catch (err) {
        console.error("Update Decision Error:", err);
        res.status(500).json({ message: 'Server error' });
    }
});

router.delete('/decisions/:id', auth, validateObjectIdParam('id'), async (req, res) => {
    try {
        let data = await StartupData.findOne(getAccessQuery(req.user.id));
        if (!data) return res.status(404).json({ message: 'Startup not found' });

        if (!checkAdminAccess(data, req.user.id)) {
            return res.status(403).json({ message: 'RBAC: Admin role required' });
        }

        data.decisions.pull(req.params.id);
        
        // Cleanup memoryEvents referencing this decision
        if (data.memoryEvents) {
            data.memoryEvents = data.memoryEvents.filter(e => !e.sourceId || e.sourceId.toString() !== req.params.id);
        }

        await data.save();
        if (req.io) req.io.emit('startup_updated', { startupId: data._id.toString() });
        res.json(data.decisions);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// --- TIMELINE ENDPOINT ---
router.get('/memory-events', auth, async (req, res) => {
    try {
        const data = await StartupData.findOne(getAccessQuery(req.user.id));
        if (!data) return res.json([]);
        const sortedEvents = (data.memoryEvents || []).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        res.json(sortedEvents);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// --- GLOBAL SEARCH ENDPOINT ---
router.get('/search', auth, async (req, res) => {
    try {
        const { q = '' } = req.query;
        const data = await StartupData.findOne(getAccessQuery(req.user.id));
        if (!data) return res.status(404).json({ message: 'Startup not found' });

        const queryLower = q.toLowerCase();

        // Search tasks
        const matchingTasks = (data.tasks || []).filter(t => 
            t.title.toLowerCase().includes(queryLower) ||
            (t.comments && t.comments.some(c => c.text.toLowerCase().includes(queryLower)))
        ).map(t => ({ id: t._id, type: 'task', title: t.title, subtitle: `Status: ${t.status} | Dept: ${t.department}` }));

        // Search milestones
        const matchingMilestones = (data.milestones || []).filter(m => 
            m.title.toLowerCase().includes(queryLower) ||
            (m.description && m.description.toLowerCase().includes(queryLower))
        ).map(m => ({ id: m._id, type: 'milestone', title: m.title, subtitle: m.description || 'No description' }));

        // Search decisions
        const matchingDecisions = (data.decisions || []).filter(d => 
            d.title.toLowerCase().includes(queryLower) ||
            d.context.toLowerCase().includes(queryLower) ||
            (d.expectedOutcome && d.expectedOutcome.toLowerCase().includes(queryLower)) ||
            (d.actualOutcome && d.actualOutcome.toLowerCase().includes(queryLower)) ||
            (d.lessonLearned && d.lessonLearned.toLowerCase().includes(queryLower))
        ).map(d => ({ id: d._id, type: 'decision', title: d.title, subtitle: `Category: ${d.category} | Status: ${d.status}` }));

        // Search contacts
        const matchingContacts = (data.contacts || []).filter(c => 
            c.name.toLowerCase().includes(queryLower) ||
            (c.company && c.company.toLowerCase().includes(queryLower)) ||
            (c.lastNote && c.lastNote.toLowerCase().includes(queryLower))
        ).map(c => ({ id: c._id, type: 'contact', title: c.name, subtitle: `${c.type} | Company: ${c.company || 'N/A'}` }));

        // Search documents (Wiki docs)
        const Document = require('../models/Document');
        const docs = await Document.find({ startup: data._id });
        const matchingDocs = docs.filter(doc => 
            doc.title.toLowerCase().includes(queryLower) ||
            doc.content.toLowerCase().includes(queryLower)
        ).map(doc => ({ id: doc._id, type: 'wiki', title: doc.title, subtitle: `Category: ${doc.category || 'General'}` }));

        res.json({
            tasks: matchingTasks,
            milestones: matchingMilestones,
            decisions: matchingDecisions,
            contacts: matchingContacts,
            wiki: matchingDocs
        });
    } catch (err) {
        console.error("Search Error:", err);
        res.status(500).json({ message: 'Server error' });
    }
});

// --- DEPLOY BLUEPRINT ENDPOINT ---
router.post('/deploy-blueprint', auth, requireVerified, async (req, res) => {
    try {
        const { tasks = [], milestones = [] } = req.body;
        const data = await StartupData.findOne(getAccessQuery(req.user.id));
        if (!data) return res.status(404).json({ message: 'Startup not found' });

        if (!checkAdminAccess(data, req.user.id)) {
            return res.status(403).json({ message: 'RBAC: Admin role required to deploy blueprints' });
        }

        // Deploy milestones
        for (let m of milestones) {
            data.milestones.push({
                title: m.title,
                description: m.description || '',
                achieved: false,
                targetDate: m.daysFromStart ? new Date(Date.now() + m.daysFromStart * 24 * 60 * 60 * 1000) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
            });
        }

        // Deploy tasks
        for (let t of tasks) {
            data.tasks.push({
                title: t.title,
                status: 'pending',
                department: t.department || 'General',
                dueDate: t.daysFromStart ? new Date(Date.now() + t.daysFromStart * 24 * 60 * 60 * 1000) : undefined
            });
        }

        logActivity(data, req.user.id, 'deployed blueprint', `${tasks.length} tasks and ${milestones.length} milestones created.`);

        if (!data.memoryEvents) data.memoryEvents = [];
        data.memoryEvents.push({
            type: 'milestone',
            title: `Blueprint Deployed`,
            detail: `Added ${tasks.length} tasks and ${milestones.length} milestones to the startup workspace.`
        });

        await data.save();
        if (req.io) req.io.emit('startup_updated', { startupId: data._id.toString() });
        res.json({ success: true });
    } catch (err) {
        console.error("Deploy Blueprint Error:", err);
        res.status(500).json({ message: 'Server error' });
    }
});

// --- SEED PREMIUM DEMO DATA ENDPOINT ---
router.post('/seed', auth, async (req, res) => {
    try {
        let data = await StartupData.findOne({ user: req.user.id });
        if (data) {
            await StartupData.deleteOne({ _id: data._id });
        }
        
        data = new StartupData({
            user: req.user.id,
            financials: {
                cashInBank: 2400000,
                burnRate: 130000,
                revenue: 25000,
                funding: 2500000
            },
            tasks: [
                {
                    title: "Prepare Series A pitch deck & financials",
                    status: "pending",
                    department: "General",
                    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
                },
                {
                    title: "Refactor core authentication flow",
                    status: "completed",
                    department: "Engineering",
                    dueDate: new Date()
                },
                {
                    title: "Design main product dashboard visual system",
                    status: "in-progress",
                    department: "Design",
                    dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
                }
            ],
            milestones: [
                {
                    title: "Close seed funding round",
                    achieved: true,
                    targetDate: new Date()
                },
                {
                    title: "Launch public beta release",
                    achieved: false,
                    targetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
                }
            ],
            decisions: [
                {
                    title: "Adjust subscription tier pricing model",
                    context: "Need higher margins to sustain paid customer acquisition scaling.",
                    expectedOutcome: "Boost monthly ARPU by 20% with minimal customer churn.",
                    confidenceScore: 85,
                    category: "Pricing",
                    status: "Success",
                    reviewDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
                    actualOutcome: "ARPU increased by 22% with close to zero churn.",
                    lessonLearned: "Customers are less price sensitive than we originally modeled.",
                    impactRevenue: 22,
                    impactRunway: 3,
                    impactVelocity: 0
                },
                {
                    title: "Hire lead product designer",
                    context: "Product flow is too clunky and visual design lacks premium feel.",
                    expectedOutcome: "Accelerate frontend sprint velocity and improve signup conversion.",
                    confidenceScore: 70,
                    category: "Hiring",
                    status: "Pending",
                    reviewDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000)
                }
            ],
            memoryEvents: [
                {
                    type: "milestone",
                    title: "Seed funding round closed ($2.5M raised)",
                    detail: "Workspace data initialized with seed round milestones.",
                    timestamp: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
                },
                {
                    type: "decision",
                    title: "Adjust subscription tier pricing model",
                    detail: "Logged pricing optimization choice in journal.",
                    timestamp: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000)
                },
                {
                    type: "financial",
                    title: "Runway Adjusted to 18.4 Months",
                    detail: "Cash in Bank: $2,400,000, Burn Rate: $130,000/mo, Revenue: $25,000/mo",
                    timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
                }
            ],
            activities: [
                {
                    action: "system",
                    detail: "Welcome to Beacon Startup OS command center."
                }
            ]
        });

        await data.save();
        if (req.io) req.io.emit('startup_updated', { startupId: data._id.toString() });
        res.json({ success: true, message: "Workspace seeded with demo data" });
    } catch (err) {
        console.error("Seed Data Error:", err);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
