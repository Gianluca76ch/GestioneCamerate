const express = require('express');
const router = express.Router();
const alloggiatiController = require('../controllers/alloggiatiController');

// GET - Statistiche alloggiati (prima di /:matricola per evitare conflitti)
router.get('/stats', alloggiatiController.getStats);

// GET - Lista tutti gli alloggiati (con filtri opzionali)
router.get('/', alloggiatiController.getAllAlloggiati);

// GET - Dettaglio singolo alloggiato
router.get('/:matricola', alloggiatiController.getAlloggiatoById);

// POST - Crea nuovo alloggiato
router.post('/', alloggiatiController.createAlloggiato);

// PUT - Modifica alloggiato esistente
router.put('/:matricola', alloggiatiController.updateAlloggiato);

// DELETE - Elimina alloggiato (solo se non ha camera assegnata)
router.delete('/:matricola', alloggiatiController.deleteAlloggiato);

module.exports = router;