import api from './api';

export const getAllGradi = async (filtri = {}) => {
  const params = new URLSearchParams();
  if (filtri.id_categoria) params.append('id_categoria', filtri.id_categoria);
  
  const response = await api.get(`/gradi?${params.toString()}`);
  return response.data;
};

export const getGradoById = async (id) => {
  const response = await api.get(`/gradi/${id}`);
  return response.data;
};