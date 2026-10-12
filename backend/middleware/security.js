const logger = require('../utils/logger');

const detectSuspiciousTraffic = (req, res, next) => {
    const suspiciousPatterns = [
        /(\.\.\/|\.\.\\)/i, // Path traversal
        /(union\s+all\s+select|select\s+.*\s+from|insert\s+into|drop\s+table)/i, // SQL injection
        /(<script>|javascript:|onerror\s*=)/i, // XSS
        /(;\s*rm\s+-rf|;\s*wget|;\s*curl)/i // Command injection
    ];

    const checkString = (str) => {
        if (typeof str !== 'string') return false;
        return suspiciousPatterns.some(pattern => pattern.test(str));
    };

    const checkObject = (obj) => {
        if (!obj) return false;
        return Object.values(obj).some(val => {
            if (typeof val === 'string') return checkString(val);
            if (typeof val === 'object') return checkObject(val);
            return false;
        });
    };

    const isSuspicious = 
        checkString(req.originalUrl) || 
        checkObject(req.query) || 
        checkObject(req.body);

    if (isSuspicious) {
        logger.security('SUSPICIOUS_TRAFFIC_DETECTED', 'FLAGGED', req.ip, {
            url: req.originalUrl,
            method: req.method,
            userAgent: req.headers['user-agent'],
            query: req.query,
            body: req.body
        });
    }

    next();
};

module.exports = {
    detectSuspiciousTraffic
};
