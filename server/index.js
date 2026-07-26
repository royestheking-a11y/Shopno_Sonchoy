require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const depositRoutes = require('./routes/deposits');
const loanRoutes = require('./routes/loans');
const ledgerRoutes = require('./routes/ledgers');
const masterWalletRoutes = require('./routes/masterwallets');
const monthlyClosingRoutes = require('./routes/monthlyclosings');
const reportRoutes = require('./routes/reports');
const settingRoutes = require('./routes/settings');
const broadcastRoutes = require('./routes/broadcasts');
const notificationRoutes = require('./routes/notifications');
const transactionRoutes = require('./routes/transactions');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

// Expose io to routes
app.set('io', io);

const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/deposits', depositRoutes);
app.use('/api/loans', loanRoutes);
app.use('/api/ledgers', ledgerRoutes);
app.use('/api/masterwallets', masterWalletRoutes);
app.use('/api/monthlyclosings', monthlyClosingRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/settings', settingRoutes);
app.use('/api/broadcasts', broadcastRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/transactions', transactionRoutes);

// Health check / ping route for self-ping system
app.get('/api/ping', (req, res) => {
  res.status(200).send('pong');
});

// Socket.io connection logging
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      
      // Self-ping system to prevent sleep on Render
      const PING_INTERVAL = 14 * 60 * 1000; // 14 minutes
      // RENDER_EXTERNAL_URL is automatically provided by Render for web services
      const RENDER_EXTERNAL_URL = process.env.RENDER_EXTERNAL_URL || `http://localhost:${PORT}`;
      
      setInterval(() => {
        const url = `${RENDER_EXTERNAL_URL}/api/ping`;
        console.log(`Sending self-ping to ${url} to prevent sleep...`);
        
        const client = url.startsWith('https') ? require('https') : require('http');
        client.get(url, (res) => {
          console.log(`Self-ping successful. Status Code: ${res.statusCode}`);
        }).on('error', (err) => {
          console.error('Self-ping failed:', err.message);
        });
      }, PING_INTERVAL);
    });
  })
  .catch((error) => {
    console.error('MongoDB connection error:', error);
  });
