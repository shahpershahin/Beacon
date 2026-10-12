const rateLimit = require('express-rate-limit');
const logger = require('../utils/logger');

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // Limit each IP to 10 login attempts per 15 minutes
    message: { message: 'Too many login attempts from this IP, please try again after 15 minutes.' },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res, next, options) => {
        logger.security('RATE_LIMIT_EXCEEDED', 'BLOCKED', req.ip, { url: req.originalUrl, action: 'LOGIN' });
        res.status(options.statusCode).json(options.message);
    }
});

const registerLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5, // Limit each IP to 5 account creations per hour
    message: { message: 'Too many accounts created from this IP, please try again after an hour.' },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res, next, options) => {
        logger.security('RATE_LIMIT_EXCEEDED', 'BLOCKED', req.ip, { url: req.originalUrl, action: 'REGISTER' });
        res.status(options.statusCode).json(options.message);
    }
});

const aiLimiter = rateLimit({
    windowMs: 10 * 60 * 1000, // 10 minutes
    max: 10, // Limit each IP to 10 requests per 10 minutes
    message: { message: 'Too many AI requests from this IP, please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res, next, options) => {
        logger.security('RATE_LIMIT_EXCEEDED', 'BLOCKED', req.ip, { url: req.originalUrl, action: 'AI_GENERATION' });
        res.status(options.statusCode).json(options.message);
    }
});

const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 150, // Limit each IP to 150 requests per 15 minutes
    message: { message: 'Too many requests, please slow down.' },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res, next, options) => {
        logger.security('RATE_LIMIT_EXCEEDED', 'BLOCKED', req.ip, { url: req.originalUrl, action: 'GENERAL_API' });
        res.status(options.statusCode).json(options.message);
    }
});

module.exports = {
    loginLimiter,
    registerLimiter,
    aiLimiter,
    apiLimiter
};
