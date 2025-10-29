const express = require('express');
const router = express.Router();
const assegnazioniController = require('../controllers/assegnazioniController');

// POST - Sposta alloggiato da una camera all'altra (prima di / per evitare conflitti)
router.post('/sposta', assegnazioniController.spostaAlloggiato);

// GET - Occupazione camera specifica
router.get('/camera/:id_camera', assegnazioniController.getOccupazioneCamera);

// GET - Lista tutte le assegnazioni (con filtri opzionali)
router.get('/', assegnazioniController.getAllAssegnazioni);

// GET - Dettaglio singola assegnazione
router.get('/:id', assegnazioniController.getAssegnazioneById);

// POST - Crea nuova assegnazione (assegna alloggiato a camera)
router.post('/', assegnazioniController.createAssegnazione);

// DELETE - Rimuovi assegnazione (rimuovi alloggiato da camera)
router.delete('/:id', assegnazioniController.deleteAssegnazione);

module.exports = router;