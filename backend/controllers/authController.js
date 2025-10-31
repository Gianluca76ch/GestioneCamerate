// backend/controllers/authController.js
const { sequelize } = require('../config/database');
const { QueryTypes } = require('sequelize');

// GET - Ottieni utente corrente
exports.getCurrentUser = (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Utente non autenticato'
      });
    }

    res.json({
      success: true,
      data: {
        username: req.user.username,
        isAuthenticated: req.user.authenticated,
        domain: req.user.domain
      }
    });
  } catch (error) {
    console.error('Errore getCurrentUser:', error);
    res.status(500).json({
      success: false,
      error: 'Errore nel recupero dell\'utente',
      message: error.message
    });
  }
};

// GET - Verifica se l'utente è admin
exports.isAdmin = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Utente non autenticato'
      });
    }

    let matricola = req.user.username;
    
    // Rimuovi dominio se presente (es: GDFNET\J972537 -> J972537)
    if (matricola.includes('\\')) {
      matricola = matricola.split('\\').pop();
    }

    console.log('🔍 Verifica admin per matricola:', matricola);

    // Gestisci il caso in cui la lettera sia in posizioni diverse
    // Matricola da AD: J972537 (lettera all'inizio)
    // Matricola nel DB: 972537J (lettera alla fine)
    let matricolaStandardized = matricola;

    // Se la prima posizione è una lettera, spostala alla fine
    if (matricola.length > 0 && /^[A-Za-z]/.test(matricola)) {
      matricolaStandardized = matricola.substring(1) + matricola.charAt(0);
    }

    console.log('🔍 Formati matricola:', { 
      originale: matricola, 
      standardized: matricolaStandardized 
    });

    // Query per verificare se l'utente è admin
    // Verifica entrambi i formati per sicurezza
    const query = `
      SELECT COUNT(*) as count 
      FROM tbl_admin 
      WHERE matricola = :matricola OR matricola = :matricolaStandardized
    `;

    const results = await sequelize.query(query, {
      replacements: { 
        matricola: matricola, 
        matricolaStandardized: matricolaStandardized 
      },
      type: QueryTypes.SELECT
    });

    const isAdmin = results[0].count > 0;

    if (isAdmin) {
      console.log('✅ Utente riconosciuto come ADMIN');
    } else {
      console.log('❌ Utente NON è admin - ACCESSO NEGATO');
    }

    res.json({
      success: true,
      data: {
        isAdmin: isAdmin,
        username: req.user.username
      }
    });

  } catch (error) {
    console.error('❌ Errore isAdmin:', error);
    res.status(500).json({
      success: false,
      error: 'Errore nella verifica admin',
      message: error.message
    });
  }
};

module.exports = exports;