import api from './api';

export const getAllCategorie = async () => {
  const response = await api.get('/categorie');
  return response.data;
};

export const getCategoriaById = async (id) => {
  const response = await api.get(`/categorie/${id}`);
  return response.data;
};