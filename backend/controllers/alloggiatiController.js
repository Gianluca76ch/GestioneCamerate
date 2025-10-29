const { Alloggiato, Grado, Categoria, Assegnazione, Camera } = require('../models');
const { Op } = require('sequelize');

// GET - Lista tutti gli alloggiati con filtri opzionali
exports.getAllAlloggiati = async (req, res) => {
  try {
    const { grado, categoria, reparto, cognome, con_camera, senza_camera } = req.query;
    
    let whereClause = {};
    let includeAssegnazioni = {
      model: Assegnazione,
      as: 'assegnazioni',
      where: { data_uscita: null },
      required: false,
      include: [
        {
          model: Camera,
          as: 'camera',
          attributes: ['id', 'numero_camera', 'edificio', 'piano']
        }
      ]
    };
    
    // Filtri
    if (grado) whereClause.id_grado = parseInt(grado);
    if (cognome) {
      whereClause.cognome = { [Op.like]: `%${cognome}%` };
    }
    if (reparto) {
      whereClause.codice_reparto = { [Op.like]: `%${reparto}%` };
    }
    
    const alloggiati = await Alloggiato.findAll({
      where: whereClause,
      include: [
        {
          model: Grado,
          as: 'grado',
          attributes: ['id', 'codice', 'descrizione'],
          include: [
            {
              model: Categoria,
              as: 'categoria',
              attributes: ['id', 'codice', 'descrizione'],
              ...(categoria && { where: { id: parseInt(categoria) } })
            }
          ]
        },
        includeAssegnazioni
      ],
      order: [
        ['cognome', 'ASC'],
        ['nome', 'ASC']
      ]
    });
    
    // Filtra per presenza/assenza camera
    let risultato = alloggiati;
    if (con_camera === 'true') {
      risultato = alloggiati.filter(a => a.assegnazioni && a.assegnazioni.length > 0);
    } else if (senza_camera === 'true') {
      risultato = alloggiati.filter(a => !a.assegnazioni || a.assegnazioni.length === 0);
    }
    
    // Aggiungi info camera corrente
    const alloggiatiConInfo = risultato.map(alloggiato => {
      const alloggiatoJson = alloggiato.toJSON();
      const assegnazioneAttiva = alloggiatoJson.assegnazioni && alloggiatoJson.assegnazioni.length > 0 
        ? alloggiatoJson.assegnazioni[0] 
        : null;
      
      return {
        ...alloggiatoJson,
        camera_corrente: assegnazioneAttiva ? assegnazioneAttiva.camera : null,
        ha_camera: !!assegnazioneAttiva
      };
    });
    
    res.json({
      success: true,
      count: alloggiatiConInfo.length,
      data: alloggiatiConInfo
    });
    
  } catch (error) {
    console.error('Errore getAllAlloggiati:', error);
    res.status(500).json({
      success: false,
      error: 'Errore nel recupero degli alloggiati',
      message: error.message
    });
  }
};

// GET - Dettaglio singolo alloggiato
exports.getAlloggiatoById = async (req, res) => {
  try {
    const { matricola } = req.params;
    
    const alloggiato = await Alloggiato.findByPk(matricola, {
      include: [
        {
          model: Grado,
          as: 'grado',
          attributes: ['id', 'codice', 'descrizione'],
          include: [
            {
              model: Categoria,
              as: 'categoria',
              attributes: ['id', 'codice', 'descrizione']
            }
          ]
        },
        {
          model: Assegnazione,
          as: 'assegnazioni',
          where: { data_uscita: null },
          required: false,
          include: [
            {
              model: Camera,
              as: 'camera',
              attributes: ['id', 'numero_camera', 'edificio', 'piano', 'ala']
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
    
    const alloggiatoJson = alloggiato.toJSON();
    const assegnazioneAttiva = alloggiatoJson.assegnazioni && alloggiatoJson.assegnazioni.length > 0 
      ? alloggiatoJson.assegnazioni[0] 
      : null;
    
    res.json({
      success: true,
      data: {
        ...alloggiatoJson,
        camera_corrente: assegnazioneAttiva ? assegnazioneAttiva.camera : null,
        ha_camera: !!assegnazioneAttiva
      }
    });
    
  } catch (error) {
    console.error('Errore getAlloggiatoById:', error);
    res.status(500).json({
      success: false,
      error: 'Errore nel recupero dell\'alloggiato',
      message: error.message
    });
  }
};

// POST - Crea nuovo alloggiato
exports.createAlloggiato = async (req, res) => {
  try {
    const { 
      matricola, 
      id_grado, 
      cognome, 
      nome, 
      telefono, 
      codice_reparto, 
      descrizione_reparto 
    } = req.body;
    
    // Validazioni
    if (!matricola || !id_grado || !cognome || !nome) {
      return res.status(400).json({
        success: false,
        error: 'Campi obbligatori mancanti',
        required: ['matricola', 'id_grado', 'cognome', 'nome']
      });
    }
    
    // Verifica che grado esista
    const grado = await Grado.findByPk(id_grado);
    if (!grado) {
      return res.status(400).json({
        success: false,
        error: 'Grado non valido'
      });
    }
    
    // Verifica che matricola sia univoca
    const existingAlloggiato = await Alloggiato.findByPk(matricola);
    if (existingAlloggiato) {
      return res.status(400).json({
        success: false,
        error: `La matricola "${matricola}" è già in uso`
      });
    }
    
    // Crea alloggiato
    const nuovoAlloggiato = await Alloggiato.create({
      matricola: matricola.trim(),
      id_grado: parseInt(id_grado),
      cognome: cognome.trim(),
      nome: nome.trim(),
      telefono: telefono ? telefono.trim() : null,
      codice_reparto: codice_reparto ? codice_reparto.trim() : null,
      descrizione_reparto: descrizione_reparto ? descrizione_reparto.trim() : null
    });
    
    // Recupera alloggiato con relazioni
    const alloggiatoCompleto = await Alloggiato.findByPk(nuovoAlloggiato.matricola, {
      include: [
        {
          model: Grado,
          as: 'grado',
          attributes: ['id', 'codice', 'descrizione'],
          include: [
            {
              model: Categoria,
              as: 'categoria',
              attributes: ['id', 'codice', 'descrizione']
            }
          ]
        }
      ]
    });
    
    res.status(201).json({
      success: true,
      message: 'Alloggiato creato con successo',
      data: alloggiatoCompleto
    });
    
  } catch (error) {
    console.error('Errore createAlloggiato:', error);
    res.status(500).json({
      success: false,
      error: 'Errore nella creazione dell\'alloggiato',
      message: error.message
    });
  }
};

// PUT - Modifica alloggiato esistente
exports.updateAlloggiato = async (req, res) => {
  try {
    const { matricola } = req.params;
    const { 
      id_grado, 
      cognome, 
      nome, 
      telefono, 
      codice_reparto, 
      descrizione_reparto 
    } = req.body;
    
    // Trova alloggiato
    const alloggiato = await Alloggiato.findByPk(matricola);
    
    if (!alloggiato) {
      return res.status(404).json({
        success: false,
        error: 'Alloggiato non trovato'
      });
    }
    
    // Se si modifica grado, verifica che esista
    if (id_grado) {
      const grado = await Grado.findByPk(id_grado);
      if (!grado) {
        return res.status(400).json({
          success: false,
          error: 'Grado non valido'
        });
      }
    }
    
    // Aggiorna alloggiato
    await alloggiato.update({
      id_grado: id_grado || alloggiato.id_grado,
      cognome: cognome ? cognome.trim() : alloggiato.cognome,
      nome: nome ? nome.trim() : alloggiato.nome,
      telefono: telefono !== undefined ? (telefono ? telefono.trim() : null) : alloggiato.telefono,
      codice_reparto: codice_reparto !== undefined ? (codice_reparto ? codice_reparto.trim() : null) : alloggiato.codice_reparto,
      descrizione_reparto: descrizione_reparto !== undefined ? (descrizione_reparto ? descrizione_reparto.trim() : null) : alloggiato.descrizione_reparto
    });
    
    // Recupera alloggiato aggiornato
    const alloggiatoAggiornato = await Alloggiato.findByPk(matricola, {
      include: [
        {
          model: Grado,
          as: 'grado',
          attributes: ['id', 'codice', 'descrizione'],
          include: [
            {
              model: Categoria,
              as: 'categoria',
              attributes: ['id', 'codice', 'descrizione']
            }
          ]
        }
      ]
    });
    
    res.json({
      success: true,
      message: 'Alloggiato aggiornato con successo',
      data: alloggiatoAggiornato
    });
    
  } catch (error) {
    console.error('Errore updateAlloggiato:', error);
    res.status(500).json({
      success: false,
      error: 'Errore nell\'aggiornamento dell\'alloggiato',
      message: error.message
    });
  }
};

// DELETE - Elimina alloggiato
exports.deleteAlloggiato = async (req, res) => {
  try {
    const { matricola } = req.params;
    
    // Trova alloggiato
    const alloggiato = await Alloggiato.findByPk(matricola, {
      include: [
        {
          model: Assegnazione,
          as: 'assegnazioni',
          where: { data_uscita: null },
          required: false
        }
      ]
    });
    
    if (!alloggiato) {
      return res.status(404).json({
        success: false,
        error: 'Alloggiato non trovato'
      });
    }
    
    // Verifica che non abbia assegnazioni attive
    if (alloggiato.assegnazioni && alloggiato.assegnazioni.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Impossibile eliminare: l\'alloggiato è assegnato a una camera. Rimuoverlo prima dalla camera.'
      });
    }
    
    // Elimina alloggiato
    await alloggiato.destroy();
    
    res.json({
      success: true,
      message: 'Alloggiato eliminato con successo'
    });
    
  } catch (error) {
    console.error('Errore deleteAlloggiato:', error);
    res.status(500).json({
      success: false,
      error: 'Errore nell\'eliminazione dell\'alloggiato',
      message: error.message
    });
  }
};

// GET - Statistiche alloggiati
exports.getStats = async (req, res) => {
  try {
    const alloggiati = await Alloggiato.findAll({
      include: [
        {
          model: Grado,
          as: 'grado',
          include: [
            {
              model: Categoria,
              as: 'categoria',
              attributes: ['id', 'codice', 'descrizione']
            }
          ]
        },
        {
          model: Assegnazione,
          as: 'assegnazioni',
          where: { data_uscita: null },
          required: false
        }
      ]
    });
    
    // Calcola statistiche generali
    let totaleAlloggiati = alloggiati.length;
    let alloggiatiConCamera = 0;
    let alloggiatiSenzaCamera = 0;
    
    // Statistiche per categoria
    const statPerCategoria = {};
    
    alloggiati.forEach(alloggiato => {
      const haCamera = alloggiato.assegnazioni && alloggiato.assegnazioni.length > 0;
      
      if (haCamera) alloggiatiConCamera++;
      else alloggiatiSenzaCamera++;
      
      // Per categoria
      const catCodice = alloggiato.grado.categoria.codice;
      if (!statPerCategoria[catCodice]) {
        statPerCategoria[catCodice] = {
          categoria: alloggiato.grado.categoria.descrizione,
          totale: 0,
          con_camera: 0,
          senza_camera: 0
        };
      }
      
      statPerCategoria[catCodice].totale++;
      if (haCamera) statPerCategoria[catCodice].con_camera++;
      else statPerCategoria[catCodice].senza_camera++;
    });
    
    res.json({
      success: true,
      data: {
        generale: {
          totale_alloggiati: totaleAlloggiati,
          con_camera: alloggiatiConCamera,
          senza_camera: alloggiatiSenzaCamera
        },
        per_categoria: statPerCategoria
      }
    });
    
  } catch (error) {
    console.error('Errore getStats:', error);
    res.status(500).json({
      success: false,
      error: 'Errore nel calcolo delle statistiche',
      message: error.message
    });
  }
};