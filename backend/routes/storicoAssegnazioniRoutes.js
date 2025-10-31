const express = require('express');
const router = express.Router();
const storicoController = require('../controllers/storicoAssegnazioniController');

// POST - Sposta assegnazione in storico
router.post('/sposta-in-storico', storicoController.spostaInStorico);

// GET - Lista storico con filtri
router.get('/', storicoController.getStorico);

// GET - Storico per militare specifico
router.get('/militare/:matricola', storicoController.getStoricoByMatricola);

// GET - Storico per camera specifica
router.get('/camera/:id_camera', storicoController.getStoricoByCamera);

// GET - Statistiche storico
router.get('/stats', storicoController.getStatsStorico);

// DELETE - Elimina record da storico (solo admin)
router.delete('/:id', storicoController.deleteFromStorico);

module.exports = router;