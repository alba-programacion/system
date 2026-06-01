import axios from 'axios';

const getApiBaseUrl = () => {
  const host = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.hostname.match(/^\d+\.\d+\.\d+\.\d+$/)
    ? `http://${window.location.hostname}:5000`
    : window.location.origin;
  return `${host}/api`;
};

const api = axios.create({
    baseURL: getApiBaseUrl()
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    // IMPORTANTE: No forzamos application/json aquí para permitir subida de archivos
    return config;
}, (error) => {
    return Promise.reject(error);
});

export default api;