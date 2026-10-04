import { apiUrl } from '../config/api';
import { beginProcessing } from './processing-controller';
import {
  clearStoredSession,
  getStoredToken,
  notifySessionInvalidated,
} from './session-storage';

const REQUEST_TIMEOUT_MS = 15000;
const NETWORK_ERROR_MESSAGE = 'No se pudo conectar con CRELEALTAD. Revisa tu conexión e intenta nuevamente.';
export const DOCUMENT_UPLOAD_TIMEOUT_MS = 120000;

export const getDocumentUploadTimeoutMs = (fileCount: number): number => (
  DOCUMENT_UPLOAD_TIMEOUT_MS * Math.max(1, Math.ceil(fileCount / 2))
);

export interface ApiRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  body?: unknown;
  headers?: Record<string, string>;
  requiresAuth?: boolean;
  timeoutMs?: number;
  showProcessing?: boolean;
}

export async function getAuthorizationHeaders(): Promise<Record<string, string>> {
  const token = await getStoredToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
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
    timeoutMs = REQUEST_TIMEOUT_MS,
    showProcessing = true,
  } = options;

  const completeProcessing = showProcessing
    ? beginProcessing(method === 'GET' ? 'Cargando…' : 'Guardando…')
    : () => undefined;

  try {
    return await executeApiRequest<T>({
      endpoint,
      method,
      body,
      headers,
      requiresAuth,
      timeoutMs,
    });
  } finally {
    completeProcessing();
  }
}

interface ExecuteApiRequestOptions {
  endpoint: string;
  method: NonNullable<ApiRequestOptions['method']>;
  body: unknown;
  headers: Record<string, string>;
  requiresAuth: boolean;
  timeoutMs: number;
}

async function executeApiRequest<T>({
  endpoint,
  method,
  body,
  headers,
  requiresAuth,
  timeoutMs,
}: ExecuteApiRequestOptions): Promise<T> {

  // Construir headers base
  const isMultipart = typeof FormData !== 'undefined' && body instanceof FormData;
  const requestHeaders: Record<string, string> = {
    ...(isMultipart ? {} : { 'Content-Type': 'application/json' }),
    ...(method === 'GET' ? { 'Cache-Control': 'no-cache' } : {}),
    ...headers,
  };

  // Agregar Authorization header si se requiere autenticación
  if (requiresAuth) {
    Object.assign(requestHeaders, await getAuthorizationHeaders());
  }

  // Construir opciones de fetch
  const fetchOptions: RequestInit = {
    method,
    headers: requestHeaders,
  };

  if (body && method !== 'GET') {
    fetchOptions.body = isMultipart ? body as BodyInit : JSON.stringify(body);
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  fetchOptions.signal = controller.signal;

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
      if (requiresAuth && response.status === 401) {
        await clearStoredSession();
        notifySessionInvalidated();
      }

      const serverMessage = typeof data === 'object' && data !== null && 'message' in data
        ? String((data as { message: unknown }).message)
        : undefined;
      throw new ApiError(
        serverMessage || `HTTP ${response.status}: ${response.statusText}`,
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
    throw new ApiError(NETWORK_ERROR_MESSAGE, 0);
  } finally {
    clearTimeout(timeoutId);
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
