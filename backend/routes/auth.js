const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { OAuth2Client } = require('google-auth-library');

const router = express.Router();
// Create client but gracefully handle if ENV is missing (client id will be dummy)
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID || 'dummy');

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

// Register
router.post('/register', async (req, res) => {
    try {
        const { name, email, password, startupName } = req.body;
        let user = await User.findOne({ email });
        if (user) return res.status(400).json({ message: 'User already exists' });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        user = new User({ name, email, password: hashedPassword, startupName });
        await user.save();

        const payload = { user: { id: user.id } };
        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });

        res.status(201).json({ token, user: { id: user.id, name, email, startupName } });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

// Login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        let user = await User.findOne({ email });
        if (!user) return res.status(400).json({ message: 'Invalid Credentials' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: 'Invalid Credentials' });

        const payload = { user: { id: user.id } };
        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });

        res.json({ token, user: { id: user.id, name: user.name, email: user.email, startupName: user.startupName } });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

// Google OAuth Login / Register
router.post('/google', async (req, res) => {
    try {
        const { credential } = req.body;
        if (!process.env.GOOGLE_CLIENT_ID) {
            return res.status(500).json({ message: 'GOOGLE_CLIENT_ID is not configured in the backend environment.' });
        }

        const ticket = await client.verifyIdToken({
            idToken: credential,
            audience: process.env.GOOGLE_CLIENT_ID
        });

        const { email, name } = ticket.getPayload();

        let user = await User.findOne({ email });
        if (!user) {
            user = new User({
                email,
                name,
                password: await bcrypt.hash(Date.now().toString() + Math.random(), 10), // secure random dummy password
                startupName: name + "'s Workspace"
            });
            await user.save();
        }

        const payload = { user: { id: user.id } };
        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });

        res.json({ token, user: { id: user.id, name: user.name, email: user.email, startupName: user.startupName } });
    } catch (err) {
        res.status(401).json({ message: 'Invalid Google Token or Auth Error', error: err.message });
    }
});

// Update Profile
router.put('/profile', auth, async (req, res) => {
    try {
        const { name, password } = req.body;
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ message: 'User not found' });
        
        if (name) user.name = name;
        if (password) {
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(password, salt);
        }
        
        await user.save();
        res.json({ message: 'Profile updated successfully', user: { id: user.id, name: user.name, email: user.email, startupName: user.startupName } });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
