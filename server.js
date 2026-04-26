

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

// ================= ROUTES =================
const inscriptionRoutes = require('./Routes/Inscription');
const loginRoutes = require('./Routes/Login');

// ✅ CORRECTION ICI (noms différents)
const adminCommissionnairesRoutes = require('./Routes/AdminCommissionnaires');
const adminValidationRoutes = require('./Routes/AdminValidationRoutes');
const biensRoutes = require('./routes/biens');
const adminBiensRoutes = require('./routes/adminBiens');
const agentBiensRoutes = require('./routes/agentBiens');
const bienAnalyticsRoutes = require('./routes/bienAnalytics');



// ================= APP =================
const app = express();
app.set('trust proxy', 1);

// ================= MIDDLEWARES =================
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// 🔥 IMPORTANT FIX COOKIE
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

// ================= SOCKET LOGIC =================
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

// ================= GLOBAL HELPERS =================
app.set('notifyUser', (userId, message) => {
  const sockets = connectedUsers.get(userId);
  if (sockets) {
    sockets.forEach(s => s.emit('notification', message));
  }
});

// ================= ROUTES =================

// 🧑‍💼 Commissionnaires
 
// 🧑‍💼 Commissionnaires (auth)
app.use('/api/commissionnaires', inscriptionRoutes);
app.use('/api/commissionnaires', loginRoutes);
app.use('/api/biens', biensRoutes);               // 🏠 BIENS (PUBLIC + AGENT)
app.use('/api/admin/biens', adminBiensRoutes);      // 🛡️ ADMIN BIENS
app.use('/api/agent', agentBiensRoutes);     // 👨‍💼 AGENT BIENS
app.use('/api/analytics', bienAnalyticsRoutes);// 📊 ANALYTICS BIENS




// 📊 ADMIN - Voir les demandes + stats
app.use('/api/admin/commissionnaires', adminCommissionnairesRoutes);

// ✅❌ ADMIN - Validation / Rejet
app.use('/api/admin', adminValidationRoutes);

// ================= DB TEST =================
async function testDatabaseConnection() {
  try {
    await db.query('SELECT 1');
    return true;
  } catch (err) {
    console.error('❌ DATABASE ERROR:', err.message);
    return false;
  }
}

// ================= HEALTH CHECK =================
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    app: 'SHOPNET-IMMO',
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

  const dbStatus = await testDatabaseConnection();

  console.log('\n======================================');
  console.log('🚀 SHOPNET-IMMO SERVER DEMARRÉ');
  console.log('======================================');
  console.log(`📡 URL: http://localhost:${PORT}`);

  if (dbStatus) {
    console.log('🗄️ Database: MySQL CONNECTED ✅');
  } else {
    console.log('🗄️ Database: CONNECTION FAILED ❌');
  }

  console.log('🧠 Status: READY');
  console.log('======================================\n');
});

module.exports = server;