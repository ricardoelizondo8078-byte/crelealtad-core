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

const STORAGE_KEY_USER = 'crelealtad:usuario:v2';
const STORAGE_KEY_TOKEN = process.env.REQUIRED_SECRET;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false); // No cargamos de AsyncStorage al inicio

  // NO cargamos sesión guardada - por seguridad siempre inicia sin sesión
  // Esto obliga a hacer login cada vez que se abre la app desde cero

  const login = async (data: LoginResponse) => {
    try {
      // Solo guardamos en memoria (estado), NO en AsyncStorage
      // Así cuando se cierra completamente la app, se pierde la sesión
      setUsuario(data.usuario);
      setToken(data.token);
    } catch (error) {
      console.error('Error saving auth:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      // Limpiar estado en memoria
      setUsuario(null);
      setToken(null);

      // Limpiar AsyncStorage por si acaso (limpieza de sesiones antiguas)
      await Promise.all([
        AsyncStorage.removeItem(STORAGE_KEY_USER),
        AsyncStorage.removeItem(STORAGE_KEY_TOKEN)
      ]);
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
