// backend/controllers/activeDirectoryController.js
const ActiveDirectory = require('activedirectory2');
require('dotenv').config();

// Configurazione Active Directory
const adConfig = {
  url: process.env.AD_URL || 'ldap://DC=gdfnet,DC=gdf,DC=it',
  baseDN: process.env.AD_BASE_DN || 'DC=gdfnet,DC=gdf,DC=it',
  username: process.env.AD_USERNAME, // Opzionale: se serve autenticazione
  password: process.env.AD_PASSWORD  // Opzionale: se serve autenticazione
};

// Inizializza client AD solo in produzione
let ad = null;
if (process.env.NODE_ENV !== 'development') {
  ad = new ActiveDirectory(adConfig);
}

// GET - Test connessione AD
exports.testConnection = async (req, res) => {
  try {
    // In development, simula successo
    if (process.env.NODE_ENV === 'development') {
      return res.json({
        success: true,
        message: 'DEVELOPMENT MODE: Connessione AD simulata',
        path: adConfig.url
      });
    }

    // Verifica connessione reale
    if (!ad) {
      throw new Error('Client Active Directory non inizializzato');
    }

    // Test semplice: cerca la base DN
    ad.findUser(adConfig.baseDN, (err, user) => {
      if (err && err.name !== 'ObjectNotFoundError') {
        return res.status(500).json({
          success: false,
          error: 'Errore connessione Active Directory',
          message: err.message
        });
      }

      res.json({
        success: true,
        message: 'Connessione ad Active Directory riuscita',
        path: adConfig.url
      });
    });

  } catch (error) {
    console.error('Errore test connessione AD:', error);
    res.status(500).json({
      success: false,
      error: 'Errore durante il test di connessione',
      message: error.message
    });
  }
};

// GET - Ricerca utenti in AD
exports.searchUsers = async (req, res) => {
  try {
    const { term } = req.query;

    // Validazione
    if (!term || term.length < 3) {
      return res.status(400).json({
        success: false,
        error: 'Il termine di ricerca deve contenere almeno 3 caratteri'
      });
    }

    // In development, restituisci dati mock
    if (process.env.NODE_ENV === 'development') {
      const mockResults = [
        {
          samAccountName: `${term}123`,
          sn: 'Rossi',
          givenName: 'Mario',
          title: 'C.le Magg.',
          telephoneNumber: '123456789',
          physicalDeliveryOfficeName: 'Reparto Test',
          displayName: 'Mario Rossi'
        }
      ];

      return res.json({
        success: true,
        data: mockResults,
        count: mockResults.length,
        message: 'DEVELOPMENT MODE: Risultati simulati'
      });
    }

    // Produzione: ricerca reale in AD
    if (!ad) {
      throw new Error('Client Active Directory non inizializzato');
    }

    // Costruisci filtro LDAP
    // Cerca per samAccountName (matricola), cognome o nome
    const filter = `(|(samAccountName=*${term}*)(sn=*${term}*)(givenName=*${term}*))`;

    const searchOptions = {
      filter: filter,
      scope: 'sub',
      attributes: [
        'samAccountName',    // Matricola
        'sn',                // Cognome
        'givenName',         // Nome
        'title',             // Grado
        'telephoneNumber',   // Telefono
        'physicalDeliveryOfficeName', // Reparto
        'displayName'        // Nome completo
      ],
      sizeLimit: 50 // Limita risultati
    };

    ad.findUsers(searchOptions, (err, users) => {
      if (err) {
        console.error('Errore ricerca AD:', err);
        return res.status(500).json({
          success: false,
          error: 'Errore nella ricerca in Active Directory',
          message: err.message
        });
      }

      // Formatta risultati
      const results = users ? users.map(user => ({
        samAccountName: user.samAccountName || '',
        sn: user.sn || '',
        givenName: user.givenName || '',
        title: user.title || '',
        telephoneNumber: user.telephoneNumber || '',
        physicalDeliveryOfficeName: user.physicalDeliveryOfficeName || '',
        displayName: user.displayName || ''
      })) : [];

      res.json({
        success: true,
        data: results,
        count: results.length
      });
    });

  } catch (error) {
    console.error('Errore searchUsers:', error);
    res.status(500).json({
      success: false,
      error: 'Errore durante la ricerca',
      message: error.message
    });
  }
};

// GET - Test endpoint
exports.test = async (req, res) => {
  res.json({
    success: true,
    message: 'Il controller ActiveDirectory è raggiungibile',
    timestamp: new Date().toISOString()
  });
};

module.exports = exports;