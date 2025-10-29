const express = require('express');
const router = express.Router();
const gradiController = require('../controllers/gradiController');

// GET - Lista tutti i gradi (con filtro opzionale per categoria)
router.get('/', gradiController.getAllGradi);

// GET - Dettaglio singolo grado
router.get('/:id', gradiController.getGradoById);

module.exports = router;