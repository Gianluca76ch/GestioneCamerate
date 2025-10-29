const { Assegnazione, Alloggiato, Camera, Grado, Categoria } = require('../models');
const { Op } = require('sequelize');

// GET - Lista tutte le assegnazioni
exports.getAllAssegnazioni = async (req, res) => {
  try {
    const { id_camera, matricola_alloggiato, attive } = req.query;
    
    let whereClause = {};
    
    // Filtri
    if (id_camera) whereClause.id_camera = parseInt(id_camera);
    if (matricola_alloggiato) whereClause.matricola_alloggiato = matricola_alloggiato;
    
    // Filtro per assegnazioni attive (data_uscita NULL)
    if (attive === 'true' || !req.query.attive) {
      whereClause.data_uscita = null;
    }
    
    const assegnazioni = await Assegnazione.findAll({
      where: whereClause,
      include: [
        {
          model: Alloggiato,
          as: 'alloggiato',
          attributes: ['matricola', 'cognome', 'nome', 'telefono'],
          include: [
            {
              model: Grado,
              as: 'grado',
              attributes: ['id', 'codice', 'descrizione'],
              include: [
                {
                  model: Categoria,
                  as: 'categoria',
                  attributes: ['codice', 'descrizione']
                }
              ]
            }
          ]
        },
        {
          model: Camera,
          as: 'camera',
          attributes: ['id', 'numero_camera', 'edificio', 'piano', 'ala', 'genere', 'nr_posti'],
          include: [
            {
              model: Categoria,
              as: 'categoria',
              attributes: ['codice', 'descrizione']
            }
          ]
        }
      ],
      order: [
        ['created_at', 'DESC']
      ]
    });
    
    res.json({
      success: true,
      count: assegnazioni.length,
      data: assegnazioni
    });
    
  } catch (error) {
    console.error('Errore getAllAssegnazioni:', error);
    res.status(500).json({
      success: false,
      error: 'Errore nel recupero delle assegnazioni',
      message: error.message
    });
  }
};

// GET - Dettaglio singola assegnazione
exports.getAssegnazioneById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const assegnazione = await Assegnazione.findByPk(id, {
      include: [
        {
          model: Alloggiato,
          as: 'alloggiato',
          include: [
            {
              model: Grado,
              as: 'grado',
              include: [
                {
                  model: Categoria,
                  as: 'categoria'
                }
              ]
            }
          ]
        },
        {
          model: Camera,
          as: 'camera',
          include: [
            {
              model: Categoria,
              as: 'categoria'
            }
          ]
        }
      ]
    });
    
    if (!assegnazione) {
      return res.status(404).json({
        success: false,
        error: 'Assegnazione non trovata'
      });
    }
    
    res.json({
      success: true,
      data: assegnazione
    });
    
  } catch (error) {
    console.error('Errore getAssegnazioneById:', error);
    res.status(500).json({
      success: false,
      error: 'Errore nel recupero dell\'assegnazione',
      message: error.message
    });
  }
};

// POST - Crea nuova assegnazione (assegna alloggiato a camera)
exports.createAssegnazione = async (req, res) => {
  try {
    const { matricola_alloggiato, id_camera, data_assegnazione, note } = req.body;
    
    // Validazioni base
    if (!matricola_alloggiato || !id_camera) {
      return res.status(400).json({
        success: false,
        error: 'Campi obbligatori mancanti',
        required: ['matricola_alloggiato', 'id_camera']
      });
    }
    
    // Verifica che alloggiato esista
    const alloggiato = await Alloggiato.findByPk(matricola_alloggiato, {
      include: [
        {
          model: Grado,
          as: 'grado',
          include: [
            {
              model: Categoria,
              as: 'categoria'
            }
          ]
        }
      ]
    });
    
    if (!alloggiato) {
      return res.status(404).json({
        success: false,
        error: 'Alloggiato non trovato'
      });
    }
    
    // Verifica che camera esista
    const camera = await Camera.findByPk(id_camera, {
      include: [
        {
          model: Assegnazione,
          as: 'assegnazioni',
          where: { data_uscita: null },
          required: false
        },
        {
          model: Categoria,
          as: 'categoria'
        }
      ]
    });
    
    if (!camera) {
      return res.status(404).json({
        success: false,
        error: 'Camera non trovata'
      });
    }
    
    // VALIDAZIONE 1: Verifica che alloggiato non abbia già un'assegnazione attiva
    const assegnazioneEsistente = await Assegnazione.findOne({
      where: {
        matricola_alloggiato: matricola_alloggiato,
        data_uscita: null
      }
    });
    
    if (assegnazioneEsistente) {
      return res.status(400).json({
        success: false,
        error: 'L\'alloggiato ha già una camera assegnata',
        id_assegnazione_esistente: assegnazioneEsistente.id
      });
    }
    
    // VALIDAZIONE 2: Verifica posti disponibili
    const postiOccupati = camera.assegnazioni.length;
    const postiDisponibili = camera.nr_posti - postiOccupati;
    
    if (postiDisponibili <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Camera completa: non ci sono posti disponibili',
        posti_totali: camera.nr_posti,
        posti_occupati: postiOccupati
      });
    }
    
    // VALIDAZIONE 3: Verifica genere compatibile
    // Determina il genere dell'alloggiato (assumiamo sia nel grado o altro campo)
    // Per ora saltiamo questa validazione, ma puoi implementarla se hai il campo genere
    
    // VALIDAZIONE 4: Genere camera deve essere compatibile
    // (se implementi il genere alloggiato, controlla qui)
    
    // Crea assegnazione
    const nuovaAssegnazione = await Assegnazione.create({
      matricola_alloggiato: matricola_alloggiato,
      id_camera: parseInt(id_camera),
      data_assegnazione: data_assegnazione || new Date(),
      data_uscita: null,
      note: note || null
    });
    
    // Recupera assegnazione completa con relazioni
    const assegnazioneCompleta = await Assegnazione.findByPk(nuovaAssegnazione.id, {
      include: [
        {
          model: Alloggiato,
          as: 'alloggiato',
          include: [
            {
              model: Grado,
              as: 'grado',
              include: [
                {
                  model: Categoria,
                  as: 'categoria'
                }
              ]
            }
          ]
        },
        {
          model: Camera,
          as: 'camera',
          include: [
            {
              model: Categoria,
              as: 'categoria'
            }
          ]
        }
      ]
    });
    
    res.status(201).json({
      success: true,
      message: 'Assegnazione creata con successo',
      data: assegnazioneCompleta
    });
    
  } catch (error) {
    console.error('Errore createAssegnazione:', error);
    res.status(500).json({
      success: false,
      error: 'Errore nella creazione dell\'assegnazione',
      message: error.message
    });
  }
};

// DELETE - Rimuovi assegnazione (rimuovi alloggiato da camera)
exports.deleteAssegnazione = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Trova assegnazione
    const assegnazione = await Assegnazione.findByPk(id, {
      include: ['alloggiato', 'camera']
    });
    
    if (!assegnazione) {
      return res.status(404).json({
        success: false,
        error: 'Assegnazione non trovata'
      });
    }
    
    // Verifica che sia attiva
    if (assegnazione.data_uscita !== null) {
      return res.status(400).json({
        success: false,
        error: 'L\'assegnazione è già stata chiusa'
      });
    }
    
    // Elimina assegnazione
    await assegnazione.destroy();
    
    res.json({
      success: true,
      message: 'Alloggiato rimosso dalla camera con successo',
      alloggiato: assegnazione.alloggiato.matricola,
      camera: assegnazione.camera.numero_camera
    });
    
  } catch (error) {
    console.error('Errore deleteAssegnazione:', error);
    res.status(500).json({
      success: false,
      error: 'Errore nella rimozione dell\'assegnazione',
      message: error.message
    });
  }
};

// POST - Sposta alloggiato da una camera all'altra
exports.spostaAlloggiato = async (req, res) => {
  try {
    const { matricola_alloggiato, id_camera_destinazione, note } = req.body;
    
    // Validazioni
    if (!matricola_alloggiato || !id_camera_destinazione) {
      return res.status(400).json({
        success: false,
        error: 'Campi obbligatori mancanti',
        required: ['matricola_alloggiato', 'id_camera_destinazione']
      });
    }
    
    // Trova assegnazione corrente
    const assegnazioneCorrente = await Assegnazione.findOne({
      where: {
        matricola_alloggiato: matricola_alloggiato,
        data_uscita: null
      },
      include: ['camera']
    });
    
    if (!assegnazioneCorrente) {
      return res.status(404).json({
        success: false,
        error: 'L\'alloggiato non ha una camera assegnata'
      });
    }
    
    // Verifica che la camera destinazione sia diversa
    if (assegnazioneCorrente.id_camera === parseInt(id_camera_destinazione)) {
      return res.status(400).json({
        success: false,
        error: 'L\'alloggiato è già in questa camera'
      });
    }
    
    // Verifica camera destinazione
    const cameraDestinazione = await Camera.findByPk(id_camera_destinazione, {
      include: [
        {
          model: Assegnazione,
          as: 'assegnazioni',
          where: { data_uscita: null },
          required: false
        }
      ]
    });
    
    if (!cameraDestinazione) {
      return res.status(404).json({
        success: false,
        error: 'Camera destinazione non trovata'
      });
    }
    
    // Verifica posti disponibili in camera destinazione
    const postiOccupati = cameraDestinazione.assegnazioni.length;
    const postiDisponibili = cameraDestinazione.nr_posti - postiOccupati;
    
    if (postiDisponibili <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Camera destinazione completa',
        posti_totali: cameraDestinazione.nr_posti,
        posti_occupati: postiOccupati
      });
    }
    
    // Elimina assegnazione vecchia
    await assegnazioneCorrente.destroy();
    
    // Crea nuova assegnazione
    const nuovaAssegnazione = await Assegnazione.create({
      matricola_alloggiato: matricola_alloggiato,
      id_camera: parseInt(id_camera_destinazione),
      data_assegnazione: new Date(),
      data_uscita: null,
      note: note || `Spostato da camera ${assegnazioneCorrente.camera.numero_camera}`
    });
    
    // Recupera assegnazione completa
    const assegnazioneCompleta = await Assegnazione.findByPk(nuovaAssegnazione.id, {
      include: ['alloggiato', 'camera']
    });
    
    res.json({
      success: true,
      message: 'Alloggiato spostato con successo',
      camera_precedente: assegnazioneCorrente.camera.numero_camera,
      camera_nuova: cameraDestinazione.numero_camera,
      data: assegnazioneCompleta
    });
    
  } catch (error) {
    console.error('Errore spostaAlloggiato:', error);
    res.status(500).json({
      success: false,
      error: 'Errore nello spostamento dell\'alloggiato',
      message: error.message
    });
  }
};

// GET - Occupazione camera specifica
exports.getOccupazioneCamera = async (req, res) => {
  try {
    const { id_camera } = req.params;
    
    const camera = await Camera.findByPk(id_camera, {
      include: [
        {
          model: Assegnazione,
          as: 'assegnazioni',
          where: { data_uscita: null },
          required: false,
          include: [
            {
              model: Alloggiato,
              as: 'alloggiato',
              include: [
                {
                  model: Grado,
                  as: 'grado',
                  include: [
                    {
                      model: Categoria,
                      as: 'categoria'
                    }
                  ]
                }
              ]
            }
          ]
        },
        {
          model: Categoria,
          as: 'categoria'
        }
      ]
    });
    
    if (!camera) {
      return res.status(404).json({
        success: false,
        error: 'Camera non trovata'
      });
    }
    
    const postiOccupati = camera.assegnazioni.length;
    const postiLiberi = camera.nr_posti - postiOccupati;
    
    res.json({
      success: true,
      data: {
        camera: {
          id: camera.id,
          numero_camera: camera.numero_camera,
          edificio: camera.edificio,
          piano: camera.piano,
          ala: camera.ala,
          genere: camera.genere,
          categoria: camera.categoria
        },
        posti_totali: camera.nr_posti,
        posti_occupati: postiOccupati,
        posti_liberi: postiLiberi,
        stato: postiOccupati === 0 ? 'Libera' : 
               postiOccupati < camera.nr_posti ? 'Parziale' : 'Completa',
        alloggiati: camera.assegnazioni.map(a => ({
          matricola: a.alloggiato.matricola,
          cognome: a.alloggiato.cognome,
          nome: a.alloggiato.nome,
          grado: a.alloggiato.grado.descrizione,
          categoria: a.alloggiato.grado.categoria.descrizione,
          data_assegnazione: a.data_assegnazione
        }))
      }
    });
    
  } catch (error) {
    console.error('Errore getOccupazioneCamera:', error);
    res.status(500).json({
      success: false,
      error: 'Errore nel recupero dell\'occupazione della camera',
      message: error.message
    });
  }
};