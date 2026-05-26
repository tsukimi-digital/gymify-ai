import { vi } from 'vitest';
import { getOrCreateFingerprint } from '../lib/fingerprint';

const KEY = 'gymify_fp';

test('creates and persists fingerprint', () => {
  // Use a mock localStorage since jsdom custom storage may not support all methods
  const store: Record<string, string> = {};
  const mockStorage = {
    getItem: (k: string) => store[k] ?? null,
    setItem: (k: string, v: string) => { store[k] = v; },
    removeItem: (k: string) => { delete store[k]; },
    clear: () => { Object.keys(store).forEach((k) => delete store[k]); },
    get length() { return Object.keys(store).length; },
    key: (i: number) => Object.keys(store)[i] ?? null,
  };
  vi.stubGlobal('localStorage', mockStorage);

  const fp1 = getOrCreateFingerprint();
  expect(fp1).toMatch(/^[0-9a-f-]{36}$/);
  const fp2 = getOrCreateFingerprint();
  expect(fp1).toBe(fp2);

  vi.unstubAllGlobals();
});
