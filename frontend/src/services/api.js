import axios from 'axios';

// DEBUG: Log configurazione
console.log('🔍 API Configuration:');
console.log('  - hostname:', window.location.hostname);
console.log('  - NODE_ENV:', process.env.NODE_ENV);
console.log('  - REACT_APP_API_URL:', process.env.REACT_APP_API_URL);

// Determina base URL in base all'hostname
const getBaseURL = () => {
  const hostname = window.location.hostname;
  
  console.log('🎯 getBaseURL - hostname:', hostname);
  
  // Se siamo su localhost (development), usa backend locale porta 5000
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    console.log('✅ Development mode - usando http://localhost:5000/api');
    return 'http://localhost:5000/api';
  }
  
  // Altrimenti (produzione), usa URL relativo che si adatta automaticamente
  console.log('📦 Production mode - usando /api (relativo)');
  return '/api';
};

const API_URL = getBaseURL();
console.log('📡 Final API_URL:', API_URL);

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,  // Importante per Windows Auth
});

// Interceptor per gestire errori globali
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.error('❌ 401 Unauthorized');
      // Non redirect a /login se non esiste quella pagina
      // window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
export { API_URL };