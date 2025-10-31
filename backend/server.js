// backend/server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const app = express();

// Middleware di sicurezza
app.use(helmet());

// CORS configuration
// ============================================
// CORS CONFIGURATION - Produzione
// ============================================
// Accetta richieste da qualsiasi origin sulla porta 85
// (frontend può essere su IP o hostname)

app.use(cors({
  origin: function(origin, callback) {
    // In development, permetti tutto
    if (process.env.NODE_ENV === 'development') {
      return callback(null, true);
    }
    
    // In produzione, permetti:
    // - Richieste senza origin (server-side, Postman, curl)
    // - Richieste dalla porta 85 (qualsiasi hostname/IP)
    // - Localhost per test
    
    if (!origin) {
      return callback(null, true);
    }
    
    // Permetti qualsiasi origin sulla porta 85
    if (origin.includes(':85') || origin.includes('localhost')) {
      return callback(null, true);
    }
    
    // Altrimenti nega
    console.warn('❌ CORS blocked for origin:', origin);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Authenticated-User']
}));

// Gestione esplicita delle richieste OPTIONS (preflight)
app.options('*', cors());

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// ===== ROUTES =====

// Routes pubbliche (senza autenticazione)
app.get('/api/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Routes autenticazione
const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);

// Routes Active Directory
const adRoutes = require('./routes/activeDirectory');
app.use('/api/ad', adRoutes);

// Routes protette (con autenticazione)
const { windowsAuth } = require('./middleware/auth');

const camereRoutes = require('./routes/camere');
app.use('/api/camere', windowsAuth, camereRoutes);

const categorieRoutes = require('./routes/categorie');
app.use('/api/categorie', windowsAuth, categorieRoutes);

const alloggiatiRoutes = require('./routes/alloggiati');
app.use('/api/alloggiati', windowsAuth, alloggiatiRoutes);

const gradiRoutes = require('./routes/gradi');
app.use('/api/gradi', windowsAuth, gradiRoutes);

const assegnazioniRoutes = require('./routes/assegnazioni');
app.use('/api/assegnazioni', windowsAuth, assegnazioniRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint non trovato',
    path: req.path
  });
});

// Error handler globale
app.use((err, req, res, next) => {
  console.error('Errore server:', err);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Errore interno del server',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Avvio server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════╗
║  🏢 Server Gestione Camerate                   ║
║  📡 Porta: ${PORT}                              ║
║  🌍 Ambiente: ${process.env.NODE_ENV || 'development'}           ║
║  ✅ Server avviato con successo!               ║
╚════════════════════════════════════════════════╝
  `);
});

module.exports = app;