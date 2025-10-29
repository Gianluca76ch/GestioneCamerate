import axios from 'axios';

// Usa l'IP del server in base a dove stai accedendo
const getBaseURL = () => {
  const hostname = window.location.hostname;
  
  // Se accedi da localhost, usa localhost
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://localhost:5000/api';
  }
  
  // Altrimenti usa l'IP del server
  return 'http://10.60.37.91:5000/api';
};

const api = axios.create({
  baseURL: getBaseURL(),
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor per gestire errori globali
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;