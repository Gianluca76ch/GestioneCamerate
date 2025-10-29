import api from './api';

export const getAllAlloggiati = async (filtri = {}) => {
  const params = new URLSearchParams();
  
  if (filtri.grado) params.append('grado', filtri.grado);
  if (filtri.categoria) params.append('categoria', filtri.categoria);
  if (filtri.reparto) params.append('reparto', filtri.reparto);
  if (filtri.cognome) params.append('cognome', filtri.cognome);
  if (filtri.con_camera) params.append('con_camera', filtri.con_camera);
  if (filtri.senza_camera) params.append('senza_camera', filtri.senza_camera);
  
  const response = await api.get(`/alloggiati?${params.toString()}`);
  return response.data;
};

export const getAlloggiatoById = async (matricola) => {
  const response = await api.get(`/alloggiati/${matricola}`);
  return response.data;
};

export const createAlloggiato = async (alloggiatoData) => {
  const response = await api.post('/alloggiati', alloggiatoData);
  return response.data;
};

export const updateAlloggiato = async (matricola, alloggiatoData) => {
  const response = await api.put(`/alloggiati/${matricola}`, alloggiatoData);
  return response.data;
};

export const deleteAlloggiato = async (matricola) => {
  const response = await api.delete(`/alloggiati/${matricola}`);
  return response.data;
};

export const getStatsAlloggiati = async () => {
  const response = await api.get('/alloggiati/stats');
  return response.data;
};