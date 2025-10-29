require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { sequelize, testConnection } = require('./config/database');
const { windowsAuth } = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware di sicurezza
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minuti
  max: 100 // max 100 richieste per IP
});
app.use(limiter);

// CORS - Configurazione per rete locale
const allowedOrigins = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://10.60.37.91:3000',  // IP del tuo PC
];

// Se definito in .env, aggiungi anche quello
if (process.env.ALLOWED_ORIGIN) {
  allowedOrigins.push(process.env.ALLOWED_ORIGIN);
}

const corsOptions = {
  origin: function(origin, callback) {
    // Permetti richieste senza origin (es: Postman, app mobile)
    if (!origin) return callback(null, true);
    
    // Controlla se l'origin è nella lista permessi
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.warn(`⚠️ CORS blocked: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
console.log('✓ CORS configurato per:', allowedOrigins);

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logger semplice
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check (senza autenticazione)
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV 
  });
});

// Applica Windows Authentication a tutte le route API
app.use('/api', windowsAuth);

// Info utente autenticato
app.get('/api/auth/user', (req, res) => {
  res.json({
    user: req.user,
    message: 'Autenticato con successo'
  });
});

// Importa routes
const categorieRoutes = require('./routes/categorie');
const gradiRoutes = require('./routes/gradi');
const camereRoutes = require('./routes/camere');
const alloggiatiRoutes = require('./routes/alloggiati');
const assegnazioniRoutes = require('./routes/assegnazioni');

// Usa routes
app.use('/api/categorie', categorieRoutes);
app.use('/api/gradi', gradiRoutes);
app.use('/api/camere', camereRoutes);
app.use('/api/alloggiati', alloggiatiRoutes);
app.use('/api/assegnazioni', assegnazioniRoutes);

// Route di test
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'API funzionante!',
    user: req.user 
  });
});

// Gestione errori 404
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint non trovato' });
});

// Gestione errori globale
app.use((err, req, res, next) => {
  console.error('Errore:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Errore interno del server',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Avvio server
const startServer = async () => {
  try {
    // Test connessione database
    await testConnection();
    
    // Sincronizza modelli (in sviluppo)
    if (process.env.NODE_ENV === 'development') {
      await sequelize.sync({ alter: false });
      console.log('✓ Modelli database sincronizzati');
    }
    
    // Avvia server
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`\n${'='.repeat(50)}`);
      console.log(`🚀 Server avviato su porta ${PORT}`);
      console.log(`📝 Ambiente: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
      console.log(`${'='.repeat(50)}\n`);
    });
  } catch (error) {
    console.error('❌ Errore avvio server:', error);
    process.exit(1);
  }
};

startServer();

// Gestione chiusura graceful
process.on('SIGINT', async () => {
  console.log('\n⏳ Chiusura server in corso...');
  await sequelize.close();
  console.log('✓ Connessioni database chiuse');
  process.exit(0);
});