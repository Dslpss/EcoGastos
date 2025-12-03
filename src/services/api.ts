import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// API Base URL - use your computer's local IP for testing on physical device
// For emulator: http://localhost:3000
// For physical device: http://YOUR_IP:3000 (e.g., http://192.168.1.100:3000)
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

// Create axios instance
const api = axios.create({
  baseURL: `${API_URL}/api`,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Add auth token to requests
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('@ecogastos:token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error getting token:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid - clear auth data
      await AsyncStorage.removeItem('@ecogastos:token');
      await AsyncStorage.removeItem('@ecogastos:user');
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: async (name: string, email: string, password: string) => {
    const response = await api.post('/auth/register', { name, email, password });
    return response.data;
  },

  login: async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },

  getMe: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  updateProfile: async (data: any) => {
    const response = await api.put('/auth/profile', data);
    return response.data;
  },
};

// Finance API
export const financeAPI = {
  getFinanceData: async () => {
    const response = await api.get('/finance');
    return response.data;
  },

  updateFinanceData: async (data: any) => {
    const response = await api.put('/finance', data);
    return response.data;
  },

  addExpense: async (expense: any) => {
    const response = await api.post('/finance/expense', expense);
    return response.data;
  },

  deleteExpense: async (id: string) => {
    const response = await api.delete(`/finance/expense/${id}`);
    return response.data;
  },

  addIncome: async (income: any) => {
    const response = await api.post('/finance/income', income);
    return response.data;
  },

  deleteIncome: async (id: string) => {
    const response = await api.delete(`/finance/income/${id}`);
    return response.data;
  },

  clearData: async () => {
    const response = await api.delete('/finance/clear');
    return response.data;
  },

  // Recurring Income
  addRecurringIncome: async (income: any) => {
    const response = await api.post('/finance/recurring-incomes', income);
    return response.data;
  },

  updateRecurringIncome: async (income: any) => {
    const response = await api.put(`/finance/recurring-incomes/${income.id}`, income);
    return response.data;
  },

  deleteRecurringIncome: async (id: string) => {
    const response = await api.delete(`/finance/recurring-incomes/${id}`);
    return response.data;
  },

  markIncomeAsReceived: async (id: string, incomeEntry: any) => {
    const response = await api.put(`/finance/recurring-incomes/${id}/receive`, { incomeEntry });
    return response.data;
  },

  markIncomeAsPending: async (id: string) => {
    const response = await api.put(`/finance/recurring-incomes/${id}/unreceive`);
    return response.data;
  },
};

// Config API
export const configAPI = {
  getConfig: async () => {
    const response = await api.get('/config');
    return response.data;
  },
};

export default api;
