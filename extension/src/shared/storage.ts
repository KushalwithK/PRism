import { STORAGE_KEYS } from './constants.js';
import { browserAPI } from './compat.js';

export async function getStorageItem<T>(key: string): Promise<T | null> {
  return new Promise((resolve) => {
    browserAPI.storage.local.get(key, (result) => {
      resolve(result[key] ?? null);
    });
  });
}

export async function setStorageItem(key: string, value: unknown): Promise<void> {
  return new Promise((resolve) => {
    browserAPI.storage.local.set({ [key]: value }, resolve);
  });
}

export async function removeStorageItem(key: string): Promise<void> {
  return new Promise((resolve) => {
    browserAPI.storage.local.remove(key, resolve);
  });
}

export async function clearAuth(): Promise<void> {
  await Promise.all([
    removeStorageItem(STORAGE_KEYS.ACCESS_TOKEN),
    removeStorageItem(STORAGE_KEYS.REFRESH_TOKEN),
    removeStorageItem(STORAGE_KEYS.USER),
  ]);
}
