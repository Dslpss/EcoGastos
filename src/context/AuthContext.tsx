import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, AuthState } from '../types';
import { authAPI } from '../services/api';

interface AuthResponse {
  success: boolean;
  error?: string;
}

interface AuthContextData extends AuthState {
  login: (email: string, password: string) => Promise<AuthResponse>;
  register: (name: string, email: string, password: string) => Promise<AuthResponse>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

const STORAGE_KEYS = {
  TOKEN: '@ecogastos:token',
  USER: '@ecogastos:user',
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAuthState();
  }, []);

  const loadAuthState = async () => {
    try {
      const token = await AsyncStorage.getItem(STORAGE_KEYS.TOKEN);
      const userJson = await AsyncStorage.getItem(STORAGE_KEYS.USER);

      if (token && userJson) {
        const user = JSON.parse(userJson);
        setCurrentUser(user);
        setIsAuthenticated(true);

        // Verify token is still valid
        try {
          const response = await authAPI.getMe();
          if (response.success) {
            // Update user data if needed
            setCurrentUser(response.data.user);
            await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(response.data.user));
          }
        } catch (error) {
          // Token invalid, clear auth
          await logout();
        }
      }
    } catch (error) {
      console.error('Error loading auth state:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<AuthResponse> => {
    try {
      const response = await authAPI.login(email, password);

      if (response.success) {
        const { token, user } = response.data;

        // Store token and user
        await AsyncStorage.setItem(STORAGE_KEYS.TOKEN, token);
        await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));

        setCurrentUser(user);
        setIsAuthenticated(true);
        return { success: true };
      }

      return { success: false, error: response.message || 'Falha no login' };
    } catch (error: any) {
      console.error('Error during login:', error);
      const msg = error.response?.data?.message || error.message || 'Erro de conexão';
      return { success: false, error: msg };
    }
  };

  const register = async (name: string, email: string, password: string): Promise<AuthResponse> => {
    try {
      const response = await authAPI.register(name, email, password);

      if (response.success) {
        const { token, user } = response.data;

        // Store token and user
        await AsyncStorage.setItem(STORAGE_KEYS.TOKEN, token);
        await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));

        setCurrentUser(user);
        setIsAuthenticated(true);
        return { success: true };
      }

      return { success: false, error: response.message || 'Falha no cadastro' };
    } catch (error: any) {
      console.error('Error during registration:', error);
      const msg = error.response?.data?.message || error.message || 'Erro de conexão';
      return { success: false, error: msg };
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.TOKEN);
      await AsyncStorage.removeItem(STORAGE_KEYS.USER);
      setCurrentUser(null);
      setIsAuthenticated(false);
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        currentUser,
        isLoading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
