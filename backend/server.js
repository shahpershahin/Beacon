const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const startupRoutes = require('./routes/startup');
const aiRoutes = require('./routes/ai');
const docRoutes = require('./routes/docs');

const app = express();
const PORT = process.env.PORT || 5001;

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

app.use(cors({
  origin: allowedOrigins,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-auth-token'],
  credentials: true
}));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/startup', startupRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/docs', docRoutes);

app.get('/', (req, res) => {
  res.send('Startup Dashboard API Running (Sockets Enabled)');
});

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.log('MongoDB connection error (Please start MongoDB locally!):', err.message));
