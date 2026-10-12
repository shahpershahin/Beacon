const mongoose = require('mongoose');

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const isValidEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return typeof email === 'string' && re.test(email);
};

const sanitizeString = (str) => {
    if (typeof str !== 'string') return '';
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;');
};

const validateRegister = (req, res, next) => {
    let { name, email, password, startupName } = req.body;
    if (!name || typeof name !== 'string' || name.trim().length < 2) {
        return res.status(400).json({ message: 'Invalid name (must be at least 2 characters).' });
    }
    if (!isValidEmail(email)) {
        return res.status(400).json({ message: 'Invalid email address.' });
    }
    if (!password || typeof password !== 'string' || password.length < 6) {
        return res.status(400).json({ message: 'Invalid password (must be at least 6 characters).' });
    }
    if (startupName && typeof startupName !== 'string') {
        return res.status(400).json({ message: 'Invalid startup name.' });
    }

    req.body.name = sanitizeString(name.trim());
    req.body.email = email.trim().toLowerCase();
    if (startupName) req.body.startupName = sanitizeString(startupName.trim());
    next();
};

const validateLogin = (req, res, next) => {
    let { email, password } = req.body;
    if (!isValidEmail(email)) {
        return res.status(400).json({ message: 'Invalid credentials format.' });
    }
    if (!password || typeof password !== 'string') {
        return res.status(400).json({ message: 'Invalid credentials format.' });
    }
    req.body.email = email.trim().toLowerCase();
    next();
};

const validateObjectIdParam = (paramName) => (req, res, next) => {
    const id = req.params[paramName];
    if (!isValidObjectId(id)) {
        return res.status(400).json({ message: `Invalid resource identifier: ${paramName}` });
    }
    next();
};

const sanitizeBodyStrings = (req, res, next) => {
    if (req.body && typeof req.body === 'object') {
        for (const key in req.body) {
            if (typeof req.body[key] === 'string') {
                req.body[key] = sanitizeString(req.body[key]);
            }
        }
    }
    next();
};

module.exports = {
    isValidObjectId,
    isValidEmail,
    sanitizeString,
    validateRegister,
    validateLogin,
    validateObjectIdParam,
    sanitizeBodyStrings
};
