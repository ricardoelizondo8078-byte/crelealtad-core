import Constants from 'expo-constants';
import { Platform } from 'react-native';

const DEFAULT_DEV_API_BASE_URL = 'http://192.168.1.83:3100';
const HEALTH_PATH = '/health';
const API_NOT_FOUND_MESSAGE = 'No se encontró el servidor de CRELEALTAD en esta red.';
const COMMON_LAN_HOST_SUFFIXES = ['1', '2', '10', '20', '50', '83', '100', '101', '200', '254'];

const envApiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL?.trim();

let discoveredApiBaseUrl: string | null = envApiBaseUrl && envApiBaseUrl.length > 0 ? envApiBaseUrl : null;
let discoveryPromise: Promise<string> | null = null;

const normalizeBaseUrl = (baseUrl: string): string => baseUrl.trim().replace(/\/+$/, '');

const parseHostIpFromText = (value: string | undefined): string | null => {
  if (!value) {
    return null;
  }

  const ipMatch = value.match(/(\d{1,3}(?:\.\d{1,3}){3})/);
  if (!ipMatch) {
    return null;
  }

  return ipMatch[1];
};

const getExpoDebugHostIp = (): string | null => {
  const hostUri = Constants.expoConfig?.hostUri;
  const debuggerHost = (Constants as { manifest2?: { extra?: { expoGo?: { debuggerHost?: string } } } }).manifest2?.extra?.expoGo?.debuggerHost;
  return parseHostIpFromText(hostUri) ?? parseHostIpFromText(debuggerHost);
};

const getLanSubnetFromIp = (ip: string | null): string | null => {
  if (!ip) {
    return null;
  }

  const parts = ip.split('.');
  if (parts.length !== 4) {
    return null;
  }

  return `${parts[0]}.${parts[1]}.${parts[2]}`;
};

const addCandidate = (candidates: string[], candidate: string | null | undefined) => {
  if (!candidate) {
    return;
  }

  const normalized = normalizeBaseUrl(candidate);
  if (!/^https?:\/\//i.test(normalized)) {
    return;
  }

  if (!candidates.includes(normalized)) {
    candidates.push(normalized);
  }
};

const getDiscoveryCandidates = (): string[] => {
  const candidates: string[] = [];

  // 1) Explicit override always has highest priority.
  addCandidate(candidates, envApiBaseUrl);

  // 2) Keep current known IP as fallback candidate.
  addCandidate(candidates, DEFAULT_DEV_API_BASE_URL);

  // 3) Try Expo debug host and its local subnet variations.
  const expoHostIp = getExpoDebugHostIp();
  if (expoHostIp) {
    addCandidate(candidates, `http://${expoHostIp}:3100`);

    const subnet = getLanSubnetFromIp(expoHostIp);
    if (subnet) {
      COMMON_LAN_HOST_SUFFIXES.forEach((suffix) => addCandidate(candidates, `http://${subnet}.${suffix}:3100`));
    }
  }

  // 4) Web-specific convenience candidates.
  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.location?.hostname) {
    const webHost = window.location.hostname;
    addCandidate(candidates, `http://${webHost}:3100`);
  }

  addCandidate(candidates, 'http://localhost:3100');
  addCandidate(candidates, 'http://127.0.0.1:3100');

  return candidates;
};

const probeHealth = async (baseUrl: string): Promise<boolean> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 segundos timeout

  try {
    const response = await fetch(`${baseUrl}${HEALTH_PATH}`, {
      method: 'GET',
      signal: controller.signal,
    });

    if (!response.ok) {
      return false;
    }

    const data = (await response.json()) as { status?: string };
    return data.status === 'ok';
  } catch {
    return false;
  } finally {
    clearTimeout(timeoutId);
  }
};

export const getApiDiscoveryErrorMessage = (): string => API_NOT_FOUND_MESSAGE;

export const getCurrentApiBaseUrl = (): string | null => discoveredApiBaseUrl;

export const ensureApiBaseUrlDiscovered = async (): Promise<string> => {
  if (discoveredApiBaseUrl) {
    return discoveredApiBaseUrl;
  }

  if (discoveryPromise) {
    return discoveryPromise;
  }

  discoveryPromise = (async () => {
    const candidates = getDiscoveryCandidates();

    for (const candidate of candidates) {
      const healthy = await probeHealth(candidate);
      if (healthy) {
        discoveredApiBaseUrl = candidate;
        return candidate;
      }
    }

    throw new Error(API_NOT_FOUND_MESSAGE);
  })();

  try {
    return await discoveryPromise;
  } finally {
    discoveryPromise = null;
  }
};

export const API_BASE_URL = (): string => {
  // SIMPLIFICADO: Usar siempre la variable de entorno o el default, SIN discovery
  const baseUrl = normalizeBaseUrl(envApiBaseUrl || DEFAULT_DEV_API_BASE_URL);
  console.log('🔵 API_BASE_URL:', baseUrl);
  return baseUrl;
};

export const apiUrl = (path: string) => {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const fullUrl = `${API_BASE_URL()}${normalizedPath}`;
  console.log('🔵 apiUrl generada:', fullUrl);
  return fullUrl;
};