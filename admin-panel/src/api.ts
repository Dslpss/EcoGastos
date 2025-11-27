import axios from 'axios';

// Connect to the same backend as the mobile app
// In production, set VITE_API_URL to your Railway backend URL
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('admin_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const configAPI = {
  getConfig: async () => {
    const response = await api.get('/config');
    return response.data;
  },
  updateConfig: async (data: any) => {
    const response = await api.put('/config', data);
    return response.data;
  },
};

export const authAPI = {
  login: async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },
};

export const usersAPI = {
  getUsers: async () => {
    const response = await api.get('/users');
    return response.data;
  },
};

export default api;
