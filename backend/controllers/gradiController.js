const { Grado, Categoria } = require('../models');

// GET - Lista tutti i gradi
exports.getAllGradi = async (req, res) => {
  try {
    const { id_categoria } = req.query;
    
    let whereClause = {};
    if (id_categoria) whereClause.id_categoria = parseInt(id_categoria);
    
    const gradi = await Grado.findAll({
      where: whereClause,
      include: [
        {
          model: Categoria,
          as: 'categoria',
          attributes: ['id', 'codice', 'descrizione']
        }
      ],
      order: [['ordinamento', 'ASC']]
    });
    
    res.json({
      success: true,
      count: gradi.length,
      data: gradi
    });
    
  } catch (error) {
    console.error('Errore getAllGradi:', error);
    res.status(500).json({
      success: false,
      error: 'Errore nel recupero dei gradi',
      message: error.message
    });
  }
};

// GET - Dettaglio singolo grado
exports.getGradoById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const grado = await Grado.findByPk(id, {
      include: [
        {
          model: Categoria,
          as: 'categoria',
          attributes: ['id', 'codice', 'descrizione']
        }
      ]
    });
    
    if (!grado) {
      return res.status(404).json({
        success: false,
        error: 'Grado non trovato'
      });
    }
    
    res.json({
      success: true,
      data: grado
    });
    
  } catch (error) {
    console.error('Errore getGradoById:', error);
    res.status(500).json({
      success: false,
      error: 'Errore nel recupero del grado',
      message: error.message
    });
  }
};