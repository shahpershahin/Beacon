const express = require('express');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { OAuth2Client } = require('google-auth-library');
const { auth } = require('../middleware/auth');
const { sendVerificationEmail, sendPasswordResetEmail } = require('../utils/email');
const logger = require('../utils/logger');
const { loginLimiter, registerLimiter } = require('../middleware/rateLimiter');
const { validateRegister, validateLogin } = require('../middleware/validation');

const router = express.Router();
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID || 'dummy');

// Register
router.post('/register', registerLimiter, validateRegister, async (req, res) => {
    try {
        const { name, email, password, startupName } = req.body;
        let user = await User.findOne({ email });
        if (user) {
            logger.security('REGISTRATION_FAILURE', 'FAILED', req.ip, { email, reason: 'user_exists' });
            return res.status(400).json({ message: 'User already exists' });
        }

        const verificationToken = crypto.randomBytes(32).toString('hex');
        const verificationTokenExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

        user = new User({ 
            name, 
            email, 
            password, // Hook automatically hashes this
            startupName,
            isVerified: false,
            verificationToken,
            verificationTokenExpires
        });
        await user.save();

        // Send Verification Email
        await sendVerificationEmail(
            user.email, 
            verificationToken, 
            process.env.FRONTEND_URL || 'http://localhost:3000'
        );

        const payload = { user: { id: user.id } };
        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '24h' });

        logger.security('REGISTRATION_SUCCESS', 'SUCCESS', req.ip, { email });

        res.status(201).json({ 
            token, 
            user: { 
                id: user.id, 
                name: user.name, 
                email: user.email, 
                startupName: user.startupName,
                isVerified: user.isVerified
            } 
        });
    } catch (err) {
        console.error('Registration Error:', err);
        logger.security('REGISTRATION_ERROR', 'FAILED', req.ip, { email, error: err.message });
        res.status(500).json({ message: 'Server error' });
    }
});

// Login
router.post('/login', loginLimiter, validateLogin, async (req, res) => {
    const { email, password } = req.body || {};
    try {
        let user = await User.findOne({ email });
        if (!user) {
            logger.security('LOGIN_FAILURE', 'FAILED', req.ip, { email, reason: 'user_not_found' });
            return res.status(400).json({ message: 'Invalid Credentials' });
        }

        // Lockout Check
        if (user.isLocked()) {
            logger.security('LOGIN_FAILURE', 'LOCKED_COOLDOWN', req.ip, { email });
            return res.status(423).json({ 
                message: 'Account temporarily locked due to too many failed attempts. Cooldown active. Please try again later.' 
            });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            await user.incLoginAttempts();
            // Fetch updated doc to check if newly locked
            const updatedUser = await User.findById(user._id);
            if (updatedUser.isLocked()) {
                logger.security('ACCOUNT_LOCKOUT', 'LOCKED', req.ip, { email });
                return res.status(423).json({ 
                    message: 'Account locked due to 5 consecutive failed attempts. Cooldown active for 15 minutes.' 
                });
            }
            logger.security('LOGIN_FAILURE', 'FAILED', req.ip, { email, reason: 'password_mismatch' });
            return res.status(400).json({ message: 'Invalid Credentials' });
        }

        // Successful validation
        await user.resetAttempts();

        const payload = { user: { id: user.id } };
        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '24h' });

        logger.security('LOGIN_SUCCESS', 'SUCCESS', req.ip, { email, userId: user.id });

        res.json({ 
            token, 
            user: { 
                id: user.id, 
                name: user.name, 
                email: user.email, 
                startupName: user.startupName,
                role: user.role || 'founder',
                isVerified: user.isVerified
            } 
        });
    } catch (err) {
        console.error('Login Error:', err);
        logger.security('LOGIN_ERROR', 'FAILED', req.ip, { email, error: err.message });
        res.status(500).json({ message: 'Server error' });
    }
});

// Google OAuth Login / Register
router.post('/google', loginLimiter, async (req, res) => {
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
        const isNewUser = !user;

        if (isNewUser) {
            // Google users are automatically verified
            user = new User({
                email,
                name,
                password: crypto.randomBytes(16).toString('hex'), // Let mongoose hook hash this
                startupName: name + "'s Workspace",
                isVerified: true
            });
            await user.save();
        }

        const payload = { user: { id: user.id } };
        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '24h' });

        res.json({ 
            token, 
            user: { 
                id: user.id, 
                name: user.name, 
                email: user.email, 
                role: user.role || 'founder',
                startupName: user.startupName,
                isVerified: user.isVerified
            },
            isNewUser
        });
    } catch (err) {
        console.error("GOOGLE AUTH ERROR:", err);
        res.status(500).json({ message: 'Invalid Google Token or Auth Error' });
    }
});

// Verify Email
router.get('/verify-email/:token', async (req, res) => {
    try {
        const user = await User.findOne({
            verificationToken: req.params.token,
            verificationTokenExpires: { $gt: Date.now() }
        });

        if (!user) {
            logger.security('EMAIL_VERIFICATION_FAILURE', 'FAILED', req.ip, { token: req.params.token });
            return res.status(400).json({ message: 'Invalid or expired verification token.' });
        }

        user.isVerified = true;
        user.verificationToken = undefined;
        user.verificationTokenExpires = undefined;
        await user.save();

        logger.security('EMAIL_VERIFICATION_SUCCESS', 'SUCCESS', req.ip, { userId: user.id, email: user.email });

        res.json({ message: 'Email verified successfully!' });
    } catch (err) {
        console.error('Verify Email Error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Resend Verification Email
router.post('/resend-verification', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        if (user.isVerified) {
            return res.status(400).json({ message: 'Email is already verified.' });
        }

        const token = crypto.randomBytes(32).toString('hex');
        user.verificationToken = token;
        user.verificationTokenExpires = Date.now() + 24 * 60 * 60 * 1000;
        await user.save();

        await sendVerificationEmail(
            user.email, 
            token, 
            process.env.FRONTEND_URL || 'http://localhost:3000'
        );

        res.json({ message: 'Verification email sent successfully.' });
    } catch (err) {
        console.error('Resend Verification Error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Forgot Password Request
router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });

        // Safe defense: return success message even if email is not in DB to prevent enum
        if (!user) {
            logger.security('PASSWORD_RESET_REQUESTED_UNREGISTERED', 'SUCCESS', req.ip, { email });
            return res.json({ message: 'If that email exists in our system, a password recovery link has been sent.' });
        }

        const token = crypto.randomBytes(32).toString('hex');
        user.resetPasswordToken = token;
        user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
        await user.save();

        await sendPasswordResetEmail(
            user.email, 
            token, 
            process.env.FRONTEND_URL || 'http://localhost:3000'
        );

        logger.security('PASSWORD_RESET_REQUESTED', 'SUCCESS', req.ip, { email, userId: user.id });

        res.json({ message: 'If that email exists in our system, a password recovery link has been sent.' });
    } catch (err) {
        console.error('Forgot Password Error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Reset Password
router.post('/reset-password/:token', async (req, res) => {
    try {
        const user = await User.findOne({
            resetPasswordToken: req.params.token,
            resetPasswordExpires: { $gt: Date.now() }
        });

        if (!user) {
            logger.security('PASSWORD_RESET_FAILURE', 'FAILED', req.ip, { token: req.params.token });
            return res.status(400).json({ message: 'Invalid or expired reset token.' });
        }

        // Pre-save hook will automatically hash the new password
        user.password = req.body.password;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        
        // Reset lockout parameters in case they were locked out
        user.loginAttempts = 0;
        user.lockUntil = undefined;
        
        await user.save();

        logger.security('PASSWORD_RESET_SUCCESS', 'SUCCESS', req.ip, { userId: user.id, email: user.email });

        res.json({ message: 'Password reset successfully.' });
    } catch (err) {
        console.error('Reset Password Error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get User Profile
router.get('/profile', auth, async (req, res) => {
    try {
        // req.user is already loaded by auth middleware!
        const user = await User.findById(req.user.id).select('-password');
        res.json(user);
    } catch (err) {
        console.error('Get Profile Error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update User Profile
router.put('/update', auth, async (req, res) => {
    try {
        const { name, startupName, password } = req.body;
        const user = await User.findById(req.user.id);
        
        if (name) user.name = name;
        if (startupName) user.startupName = startupName;
        if (password) {
            user.password = password; // Pre-save hook will automatically hash it
        }
        
        await user.save();
        res.json({
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            startupName: user.startupName,
            isVerified: user.isVerified
        });
    } catch (err) {
        console.error('Update Profile Error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
