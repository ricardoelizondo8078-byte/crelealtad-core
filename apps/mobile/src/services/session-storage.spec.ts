import { isStoredJwtUsableOffline } from './session-storage';

jest.mock(
  '@react-native-async-storage/async-storage',
  () => jest.requireActual('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

const tokenWithExpiration = (exp: number): string => {
  const payload = Buffer.from(JSON.stringify({ exp })).toString('base64url');
  return `header.${payload}.signature`;
};

describe('session-storage', () => {
  it('sólo permite restauración offline mientras el JWT conserva vigencia', () => {
    const now = Date.parse('2026-10-04T12:00:00.000Z');
    expect(isStoredJwtUsableOffline(tokenWithExpiration(Math.floor(now / 1000) + 120), now)).toBe(true);
    expect(isStoredJwtUsableOffline(tokenWithExpiration(Math.floor(now / 1000) - 1), now)).toBe(false);
    expect(isStoredJwtUsableOffline('token-invalido', now)).toBe(false);
  });
});
