const express = require('express');
const { Server } = require('socket.io');
const http = require('http');
const cors = require('cors');
const redis = require('redis');

const app = express();
const server = http.createServer(app);

// CORS configuration
app.use(cors({
  origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true
}));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Initialize Socket.io
const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
    credentials: true
  }
});

// Redis client for pub/sub
const redisClient = redis.createClient({
  url: process.env.REDIS_URL || 'redis://redis:6379'
});

redisClient.connect().catch(console.error);

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);

  // Join dashboard room for updates
  socket.join('dashboard:overview');
  socket.join('metrics:realtime');
  socket.join('alerts:all');

  // Handle disconnect
  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
  });

  // Ping/pong for health check
  socket.on('ping', () => {
    socket.emit('pong', { timestamp: Date.now() });
  });
});

// Simulate real-time data updates
setInterval(() => {
  const metrics = {
    activeSessions: Math.floor(Math.random() * 100) + 50,
    costPerHour: (Math.random() * 10 + 5).toFixed(2),
    systemHealth: Math.random() > 0.1 ? 'healthy' : 'warning',
    timestamp: new Date().toISOString()
  };

  io.to('metrics:realtime').emit('metrics:update', metrics);
}, 5000);

// Simulate alert notifications
setInterval(() => {
  if (Math.random() > 0.9) {
    const alert = {
      id: Date.now(),
      type: 'warning',
      title: 'High Session Cost Detected',
      message: 'Session cost exceeding $50 threshold',
      timestamp: new Date().toISOString()
    };

    io.to('alerts:all').emit('alert:new', alert);
  }
}, 30000);

const PORT = process.env.PORT || 8001;
server.listen(PORT, () => {
  console.log(`WebSocket server running on port ${PORT}`);
});