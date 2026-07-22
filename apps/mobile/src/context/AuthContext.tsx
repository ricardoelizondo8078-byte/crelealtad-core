import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';

interface Usuario {
  id: string;
  email: string;
  nombre: string;
  apellido_pat: string;
  apellido_mat: string;
  rol: string;
  zona_id?: string;
}

interface LoginResponse {
  usuario: Usuario;
  token: string;
}

interface AuthContextData {
  usuario: Usuario | null;
  token: string | null;
  loading: boolean;
  login: (data: LoginResponse) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

const STORAGE_KEY_USER = 'crelealtad:usuario';
const STORAGE_KEY_TOKEN = process.env.REQUIRED_SECRET;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      const [storedUser, storedToken] = await Promise.all([AsyncStorage.getItem(STORAGE_KEY_USER), AsyncStorage.getItem(STORAGE_KEY_TOKEN)]);

      if (storedUser && storedToken) {
        setUsuario(JSON.parse(storedUser));
        setToken(storedToken);
      }
    } catch (error) {
      console.error('Error loading auth:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (data: LoginResponse) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY_USER, JSON.stringify(data.usuario));
      await AsyncStorage.setItem(STORAGE_KEY_TOKEN, data.token);

      setUsuario(data.usuario);
      setToken(data.token);
    } catch (error) {
      console.error('Error saving auth:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await Promise.all([AsyncStorage.removeItem(STORAGE_KEY_USER), AsyncStorage.removeItem(STORAGE_KEY_TOKEN)]);
      setUsuario(null);
      setToken(null);
    } catch (error) {
      console.error('Error clearing auth:', error);
      throw error;
    }
  };

  return <AuthContext.Provider value={{ usuario, token, loading, login, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
