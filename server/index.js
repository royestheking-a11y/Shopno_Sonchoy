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
    origin: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin']
  },
  transports: ['websocket', 'polling'],
  allowEIO3: true
});

// Expose io to routes
app.set('io', io);

const PORT = process.env.PORT || 5001;

app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin']
}));
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
app.use('/api/webauthn', require('./routes/webauthn'));

// Health check / ping route for self-ping system
app.get('/api/ping', (req, res) => {
  res.status(200).send('pong');
});

// Test email route - for debugging email delivery
app.get('/api/test-email', async (req, res) => {
  const { sendEmail } = require('./utils/emailHelper');
  try {
    console.log('=== EMAIL TEST START ===');
    console.log('ENV CHECK:');
    console.log('  EMAILJS_SERVICE_ID:', process.env.EMAILJS_SERVICE_ID || 'NOT SET');
    console.log('  EMAILJS_TEMPLATE_DEPOSIT:', process.env.EMAILJS_TEMPLATE_DEPOSIT || 'NOT SET');
    console.log('  EMAILJS_PUBLIC_KEY:', process.env.EMAILJS_PUBLIC_KEY || 'NOT SET');
    console.log('  EMAILJS_PRIVATE_KEY:', process.env.EMAILJS_PRIVATE_KEY ? 'SET (' + process.env.EMAILJS_PRIVATE_KEY.length + ' chars)' : 'NOT SET');
    
    const result = await sendEmail(process.env.EMAILJS_TEMPLATE_DEPOSIT, {
      email: 'sonchoyshopno@gmail.com',
      to_email: 'sonchoyshopno@gmail.com',
      name: 'Test User',
      amount: '1,000',
      method: 'bKash',
      transactionId: 'TEST-123',
      date: new Date().toLocaleDateString(),
      newBalance: '5,000'
    });
    console.log('=== EMAIL TEST SUCCESS ===');
    res.json({ success: true, status: result?.status, data: result?.data });
  } catch (err) {
    console.error('=== EMAIL TEST FAILED ===');
    console.error('Error:', err.response?.data || err.message);
    res.status(500).json({ 
      success: false, 
      error: err.response?.data || err.message,
      status: err.response?.status 
    });
  }
});

// Socket.io connection logging
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://sonchoyshopno_db_user:iFT1QLuWc74qR4mV@cluster0.5ekca7f.mongodb.net/shopno_sonchoy?retryWrites=true&w=majority";

mongoose.connect(MONGODB_URI)
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
