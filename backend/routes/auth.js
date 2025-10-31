// backend/routes/auth.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { windowsAuth } = require('../middleware/auth');

// Applica middleware autenticazione a tutte le routes
router.use(windowsAuth);

// GET /api/auth/user - Ottieni utente corrente
router.get('/user', authController.getCurrentUser);

// GET /api/auth/isAdmin - Verifica se l'utente è admin (UNICO CHECK NECESSARIO)
router.get('/isAdmin', authController.isAdmin);

module.exports = router;