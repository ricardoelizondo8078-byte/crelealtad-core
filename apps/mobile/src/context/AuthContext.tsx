import React, { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../services/api-client';
import {
  clearStoredSession,
  getStoredToken,
  saveSession,
  saveStoredUser,
  subscribeToSessionInvalidation,
} from '../services/session-storage';
import { EffectivePermissions, hasPermission } from '../security/permission-checker';

export interface Usuario {
  id: string;
  abreviatura: string;
  nombre: string;
  rol_id: string;
  rol_nombre: string;
  sucursal_id: string;
  estado: string;
  requiere_cambio_pin: boolean;
  permisos: EffectivePermissions;
}

export interface LoginResponse {
  usuario: Usuario;
  token: string;
}

interface AuthContextData {
  usuario: Usuario | null;
  token: string | null;
  loading: boolean;
  login: (data: LoginResponse) => Promise<void>;
  logout: () => Promise<void>;
  tienePermiso: (modulo: string, accion: string) => boolean;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let activo = true;
    const unsubscribe = subscribeToSessionInvalidation(() => {
      if (!activo) return;
      setToken(null);
      setUsuario(null);
    });

    const restaurarSesion = async () => {
      try {
        const tokenGuardado = await getStoredToken();
        if (!tokenGuardado) return;

        const usuarioVigente = await api.get<Usuario>('/auth/me');
        if (!activo) return;

        await saveStoredUser(usuarioVigente);
        setToken(tokenGuardado);
        setUsuario(usuarioVigente);
      } catch {
        await clearStoredSession();
        if (activo) {
          setToken(null);
          setUsuario(null);
        }
      } finally {
        if (activo) setLoading(false);
      }
    };

    void restaurarSesion();
    return () => {
      activo = false;
      unsubscribe();
    };
  }, []);

  const login = async (data: LoginResponse) => {
    await saveSession(data.token, data.usuario);
    setUsuario(data.usuario);
    setToken(data.token);
  };

  const logout = async () => {
    setUsuario(null);
    setToken(null);
    await clearStoredSession();
  };

  const tienePermiso = (modulo: string, accion: string) => {
    return hasPermission(usuario?.permisos, modulo, accion);
  };

  return (
    <AuthContext.Provider value={{ usuario, token, loading, login, logout, tienePermiso }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
