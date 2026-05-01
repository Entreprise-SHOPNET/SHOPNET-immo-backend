

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const { Server } = require('socket.io');

// ================= DB =================
const db = require('./db');

// ================= ROUTES IMMOBILIER =================
const biensRoutes = require('./Routes/biens');
const adminBiensRoutes = require('./Routes/adminBiens');
const agentBiensRoutes = require('./Routes/agentBiens');
const bienAnalyticsRoutes = require('./Routes/bienAnalytics');

// ================= ROUTES ADMIN =================
const adminValidationRoutes = require('./Routes/AdminValidationRoutes');
const adminCommissionnairesRoutes = require('./Routes/AdminCommissionnaires');

// ================= APP =================
const app = express();
app.set('trust proxy', 1);

// ================= MIDDLEWARES =================
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE']
}));

app.use(helmet());

// ================= RATE LIMIT =================
app.use('/api/', rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
}));

// ================= DB INJECTION =================
app.use((req, res, next) => {
  req.db = db;
  next();
});

// ================= HTTP SERVER =================
const server = http.createServer(app);

// ================= SOCKET.IO =================
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

const connectedUsers = new Map();

io.on('connection', (socket) => {
  console.log('📡 User connecté:', socket.id);

  socket.on('registerUser', (userId) => {
    if (!connectedUsers.has(userId)) {
      connectedUsers.set(userId, new Set());
    }
    connectedUsers.get(userId).add(socket);
  });

  socket.on('disconnect', () => {
    for (const [userId, sockets] of connectedUsers.entries()) {
      sockets.delete(socket);
      if (sockets.size === 0) connectedUsers.delete(userId);
    }
  });
});

// ================= NOTIFICATION SYSTEM =================
app.set('notifyUser', (userId, message) => {
  const sockets = connectedUsers.get(userId);
  if (sockets) {
    sockets.forEach(s => s.emit('notification', message));
  }
});

// ================= ROUTES IMMOBILIER =================
app.use('/api/biens', biensRoutes);
app.use('/api/admin/biens', adminBiensRoutes);
app.use('/api/agent', agentBiensRoutes);
app.use('/api/analytics', bienAnalyticsRoutes);

// ================= ROUTES ADMIN =================
app.use('/api/admin', adminValidationRoutes);
app.use('/api/admin/commissionnaires', adminCommissionnairesRoutes);

// ================= HEALTH CHECK =================
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    app: 'SHOPNET-IMMOBILIER + CORE LINKED',
    modules: {
      biens: true,
      admin: true,
      analytics: true,
      auth: 'SHOPNET CORE'
    },
    db: 'CONNECTED',
    time: new Date()
  });
});

// ================= ERROR HANDLER =================
app.use((err, req, res, next) => {
  console.error('❌ ERROR:', err);
  res.status(500).json({
    success: false,
    message: err.message || 'Erreur serveur'
  });
});

// ================= START SERVER =================
const PORT = process.env.PORT || 5000;

server.listen(PORT, '0.0.0.0', async () => {
  console.log('\n======================================');
  console.log('🚀 SHOPNET IMMOBILIER SERVER');
  console.log('======================================');
  console.log(`📡 URL: http://localhost:${PORT}`);
  console.log('🧠 Status: READY');
  console.log('🔐 Auth: SHOPNET CORE (external)');
  console.log('======================================\n');
});

module.exports = server;

