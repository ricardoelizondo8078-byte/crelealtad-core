import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

const USER_STORAGE_KEY = 'crelealtad:usuario:v2';
const LEGACY_TOKEN_STORAGE_KEY = 'crelealtad:token:v2';
const SECURE_TOKEN_KEY = 'crelealtad_token_v3';

type SessionInvalidatedListener = () => void;
const invalidatedListeners = new Set<SessionInvalidatedListener>();

export async function getStoredToken(): Promise<string | null> {
  const secureToken = await SecureStore.getItemAsync(SECURE_TOKEN_KEY);
  if (secureToken) return secureToken;

  const legacyToken = await AsyncStorage.getItem(LEGACY_TOKEN_STORAGE_KEY);
  if (!legacyToken) return null;

  await SecureStore.setItemAsync(SECURE_TOKEN_KEY, legacyToken);
  await AsyncStorage.removeItem(LEGACY_TOKEN_STORAGE_KEY);
  return legacyToken;
}

export async function saveStoredUser(user: unknown): Promise<void> {
  await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
}

export async function getStoredUser<T>(): Promise<T | null> {
  const raw = await AsyncStorage.getItem(USER_STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function isStoredJwtUsableOffline(token: string, nowMs = Date.now()): boolean {
  try {
    const payloadSegment = token.split('.')[1];
    if (!payloadSegment) return false;
    const normalized = payloadSegment.replace(/-/g, '+').replace(/_/g, '/');
    const padding = '='.repeat((4 - (normalized.length % 4)) % 4);
    const payload = JSON.parse(globalThis.atob(`${normalized}${padding}`)) as { exp?: unknown };
    return typeof payload.exp === 'number' && payload.exp * 1000 > nowMs + 30_000;
  } catch {
    return false;
  }
}

export async function saveSession(token: string, user: unknown): Promise<void> {
  try {
    await SecureStore.setItemAsync(SECURE_TOKEN_KEY, token);
    await saveStoredUser(user);
    await AsyncStorage.removeItem(LEGACY_TOKEN_STORAGE_KEY);
  } catch (error) {
    await clearStoredSession();
    throw error;
  }
}

export async function clearStoredSession(): Promise<void> {
  await Promise.all([
    SecureStore.deleteItemAsync(SECURE_TOKEN_KEY),
    AsyncStorage.removeItem(USER_STORAGE_KEY),
    AsyncStorage.removeItem(LEGACY_TOKEN_STORAGE_KEY),
  ]);
}

export function subscribeToSessionInvalidation(
  listener: SessionInvalidatedListener,
): () => void {
  invalidatedListeners.add(listener);
  return () => invalidatedListeners.delete(listener);
}

export function notifySessionInvalidated(): void {
  for (const listener of invalidatedListeners) listener();
}
