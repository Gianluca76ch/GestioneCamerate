const { Camera, Categoria, Assegnazione, Alloggiato, Grado } = require("../models");
const { Op } = require("sequelize");

// GET - Lista tutte le camere con filtri opzionali
exports.getAllCamere = async (req, res) => {
  try {
    const { edificio, piano, genere, categoria, disponibili } = req.query;

    let whereClause = {};

    // Filtri
    if (edificio) whereClause.edificio = edificio;
    if (piano) whereClause.piano = parseInt(piano);
    if (genere) whereClause.genere = genere;
    if (categoria) whereClause.id_categoria = parseInt(categoria);

    const camere = await Camera.findAll({
      where: whereClause,
      include: [
        {
          model: Categoria,
          as: "categoria",
          attributes: ["id", "codice", "descrizione"],
        },
        {
          model: Assegnazione,
          as: "assegnazioni",
          required: false,
          where: { data_uscita: null },
          attributes: ["id", "matricola_alloggiato", "data_assegnazione"],
          include: [
            {
              model: Alloggiato,
              as: "alloggiato",
              attributes: ["matricola", "cognome", "nome"],
              include: [
                {
                  model: Grado,
                  as: "grado",
                  attributes: ["descrizione"],
                  include: [
                    {
                      model: Categoria,
                      as: "categoria",
                      attributes: ["descrizione"],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
      order: [
        ["edificio", "ASC"],
        ["piano", "ASC"],
        ["numero_camera", "ASC"],
      ],
    });

    // Calcola disponibilità
    const camereConDisponibilita = camere.map((camera) => {
      const cameraJson = camera.toJSON();
      const postiOccupati = cameraJson.assegnazioni
        ? cameraJson.assegnazioni.length
        : 0;
      const postiLiberi = cameraJson.nr_posti - postiOccupati;

      return {
        ...cameraJson,
        posti_occupati: postiOccupati,
        posti_liberi: postiLiberi,
        stato:
          postiOccupati === 0
            ? "Libera"
            : postiOccupati < cameraJson.nr_posti
            ? "Parziale"
            : "Completa",
      };
    });

    // Filtro camere disponibili se richiesto
    let risultato = camereConDisponibilita;
    if (disponibili === "true") {
      risultato = camereConDisponibilita.filter((c) => c.posti_liberi > 0);
    }

    res.json({
      success: true,
      count: risultato.length,
      data: risultato,
    });
  } catch (error) {
    console.error("Errore getAllCamere:", error);
    res.status(500).json({
      success: false,
      error: "Errore nel recupero delle camere",
      message: error.message,
    });
  }
};

// GET - Dettaglio singola camera
exports.getCameraById = async (req, res) => {
  try {
    const { id } = req.params;

    const camera = await Camera.findByPk(id, {
      include: [
        {
          model: Categoria,
          as: "categoria",
          attributes: ["id", "codice", "descrizione"],
        },
        {
          model: Assegnazione,
          as: "assegnazioni",
          where: { data_uscita: null },
          required: false,
          include: ["alloggiato"],
        },
      ],
    });

    if (!camera) {
      return res.status(404).json({
        success: false,
        error: "Camera non trovata",
      });
    }

    const cameraJson = camera.toJSON();
    const postiOccupati = cameraJson.assegnazioni
      ? cameraJson.assegnazioni.length
      : 0;

    res.json({
      success: true,
      data: {
        ...cameraJson,
        posti_occupati: postiOccupati,
        posti_liberi: cameraJson.nr_posti - postiOccupati,
      },
    });
  } catch (error) {
    console.error("Errore getCameraById:", error);
    res.status(500).json({
      success: false,
      error: "Errore nel recupero della camera",
      message: error.message,
    });
  }
};

// POST - Crea nuova camera
exports.createCamera = async (req, res) => {
  try {
    const {
      numero_camera,
      piano,
      ala,
      edificio,
      nr_posti,
      genere,
      id_categoria,
      note,
      agibile,
      manutenzione,
    } = req.body;

    // Validazioni
    if (
      !numero_camera ||
      !piano ||
      !edificio ||
      !nr_posti ||
      !genere ||
      !id_categoria
    ) {
      return res.status(400).json({
        success: false,
        error: "Campi obbligatori mancanti",
        required: [
          "numero_camera",
          "piano",
          "edificio",
          "nr_posti",
          "genere",
          "id_categoria",
        ],
      });
    }

    // Verifica che categoria esista
    const categoria = await Categoria.findByPk(id_categoria);
    if (!categoria) {
      return res.status(400).json({
        success: false,
        error: "Categoria non valida",
      });
    }

    // Verifica che numero_camera sia univoco
    const existingCamera = await Camera.findOne({ where: { numero_camera } });
    if (existingCamera) {
      return res.status(400).json({
        success: false,
        error: `Il numero camera "${numero_camera}" è già in uso`,
      });
    }

    // Crea camera
    const nuovaCamera = await Camera.create({
      numero_camera,
      piano: parseInt(piano),
      ala,
      edificio,
      nr_posti: parseInt(nr_posti),
      genere,
      id_categoria: parseInt(id_categoria),
      note,
      agibile: agibile !== undefined ? agibile : true,
      manutenzione: manutenzione !== undefined ? manutenzione : false,
    });

    // Recupera camera con relazioni
    const cameraCompleta = await Camera.findByPk(nuovaCamera.id, {
      include: [
        {
          model: Categoria,
          as: "categoria",
          attributes: ["id", "codice", "descrizione"],
        },
      ],
    });

    res.status(201).json({
      success: true,
      message: "Camera creata con successo",
      data: cameraCompleta,
    });
  } catch (error) {
    console.error("Errore createCamera:", error);
    res.status(500).json({
      success: false,
      error: "Errore nella creazione della camera",
      message: error.message,
    });
  }
};

// PUT - Modifica camera esistente
exports.updateCamera = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      numero_camera,
      piano,
      ala,
      edificio,
      nr_posti,
      genere,
      id_categoria,
      note,
      agibile,
      manutenzione,
    } = req.body;

    // Trova camera
    const camera = await Camera.findByPk(id, {
      include: [
        {
          model: Assegnazione,
          as: "assegnazioni",
          where: { data_uscita: null },
          required: false,
        },
      ],
    });

    if (!camera) {
      return res.status(404).json({
        success: false,
        error: "Camera non trovata",
      });
    }

    // Se si modifica nr_posti, verifica che non sia inferiore agli alloggiati attuali
    if (nr_posti && nr_posti < camera.assegnazioni.length) {
      return res.status(400).json({
        success: false,
        error: `Impossibile ridurre i posti a ${nr_posti}. Ci sono ${camera.assegnazioni.length} alloggiati assegnati`,
      });
    }

    // Se si modifica numero_camera, verifica univocità
    if (numero_camera && numero_camera !== camera.numero_camera) {
      const existingCamera = await Camera.findOne({ where: { numero_camera } });
      if (existingCamera) {
        return res.status(400).json({
          success: false,
          error: `Il numero camera "${numero_camera}" è già in uso`,
        });
      }
    }

    // Se si modifica categoria, verifica che esista
    if (id_categoria) {
      const categoria = await Categoria.findByPk(id_categoria);
      if (!categoria) {
        return res.status(400).json({
          success: false,
          error: "Categoria non valida",
        });
      }
    }

    // Aggiorna camera
    await camera.update({
      numero_camera: numero_camera || camera.numero_camera,
      piano: piano !== undefined ? parseInt(piano) : camera.piano,
      ala: ala !== undefined ? ala : camera.ala,
      edificio: edificio || camera.edificio,
      nr_posti: nr_posti !== undefined ? parseInt(nr_posti) : camera.nr_posti,
      genere: genere || camera.genere,
      id_categoria: id_categoria || camera.id_categoria,
      note: note !== undefined ? note : camera.note,
      agibile: agibile !== undefined ? agibile : camera.agibile,
      manutenzione:
        manutenzione !== undefined ? manutenzione : camera.manutenzione,
    });

    // Recupera camera aggiornata
    const cameraAggiornata = await Camera.findByPk(id, {
      include: [
        {
          model: Categoria,
          as: "categoria",
          attributes: ["id", "codice", "descrizione"],
        },
      ],
    });

    res.json({
      success: true,
      message: "Camera aggiornata con successo",
      data: cameraAggiornata,
    });
  } catch (error) {
    console.error("Errore updateCamera:", error);
    res.status(500).json({
      success: false,
      error: "Errore nell'aggiornamento della camera",
      message: error.message,
    });
  }
};

// GET - Statistiche camere
exports.getStats = async (req, res) => {
  try {
    const camere = await Camera.findAll({
      include: [
        {
          model: Categoria,
          as: "categoria",
          attributes: ["id", "codice", "descrizione"],
        },
        {
          model: Assegnazione,
          as: "assegnazioni",
          where: { data_uscita: null },
          required: false,
        },
      ],
    });

    // Calcola statistiche generali
    let totalePosti = 0;
    let postiOccupati = 0;
    let camereLibere = 0;
    let camereParziali = 0;
    let camereComplete = 0;
    let camereNonAgibili = 0;
    let camereInManutenzione = 0;

    // Statistiche per categoria
    const statPerCategoria = {};

    camere.forEach((camera) => {
      const posti = camera.nr_posti;
      const occupati = camera.assegnazioni.length;

      totalePosti += posti;
      postiOccupati += occupati;

      if (occupati === 0) camereLibere++;
      else if (occupati < posti) camereParziali++;
      else camereComplete++;

      if (camera.agibile === false) camereNonAgibili++;
      if (camera.manutenzione === true) camereInManutenzione++;

      // Per categoria
      const catId = camera.categoria.codice;
      if (!statPerCategoria[catId]) {
        statPerCategoria[catId] = {
          categoria: camera.categoria.descrizione,
          totale_camere: 0,
          totale_posti: 0,
          posti_occupati: 0,
          posti_liberi: 0,
        };
      }

      statPerCategoria[catId].totale_camere++;
      statPerCategoria[catId].totale_posti += posti;
      statPerCategoria[catId].posti_occupati += occupati;
      statPerCategoria[catId].posti_liberi += posti - occupati;
    });

    res.json({
      success: true,
      data: {
        generale: {
          totale_camere: camere.length,
          totale_posti: totalePosti,
          posti_occupati: postiOccupati,
          posti_liberi: totalePosti - postiOccupati,
          camere_libere: camereLibere,
          camere_parziali: camereParziali,
          camere_complete: camereComplete,
          camere_non_agibili: camereNonAgibili,
          camere_in_manutenzione: camereInManutenzione,
        },
        per_categoria: Object.values(statPerCategoria),
      },
    });
  } catch (error) {
    console.error("Errore getStats:", error);
    res.status(500).json({
      success: false,
      error: "Errore nel calcolo delle statistiche",
      message: error.message,
    });
  }
};

// GET - Camere disponibili (con posti liberi)
exports.getCamereDisponibili = async (req, res) => {
  try {
    const { genere, categoria } = req.query;

    let whereClause = {};
    if (genere) whereClause.genere = genere;
    if (categoria) whereClause.id_categoria = parseInt(categoria);

    const camere = await Camera.findAll({
      where: whereClause,
      include: [
        {
          model: Categoria,
          as: "categoria",
          attributes: ["id", "codice", "descrizione"],
        },
        {
          model: Assegnazione,
          as: "assegnazioni",
          where: { data_uscita: null },
          required: false,
        },
      ],
    });

    // Filtra solo camere con posti disponibili
    const camereDisponibili = camere
      .map((camera) => {
        const cameraJson = camera.toJSON();
        const postiOccupati = cameraJson.assegnazioni
          ? cameraJson.assegnazioni.length
          : 0;
        const postiLiberi = cameraJson.nr_posti - postiOccupati;

        return {
          ...cameraJson,
          posti_occupati: postiOccupati,
          posti_liberi: postiLiberi,
        };
      })
      .filter((camera) => camera.posti_liberi > 0);

    res.json({
      success: true,
      count: camereDisponibili.length,
      data: camereDisponibili,
    });
  } catch (error) {
    console.error("Errore getCamereDisponibili:", error);
    res.status(500).json({
      success: false,
      error: "Errore nel recupero delle camere disponibili",
      message: error.message,
    });
  }
};
