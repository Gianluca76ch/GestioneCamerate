const { Categoria, Grado } = require('../models');

// GET - Lista tutte le categorie
exports.getAllCategorie = async (req, res) => {
  try {
    const categorie = await Categoria.findAll({
      include: [
        {
          model: Grado,
          as: 'gradi',
          attributes: ['id', 'codice', 'descrizione', 'ordinamento']
        }
      ],
      order: [
        ['codice', 'ASC'],
        [{ model: Grado, as: 'gradi' }, 'ordinamento', 'ASC']
      ]
    });
    
    res.json({
      success: true,
      count: categorie.length,
      data: categorie
    });
    
  } catch (error) {
    console.error('Errore getAllCategorie:', error);
    res.status(500).json({
      success: false,
      error: 'Errore nel recupero delle categorie',
      message: error.message
    });
  }
};

// GET - Dettaglio singola categoria
exports.getCategoriaById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const categoria = await Categoria.findByPk(id, {
      include: [
        {
          model: Grado,
          as: 'gradi',
          attributes: ['id', 'codice', 'descrizione', 'ordinamento']
        }
      ]
    });
    
    if (!categoria) {
      return res.status(404).json({
        success: false,
        error: 'Categoria non trovata'
      });
    }
    
    res.json({
      success: true,
      data: categoria
    });
    
  } catch (error) {
    console.error('Errore getCategoriaById:', error);
    res.status(500).json({
      success: false,
      error: 'Errore nel recupero della categoria',
      message: error.message
    });
  }
};