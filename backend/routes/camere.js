const express = require('express');
const router = express.Router();
const camereController = require('../controllers/camereController');

// GET - Statistiche camere (prima di /:id per evitare conflitti)
router.get('/stats', camereController.getStats);

// GET - Camere disponibili
router.get('/disponibili', camereController.getCamereDisponibili);

// GET - Lista tutte le camere (con filtri opzionali)
router.get('/', camereController.getAllCamere);

// GET - Dettaglio singola camera
router.get('/:id', camereController.getCameraById);

// POST - Crea nuova camera
router.post('/', camereController.createCamera);

// PUT - Modifica camera esistente
router.put('/:id', camereController.updateCamera);

module.exports = router;