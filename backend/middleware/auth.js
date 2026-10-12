const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
    const token = req.header('x-auth-token');
    if (!token) {
        return res.status(401).json({ message: 'No token, authorization denied' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Fetch user from DB to handle stale tokens, bans, deletions, or role changes
        const user = await User.findById(decoded.user.id);
        if (!user) {
            return res.status(401).json({ message: 'User does not exist, authorization denied' });
        }

        req.user = user;
        next();
    } catch (err) {
        return res.status(401).json({ message: 'Token is not valid' });
    }
};

const requireVerified = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ message: 'Authentication required' });
    }
    if (!req.user.isVerified) {
        return res.status(403).json({
            message: 'Your email address must be verified to perform this action.',
            code: 'EMAIL_UNVERIFIED',
            email: req.user.email
        });
    }
    next();
};

module.exports = {
    auth,
    requireVerified
};
