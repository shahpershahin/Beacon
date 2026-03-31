const express = require('express');
const jwt = require('jsonwebtoken');
const StartupData = require('../models/StartupData');

const router = express.Router();

// Middleware to protect routes
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

// Get Dashboard Data
router.get('/', auth, async (req, res) => {
    try {
        let data = await StartupData.findOne({ $or: [{ user: req.user.id }, { teamMembers: req.user.id }] });
        if (!data) {
            data = new StartupData({ user: req.user.id, tasks: [], milestones: [], financials: {} });
            await data.save();
        }
        res.json(data);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Update Financials
router.post('/financials', auth, async (req, res) => {
    try {
        let data = await StartupData.findOne({ $or: [{ user: req.user.id }, { teamMembers: req.user.id }] });
        if (!data) data = new StartupData({ user: req.user.id });
        data.financials = { ...data.financials, ...req.body };
        await data.save();
        res.json(data.financials);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Add Task
router.post('/tasks', auth, async (req, res) => {
    try {
        let data = await StartupData.findOne({ $or: [{ user: req.user.id }, { teamMembers: req.user.id }] });
        if (!data) data = new StartupData({ user: req.user.id });
        data.tasks.push(req.body);
        await data.save();
        res.json(data.tasks);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Update Task
router.put('/tasks/:id', auth, async (req, res) => {
    try {
        let data = await StartupData.findOne({ $or: [{ user: req.user.id }, { teamMembers: req.user.id }] });
        const task = data.tasks.id(req.params.id);
        if (!task) return res.status(404).json({ message: 'Task not found' });
        Object.assign(task, req.body);
        await data.save();
        res.json(data.tasks);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Add Milestone
router.post('/milestones', auth, async (req, res) => {
    try {
        let data = await StartupData.findOne({ $or: [{ user: req.user.id }, { teamMembers: req.user.id }] });
        if (!data) data = new StartupData({ user: req.user.id });
        data.milestones.push(req.body);
        await data.save();
        res.json(data.milestones);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Update Milestone
router.put('/milestones/:id', auth, async (req, res) => {
    try {
        let data = await StartupData.findOne({ $or: [{ user: req.user.id }, { teamMembers: req.user.id }] });
        const milestone = data.milestones.id(req.params.id);
        if (!milestone) return res.status(404).json({ message: 'Milestone not found' });
        Object.assign(milestone, req.body);
        await data.save();
        res.json(data.milestones);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Invite Team Member
router.post('/invite', auth, async (req, res) => {
    try {
        const { email } = req.body;
        const member = await require('../models/User').findOne({ email });
        if (!member) return res.status(404).json({ message: 'User not found' });

        let data = await StartupData.findOne({ user: req.user.id });
        if (!data) return res.status(403).json({ message: 'Only the originally registered founder can invite members' });

        if (data.teamMembers.includes(member._id)) return res.status(400).json({ message: 'Already a team member' });

        data.teamMembers.push(member._id);
        await data.save();
        res.json({ message: 'Team member added!' });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
