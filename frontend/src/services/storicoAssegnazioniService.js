import api from './api'; // Assumo che tu abbia già un file api.js configurato

// Service per gestire lo storico assegnazioni
const storicoAssegnazioniService = {
  
  // Sposta assegnazione nello storico (elimina dalla camera)
  spostaInStorico: async (idAssegnazione, dataUscita, note, inseritoDa) => {
    try {
      const response = await api.post('/storico-assegnazioni/sposta-in-storico', {
        id_assegnazione: idAssegnazione,
        data_uscita: dataUscita,
        note: note,
        inserito_da: inseritoDa
      });
      return response;
    } catch (error) {
      console.error('Errore nello spostamento in storico:', error);
      throw error;
    }
  },

  // Ottieni tutto lo storico con filtri opzionali
  getStorico: async (filtri = {}) => {
    try {
      const params = new URLSearchParams();
      
      if (filtri.matricola) params.append('matricola_alloggiato', filtri.matricola);
      if (filtri.idCamera) params.append('id_camera', filtri.idCamera);
      if (filtri.numeroCamera) params.append('numero_camera', filtri.numeroCamera);
      if (filtri.grado) params.append('grado', filtri.grado);
      if (filtri.edificio) params.append('edificio', filtri.edificio);
      if (filtri.dataEntrataDa) params.append('data_entrata_da', filtri.dataEntrataDa);
      if (filtri.dataEntrataA) params.append('data_entrata_a', filtri.dataEntrataA);
      if (filtri.dataUscitaDa) params.append('data_uscita_da', filtri.dataUscitaDa);
      if (filtri.dataUscitaA) params.append('data_uscita_a', filtri.dataUscitaA);
      
      const queryString = params.toString();
      const url = queryString ? `/storico-assegnazioni?${queryString}` : '/storico-assegnazioni';
      
      const response = await api.get(url);
      return response;
    } catch (error) {
      console.error('Errore nel recupero dello storico:', error);
      throw error;
    }
  },

  // Ottieni storico per un militare specifico
  getStoricoByMatricola: async (matricola) => {
    try {
      const response = await api.get(`/storico-assegnazioni/militare/${matricola}`);
      return response;
    } catch (error) {
      console.error('Errore nel recupero dello storico del militare:', error);
      throw error;
    }
  },

  // Ottieni storico per una camera specifica
  getStoricoByCamera: async (idCamera) => {
    try {
      const response = await api.get(`/storico-assegnazioni/camera/${idCamera}`);
      return response;
    } catch (error) {
      console.error('Errore nel recupero dello storico della camera:', error);
      throw error;
    }
  },

  // Ottieni statistiche dello storico
  getStats: async (anno = null, mese = null) => {
    try {
      let url = '/storico-assegnazioni/stats';
      const params = new URLSearchParams();
      
      if (anno) params.append('anno', anno);
      if (mese) params.append('mese', mese);
      
      const queryString = params.toString();
      if (queryString) url += `?${queryString}`;
      
      const response = await api.get(url);
      return response;
    } catch (error) {
      console.error('Errore nel recupero delle statistiche:', error);
      throw error;
    }
  },

  // Elimina record dallo storico (solo admin)
  deleteFromStorico: async (id) => {
    try {
      const response = await api.delete(`/storico-assegnazioni/${id}`);
      return response;
    } catch (error) {
      console.error('Errore nell\'eliminazione dallo storico:', error);
      throw error;
    }
  },

  // Esporta storico in CSV
  exportToCSV: (storicoData) => {
    const headers = [
      'Matricola',
      'Grado',
      'Cognome',
      'Nome',
      'Camera',
      'Edificio',
      'Piano',
      'Data Entrata',
      'Data Uscita',
      'Durata (giorni)',
      'Note',
      'Inserito da'
    ];

    const rows = storicoData.map(record => {
      const dataEntrata = new Date(record.data_entrata);
      const dataUscita = new Date(record.data_uscita);
      const durata = Math.floor((dataUscita - dataEntrata) / (1000 * 60 * 60 * 24));

      return [
        record.matricola_alloggiato,
        record.grado,
        record.cognome,
        record.nome,
        record.numero_camera,
        record.edificio || '',
        record.piano || '',
        record.data_entrata,
        record.data_uscita,
        durata,
        record.note || '',
        record.inserito_da || ''
      ];
    });

    let csv = headers.join(',') + '\n';
    rows.forEach(row => {
      csv += row.map(cell => `"${cell}"`).join(',') + '\n';
    });

    // Crea e scarica il file
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `storico_assegnazioni_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

export default storicoAssegnazioniService;