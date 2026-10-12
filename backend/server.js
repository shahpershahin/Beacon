const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const logger = require('./utils/logger');
const { detectSuspiciousTraffic } = require('./middleware/security');
const { apiLimiter, aiLimiter } = require('./middleware/rateLimiter');

const authRoutes = require('./routes/auth');
const startupRoutes = require('./routes/startup');
const aiRoutes = require('./routes/ai');
const docRoutes = require('./routes/docs');

const app = express();
const PORT = process.env.PORT || 5001;

// Enforce HTTPS in production environments
app.use((req, res, next) => {
  if (process.env.NODE_ENV === 'production' && req.headers['x-forwarded-proto'] !== 'https') {
    return res.redirect(`https://${req.headers.host}${req.url}`);
  }
  next();
});

// Enable Helmet security headers (allow Google OAuth popups postMessage)
app.use(helmet({
  crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" }
}));

// WebSocket Integration Pipeline
const http = require('http');
const { Server } = require('socket.io');
const server = http.createServer(app);

const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:3002',
  'https://trybeacon.vercel.app',
  process.env.FRONTEND_URL 
].filter(Boolean);

const io = new Server(server, {
  cors: { 
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true
  }
});

app.use((req, res, next) => {
  req.io = io; // Hook broadcaster natively into API chain
  next();
});

io.on('connection', (socket) => {
  socket.on('join_startup', (startupId) => {
     socket.join(startupId);
  });
});

// Rate limiting definitions migrated to middleware/rateLimiter.js

// CORS and global Middlewares
app.use(cors({
  origin: allowedOrigins,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-auth-token'],
  credentials: true
}));
app.use(express.json());
app.use(detectSuspiciousTraffic);

// Routes
app.use('/api/auth', apiLimiter, authRoutes);
app.use('/api/startup', apiLimiter, startupRoutes);
app.use('/api/ai', aiLimiter, aiRoutes);
app.use('/api/docs', apiLimiter, docRoutes);

app.get('/', (req, res) => {
  res.send('Startup Dashboard API Running (Sockets Enabled)');
});

app.get('/health', (req, res) => {
  const isDbConnected = mongoose.connection.readyState === 1;
  res.status(isDbConnected ? 200 : 503).json({
    status: isDbConnected ? 'healthy' : 'database_unavailable',
    database: isDbConnected ? 'connected' : 'disconnected',
    readyState: mongoose.connection.readyState,
    timestamp: new Date().toISOString()
  });
});

// Global error handler - shields stack traces and database details from clients
app.use((err, req, res, next) => {
  logger.error('GLOBAL ERROR CAPTURED', {
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip
  });
  res.status(500).json({ message: 'Internal server error occurred.' });
});

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));

const mongoUri = process.env.MONGO_URI;
if (!mongoUri) {
  console.error('CRITICAL: MONGO_URI is missing from environment variables!');
} else {
  mongoose.connect(mongoUri, {
    serverSelectionTimeoutMS: 5000
  })
    .then(() => console.log('MongoDB Connected'))
    .catch(err => console.error('MongoDB connection error (Check MongoDB Atlas Network Access whitelist / MONGO_URI):', err.message));
}
