const express = require('express');
const router = express.Router();
const categorieController = require('../controllers/categorieController');

// GET - Lista tutte le categorie
router.get('/', categorieController.getAllCategorie);

// GET - Dettaglio singola categoria
router.get('/:id', categorieController.getCategoriaById);

module.exports = router;