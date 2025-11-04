// backend/middleware/auth.js
require('dotenv').config();

const windowsAuth = async (req, res, next) => {
  try {
    let username = null;

    // DEVELOPMENT MODE
    if (process.env.NODE_ENV === 'development') {
      username = process.env.DEV_USERNAME || 'test.user';
      console.log('🔧 Development mode - User:', username);
      
      req.user = {
        username: username,
        authenticated: true,
        domain: process.env.AD_DOMAIN || 'GDFNET'
      };
      
      return next();
    }

    // PRODUCTION MODE
    // L'username arriva dal frontend tramite header X-Authenticated-User
    // Il frontend lo ottiene da whoami.aspx (gestito da IIS)
    username = req.headers['x-authenticated-user'];

    if (!username) {
      console.error('❌ Header X-Authenticated-User mancante');
      return res.status(401).json({
        success: false,
        error: 'Autenticazione richiesta',
        message: 'Header X-Authenticated-User non presente nella richiesta'
      });
    }

    // Rimuovi dominio se presente (es: GDFNET\J972537 -> J972537)
    username = username.split('\\').pop();

    console.log('✅ User autenticato:', username);

    req.user = {
      username: username,
      authenticated: true,
      domain: process.env.AD_DOMAIN || 'GDFNET'
    };

    next();

  } catch (error) {
    console.error('❌ Errore auth middleware:', error);
    res.status(500).json({
      success: false,
      error: 'Errore nel middleware di autenticazione',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Errore interno del server'
    });
  }
};

const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false,
        error: 'Non autenticato' 
      });
    }
    
    // Se hai bisogno di controllare ruoli specifici in futuro, aggiungi qui la logica
    // Per ora passa sempre (tutti gli utenti autenticati hanno accesso)
    next();
  };
};

module.exports = { windowsAuth, requireRole };