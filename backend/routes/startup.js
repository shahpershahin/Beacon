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
        let data = await StartupData.findOne({ user: req.user.id });
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
        let data = await StartupData.findOne({ user: req.user.id });
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
        let data = await StartupData.findOne({ user: req.user.id });
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
        let data = await StartupData.findOne({ user: req.user.id });
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
        let data = await StartupData.findOne({ user: req.user.id });
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
        let data = await StartupData.findOne({ user: req.user.id });
        const milestone = data.milestones.id(req.params.id);
        if (!milestone) return res.status(404).json({ message: 'Milestone not found' });
        Object.assign(milestone, req.body);
        await data.save();
        res.json(data.milestones);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
