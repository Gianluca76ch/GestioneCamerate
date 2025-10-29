import api from './api';

export const getAllCamere = async (filtri = {}) => {
  const params = new URLSearchParams();
  
  if (filtri.edificio) params.append('edificio', filtri.edificio);
  if (filtri.piano) params.append('piano', filtri.piano);
  if (filtri.ala) params.append('ala', filtri.ala);
  if (filtri.genere) params.append('genere', filtri.genere);
  if (filtri.id_categoria) params.append('id_categoria', filtri.id_categoria);
  if (filtri.stato) params.append('stato', filtri.stato);
  
  const response = await api.get(`/camere?${params.toString()}`);
  return response.data;
};

export const getCameraById = async (id) => {
  const response = await api.get(`/camere/${id}`);
  return response.data;
};

export const createCamera = async (cameraData) => {
  const response = await api.post('/camere', cameraData);
  return response.data;
};

export const updateCamera = async (id, cameraData) => {
  const response = await api.put(`/camere/${id}`, cameraData);
  return response.data;
};

export const deleteCamera = async (id) => {
  const response = await api.delete(`/camere/${id}`);
  return response.data;
};

export const getCamereDisponibili = async (filtri = {}) => {
  const params = new URLSearchParams();
  if (filtri.genere) params.append('genere', filtri.genere);
  if (filtri.id_categoria) params.append('id_categoria', filtri.id_categoria);
  
  const response = await api.get(`/camere/disponibili?${params.toString()}`);
  return response.data;
};

export const getStatsCamere = async () => {
  const response = await api.get('/camere/stats');
  return response.data;
};