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
    // L'username può arrivare dal frontend tramite header personalizzato
    username = req.headers['x-authenticated-user'] ||
               req.headers['x-iis-windowsauthtoken'] || 
               req.headers['remote-user'] ||
               req.connection.user;

    if (!username) {
      // TEMPORANEO: Fallback per testing iniziale
      // TODO: Implementare soluzione completa con endpoint /whoami
      console.warn('⚠️ Nessun username in header - usando fallback');
      username = process.env.FALLBACK_USERNAME || 'J972537';
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
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
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