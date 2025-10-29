require('dotenv').config();

const windowsAuth = async (req, res, next) => {
  try {
    let username = null;

    // Sviluppo: simula utente
    if (process.env.NODE_ENV === 'development') {
      username = process.env.DEV_USERNAME || 'test.user';
      console.log('⚠️  DEVELOPMENT MODE: Utente simulato:', username);
    } else {
      // Produzione: recupera utente da IIS
      username = req.headers['x-iis-windowsauthtoken'] || 
                 req.headers['remote-user'] ||
                 req.connection.user;
      
      if (!username) {
        return res.status(401).json({ 
          error: 'Autenticazione Windows fallita',
          message: 'Utente non autenticato tramite dominio' 
        });
      }
    }

    username = username.split('\\').pop();

    req.user = {
      username: username,
      domain: process.env.AD_DOMAIN,
      authenticated: true
    };

    next();
  } catch (error) {
    console.error('Errore autenticazione Windows:', error);
    return res.status(500).json({ 
      error: 'Errore di autenticazione',
      message: error.message 
    });
  }
};

const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Non autenticato' });
    }
    next();
  };
};

module.exports = { windowsAuth, requireRole };