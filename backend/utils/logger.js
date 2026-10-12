const fs = require('fs');
const path = require('path');

const logDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir);
}

const writeLog = (level, message, meta = {}) => {
    const timestamp = new Date().toISOString();
    const logEntry = JSON.stringify({ timestamp, level, message, ...meta }) + '\n';
    
    // Console log for stdout log aggregators
    const colorCode = level === 'error' ? '\x1b[31m' : level === 'security' ? '\x1b[33m' : '\x1b[36m';
    const resetCode = '\x1b[0m';
    console.log(`${colorCode}[${level.toUpperCase()}]${resetCode} [${timestamp}] ${message}`, Object.keys(meta).length ? JSON.stringify(meta) : '');
    
    // Append to level-specific audit log file
    fs.appendFile(path.join(logDir, `${level}.log`), logEntry, (err) => {
        if (err) {
            console.error('❌ Failed to write log file:', err.message);
        }
    });
};

const logger = {
    info: (msg, meta) => writeLog('info', msg, meta),
    warn: (msg, meta) => writeLog('warn', msg, meta),
    error: (msg, meta) => writeLog('error', msg, meta),
    security: (action, status, ip, details = {}) => {
        writeLog('security', `SECURITY EVENT: ${action} [${status}]`, { action, status, ip, ...details });
    }
};

module.exports = logger;
