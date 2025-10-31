const { StoricoAssegnazione, Assegnazione, Alloggiato, Camera, Grado } = require('../models');
const { Op } = require('sequelize');

// POST - Sposta assegnazione nello storico (chiamato quando si elimina dalla camera)
exports.spostaInStorico = async (req, res) => {
  try {
    const { id_assegnazione, data_uscita, note, inserito_da } = req.body;
    
    // Validazioni
    if (!id_assegnazione || !data_uscita) {
      return res.status(400).json({
        success: false,
        error: 'Campi obbligatori mancanti',
        required: ['id_assegnazione', 'data_uscita']
      });
    }
    
    // Trova l'assegnazione con tutti i dati necessari
    const assegnazione = await Assegnazione.findByPk(id_assegnazione, {
      include: [
        {
          model: Alloggiato,
          as: 'alloggiato',
          include: [
            {
              model: Grado,
              as: 'grado'
            }
          ]
        },
        {
          model: Camera,
          as: 'camera'
        }
      ]
    });
    
    if (!assegnazione) {
      return res.status(404).json({
        success: false,
        error: 'Assegnazione non trovata'
      });
    }
    
    // Verifica che l'assegnazione sia ancora attiva
    if (assegnazione.data_uscita !== null) {
      return res.status(400).json({
        success: false,
        error: 'L\'assegnazione è già stata chiusa'
      });
    }
    
    // Verifica che la data di uscita non sia precedente alla data di entrata
    const dataEntrata = new Date(assegnazione.data_assegnazione);
    const dataUscita = new Date(data_uscita);
    
    if (dataUscita < dataEntrata) {
      return res.status(400).json({
        success: false,
        error: 'La data di uscita non può essere precedente alla data di entrata'
      });
    }
    
    // Crea record nello storico
    const storicoRecord = await StoricoAssegnazione.create({
      matricola_alloggiato: assegnazione.matricola_alloggiato,
      grado: assegnazione.alloggiato.grado.descrizione,
      cognome: assegnazione.alloggiato.cognome,
      nome: assegnazione.alloggiato.nome,
      id_camera: assegnazione.id_camera,
      numero_camera: assegnazione.camera.numero_camera,
      edificio: assegnazione.camera.edificio,
      piano: assegnazione.camera.piano,
      data_entrata: assegnazione.data_assegnazione,
      data_uscita: data_uscita,
      note: note || assegnazione.note || null,
      inserito_da: inserito_da || null
    });
    
    // Elimina l'assegnazione corrente
    await assegnazione.destroy();
    
    res.json({
      success: true,
      message: 'Militare rimosso dalla camera e spostato nello storico',
      data: storicoRecord
    });
    
  } catch (error) {
    console.error('Errore spostaInStorico:', error);
    res.status(500).json({
      success: false,
      error: 'Errore nello spostamento in storico',
      message: error.message
    });
  }
};

// GET - Lista storico assegnazioni con filtri
exports.getStorico = async (req, res) => {
  try {
    const { 
      matricola_alloggiato, 
      id_camera, 
      numero_camera,
      data_entrata_da,
      data_entrata_a,
      data_uscita_da,
      data_uscita_a,
      grado,
      edificio
    } = req.query;
    
    let whereClause = {};
    
    // Applica filtri
    if (matricola_alloggiato) whereClause.matricola_alloggiato = matricola_alloggiato;
    if (id_camera) whereClause.id_camera = parseInt(id_camera);
    if (numero_camera) whereClause.numero_camera = numero_camera;
    if (grado) whereClause.grado = { [Op.like]: `%${grado}%` };
    if (edificio) whereClause.edificio = edificio;
    
    // Filtri per date
    if (data_entrata_da || data_entrata_a) {
      whereClause.data_entrata = {};
      if (data_entrata_da) whereClause.data_entrata[Op.gte] = data_entrata_da;
      if (data_entrata_a) whereClause.data_entrata[Op.lte] = data_entrata_a;
    }
    
    if (data_uscita_da || data_uscita_a) {
      whereClause.data_uscita = {};
      if (data_uscita_da) whereClause.data_uscita[Op.gte] = data_uscita_da;
      if (data_uscita_a) whereClause.data_uscita[Op.lte] = data_uscita_a;
    }
    
    const storico = await StoricoAssegnazione.findAll({
      where: whereClause,
      order: [
        ['data_uscita', 'DESC'],
        ['data_entrata', 'DESC']
      ]
    });
    
    res.json({
      success: true,
      count: storico.length,
      data: storico
    });
    
  } catch (error) {
    console.error('Errore getStorico:', error);
    res.status(500).json({
      success: false,
      error: 'Errore nel recupero dello storico',
      message: error.message
    });
  }
};

// GET - Storico per singolo militare
exports.getStoricoByMatricola = async (req, res) => {
  try {
    const { matricola } = req.params;
    
    const storico = await StoricoAssegnazione.findAll({
      where: { matricola_alloggiato: matricola },
      order: [
        ['data_uscita', 'DESC'],
        ['data_entrata', 'DESC']
      ]
    });
    
    res.json({
      success: true,
      count: storico.length,
      data: storico
    });
    
  } catch (error) {
    console.error('Errore getStoricoByMatricola:', error);
    res.status(500).json({
      success: false,
      error: 'Errore nel recupero dello storico del militare',
      message: error.message
    });
  }
};

// GET - Storico per singola camera
exports.getStoricoByCamera = async (req, res) => {
  try {
    const { id_camera } = req.params;
    
    const storico = await StoricoAssegnazione.findAll({
      where: { id_camera: parseInt(id_camera) },
      order: [
        ['data_uscita', 'DESC'],
        ['data_entrata', 'DESC']
      ]
    });
    
    res.json({
      success: true,
      count: storico.length,
      data: storico
    });
    
  } catch (error) {
    console.error('Errore getStoricoByCamera:', error);
    res.status(500).json({
      success: false,
      error: 'Errore nel recupero dello storico della camera',
      message: error.message
    });
  }
};

// GET - Statistiche storico
exports.getStatsStorico = async (req, res) => {
  try {
    const { anno, mese } = req.query;
    
    let whereClause = {};
    
    // Filtro per anno/mese se specificato
    if (anno) {
      whereClause.data_uscita = {
        [Op.gte]: `${anno}-01-01`,
        [Op.lte]: `${anno}-12-31`
      };
      
      if (mese) {
        const meseStr = mese.toString().padStart(2, '0');
        const ultimoGiorno = new Date(anno, parseInt(mese), 0).getDate();
        whereClause.data_uscita = {
          [Op.gte]: `${anno}-${meseStr}-01`,
          [Op.lte]: `${anno}-${meseStr}-${ultimoGiorno}`
        };
      }
    }
    
    const storico = await StoricoAssegnazione.findAll({
      where: whereClause
    });
    
    // Calcola statistiche
    const stats = {
      totale_movimenti: storico.length,
      per_camera: {},
      per_grado: {},
      per_edificio: {},
      durata_media: 0
    };
    
    let durataComplessiva = 0;
    
    storico.forEach(record => {
      // Per camera
      if (!stats.per_camera[record.numero_camera]) {
        stats.per_camera[record.numero_camera] = 0;
      }
      stats.per_camera[record.numero_camera]++;
      
      // Per grado
      if (!stats.per_grado[record.grado]) {
        stats.per_grado[record.grado] = 0;
      }
      stats.per_grado[record.grado]++;
      
      // Per edificio
      if (record.edificio) {
        if (!stats.per_edificio[record.edificio]) {
          stats.per_edificio[record.edificio] = 0;
        }
        stats.per_edificio[record.edificio]++;
      }
      
      // Calcola durata in giorni
      const entrata = new Date(record.data_entrata);
      const uscita = new Date(record.data_uscita);
      const durata = Math.floor((uscita - entrata) / (1000 * 60 * 60 * 24));
      durataComplessiva += durata;
    });
    
    if (storico.length > 0) {
      stats.durata_media = Math.round(durataComplessiva / storico.length);
    }
    
    res.json({
      success: true,
      data: stats
    });
    
  } catch (error) {
    console.error('Errore getStatsStorico:', error);
    res.status(500).json({
      success: false,
      error: 'Errore nel calcolo delle statistiche',
      message: error.message
    });
  }
};

// DELETE - Elimina record da storico (solo admin)
exports.deleteFromStorico = async (req, res) => {
  try {
    const { id } = req.params;
    
    const record = await StoricoAssegnazione.findByPk(id);
    
    if (!record) {
      return res.status(404).json({
        success: false,
        error: 'Record non trovato nello storico'
      });
    }
    
    await record.destroy();
    
    res.json({
      success: true,
      message: 'Record eliminato dallo storico'
    });
    
  } catch (error) {
    console.error('Errore deleteFromStorico:', error);
    res.status(500).json({
      success: false,
      error: 'Errore nell\'eliminazione del record',
      message: error.message
    });
  }
};