// backend/routes/activeDirectory.js
const express = require('express');
const router = express.Router();
const activeDirectoryController = require('../controllers/activeDirectoryController');
const { windowsAuth } = require('../middleware/auth');

// Applica middleware autenticazione a tutte le routes
router.use(windowsAuth);

// GET /api/ad/test - Test endpoint
router.get('/test', activeDirectoryController.test);

// GET /api/ad/testConnection - Test connessione AD
router.get('/testConnection', activeDirectoryController.testConnection);

// GET /api/ad/search?term=xxx - Ricerca utenti
router.get('/search', activeDirectoryController.searchUsers);

module.exports = router;