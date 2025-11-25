import api from './api';

export const getAllAssegnazioni = async (filtri = {}) => {
  const params = new URLSearchParams();
  
  if (filtri.id_camera) params.append('id_camera', filtri.id_camera);
  if (filtri.matricola_alloggiato) params.append('matricola_alloggiato', filtri.matricola_alloggiato);
  if (filtri.attive !== undefined) params.append('attive', filtri.attive);
  
  const response = await api.get(`/assegnazioni?${params.toString()}`);
  return response.data;
};

export const getAssegnazioneById = async (id) => {
  const response = await api.get(`/assegnazioni/${id}`);
  return response.data;
};

export const createAssegnazione = async (assegnazioneData) => {
  const response = await api.post('/assegnazioni', assegnazioneData);
  return response.data;
};

export const deleteAssegnazione = async (id) => {
  const response = await api.delete(`/assegnazioni/${id}`);
  return response.data;
};

export const spostaAlloggiato = async (spostaData) => {
  const response = await api.post('/assegnazioni/sposta', spostaData);
  return response.data;
};

export const getOccupazioneCamera = async (idCamera) => {
  const response = await api.get(`/assegnazioni/camera/${idCamera}`);
  return response.data;
};

export const updateAssegnazione = async (id, data) => {
  const response = await api.put(`/assegnazioni/${id}`, data);
  return response.data;
};