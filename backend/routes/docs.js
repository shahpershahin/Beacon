const express = require('express');
const Document = require('../models/Document');
const StartupData = require('../models/StartupData');
const router = express.Router();
const jwt = require('jsonwebtoken');

// Middleware to get current user startup
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

const getStartupId = async (userId) => {
    // Check if user is owner
    let startup = await StartupData.findOne({ user: userId });
    if (!startup) {
        // Check if user is team member
        startup = await StartupData.findOne({ 'teamMembers.user': userId });
    }
    return startup?._id;
};

// Get all documents for startup
router.get('/', auth, async (req, res) => {
    try {
        const startupId = await getStartupId(req.user.id);
        if (!startupId) return res.status(404).json({ message: 'Startup not found' });

        const documents = await Document.find({ startup: startupId })
            .populate('author', 'name')
            .sort({ updatedAt: -1 });
        res.json(documents);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Create document
router.post('/', auth, async (req, res) => {
    try {
        const { title, content, category, tags, linkedTasks, linkedMilestones } = req.body;
        const startupId = await getStartupId(req.user.id);
        if (!startupId) return res.status(404).json({ message: 'Startup not found' });

        const newDoc = new Document({
            startup: startupId,
            author: req.user.id,
            title,
            content,
            category,
            tags,
            linkedTasks,
            linkedMilestones
        });

        await newDoc.save();
        res.status(201).json(newDoc);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Update document
router.put('/:id', auth, async (req, res) => {
    try {
        const { title, content, category, tags, linkedTasks, linkedMilestones } = req.body;
        const startupId = await getStartupId(req.user.id);
        
        const doc = await Document.findOne({ _id: req.params.id, startup: startupId });
        if (!doc) return res.status(404).json({ message: 'Document not found' });

        // Save to version history before updating
        doc.versionHistory.push({
            content: doc.content,
            updatedBy: req.user.id,
            updatedAt: Date.now()
        });

        if (title) doc.title = title;
        if (content) doc.content = content;
        if (category) doc.category = category;
        if (tags) doc.tags = tags;
        if (linkedTasks) doc.linkedTasks = linkedTasks;
        if (linkedMilestones) doc.linkedMilestones = linkedMilestones;

        await doc.save();
        res.json(doc);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete document
router.delete('/:id', auth, async (req, res) => {
    try {
        const startupId = await getStartupId(req.user.id);
        const doc = await Document.findOneAndDelete({ _id: req.params.id, startup: startupId });
        if (!doc) return res.status(404).json({ message: 'Document not found' });
        res.json({ message: 'Document deleted' });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
