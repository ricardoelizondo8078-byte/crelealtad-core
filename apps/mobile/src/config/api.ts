import Constants from 'expo-constants';
import { Platform } from 'react-native';

const DEFAULT_DEV_API_PORT = '3100';
const explicitApiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL?.trim();
const apiPort = process.env.EXPO_PUBLIC_API_PORT?.trim() || DEFAULT_DEV_API_PORT;

const normalizeBaseUrl = (baseUrl: string): string => baseUrl.trim().replace(/\/+$/, '');

const parseHostFromUri = (value: string | null | undefined): string | null => {
  if (!value) {
    return null;
  }

  try {
    const uri = /^[a-z][a-z\d+.-]*:\/\//i.test(value) ? value : `http://${value}`;
    return new URL(uri).hostname.replace(/^\[|\]$/g, '');
  } catch {
    return null;
  }
};

const getExpoDevelopmentHost = (): string | null => {
  const candidates = [
    Constants.expoConfig?.hostUri,
    Constants.expoGoConfig?.debuggerHost,
    Constants.linkingUri,
  ];

  for (const candidate of candidates) {
    const host = parseHostFromUri(candidate);
    if (host) {
      return host;
    }
  }

  return null;
};

const formatHost = (host: string): string => {
  return host.includes(':') ? `[${host}]` : host;
};

const isPrivateDevelopmentHost = (host: string): boolean => {
  const normalizedHost = host.toLowerCase();
  if (normalizedHost === 'localhost' || normalizedHost === '::1') {
    return true;
  }

  const ipv4Parts = normalizedHost.split('.').map((part) => Number(part));
  if (ipv4Parts.length === 4 && ipv4Parts.every((part) => Number.isInteger(part))) {
    const [first, second] = ipv4Parts;
    return first === 10
      || first === 127
      || (first === 172 && second >= 16 && second <= 31)
      || (first === 192 && second === 168);
  }

  return normalizedHost.startsWith('fc')
    || normalizedHost.startsWith('fd')
    || normalizedHost.startsWith('fe80:');
};

const getWebDevelopmentHost = (): string | null => {
  if (Platform.OS !== 'web' || typeof window === 'undefined') {
    return null;
  }

  return window.location?.hostname || null;
};

export const API_BASE_URL = (): string => {
  if (explicitApiBaseUrl) {
    return normalizeBaseUrl(explicitApiBaseUrl);
  }

  if (!__DEV__) {
    throw new Error('Falta configurar EXPO_PUBLIC_API_BASE_URL para esta compilación.');
  }

  const developmentHost = getWebDevelopmentHost() ?? getExpoDevelopmentHost();
  if (!developmentHost) {
    throw new Error('Expo no informó la dirección de la laptop para conectar con la API.');
  }

  if (!isPrivateDevelopmentHost(developmentHost)) {
    throw new Error(
      'Expo está usando un túnel. Configura EXPO_PUBLIC_API_BASE_URL con la URL remota segura de la API.',
    );
  }

  return `http://${formatHost(developmentHost)}:${apiPort}`;
};

export const apiUrl = (path: string) => {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL()}${normalizedPath}`;
};
