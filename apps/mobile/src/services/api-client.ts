import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiUrl } from '../config/api';

const STORAGE_KEY_TOKEN = process.env.REQUIRED_SECRET;

export interface ApiRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  body?: unknown;
  headers?: Record<string, string>;
  requiresAuth?: boolean;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Cliente HTTP centralizado con interceptor de autenticación
 * Agrega automáticamente el header Authorization a todas las peticiones
 */
export async function apiRequest<T = unknown>(
  endpoint: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  const {
    method = 'GET',
    body,
    headers = {},
    requiresAuth = true,
  } = options;

  // Construir headers base
  const requestHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...headers,
  };

  // Agregar Authorization header si se requiere autenticación
  if (requiresAuth) {
    const token = await AsyncStorage.getItem(STORAGE_KEY_TOKEN);
    if (token) {
      requestHeaders['Authorization'] = `Bearer ${token}`;
    }
  }

  // Construir opciones de fetch
  const fetchOptions: RequestInit = {
    method,
    headers: requestHeaders,
  };

  if (body && method !== 'GET') {
    fetchOptions.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(apiUrl(endpoint), fetchOptions);

    // Intentar parsear respuesta como JSON
    let data: unknown;
    const contentType = response.headers.get('content-type');
    if (contentType?.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    // Verificar si la respuesta fue exitosa
    if (!response.ok) {
      throw new ApiError(
        `HTTP ${response.status}: ${response.statusText}`,
        response.status,
        data,
      );
    }

    return data as T;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    // Error de red o timeout
    throw new ApiError(
      error instanceof Error ? error.message : 'Error de red',
      0,
    );
  }
}

/**
 * Helpers específicos por método HTTP
 */
export const api = {
  get: <T = unknown>(endpoint: string, options?: Omit<ApiRequestOptions, 'method'>) =>
    apiRequest<T>(endpoint, { ...options, method: 'GET' }),

  post: <T = unknown>(endpoint: string, body?: unknown, options?: Omit<ApiRequestOptions, 'method' | 'body'>) =>
    apiRequest<T>(endpoint, { ...options, method: 'POST', body }),

  put: <T = unknown>(endpoint: string, body?: unknown, options?: Omit<ApiRequestOptions, 'method' | 'body'>) =>
    apiRequest<T>(endpoint, { ...options, method: 'PUT', body }),

  delete: <T = unknown>(endpoint: string, options?: Omit<ApiRequestOptions, 'method'>) =>
    apiRequest<T>(endpoint, { ...options, method: 'DELETE' }),

  patch: <T = unknown>(endpoint: string, body?: unknown, options?: Omit<ApiRequestOptions, 'method' | 'body'>) =>
    apiRequest<T>(endpoint, { ...options, method: 'PATCH', body }),
};
