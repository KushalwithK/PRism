import { API_BASE_URL, STORAGE_KEYS } from '../shared/constants.js';
import { getStorageItem, setStorageItem, clearAuth } from '../shared/storage.js';
import type { AuthResponse, UserProfile } from '../shared/types.js';

export async function login(email: string, password: string): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'Login failed' }));
    throw error;
  }

  const data: AuthResponse = await res.json();
  await setStorageItem(STORAGE_KEYS.ACCESS_TOKEN, data.tokens.accessToken);
  await setStorageItem(STORAGE_KEYS.REFRESH_TOKEN, data.tokens.refreshToken);
  await setStorageItem(STORAGE_KEYS.USER, data.user);

  return data;
}

export async function register(email: string, password: string, name: string): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, name }),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'Registration failed' }));
    throw error;
  }

  const data: AuthResponse = await res.json();
  await setStorageItem(STORAGE_KEYS.ACCESS_TOKEN, data.tokens.accessToken);
  await setStorageItem(STORAGE_KEYS.REFRESH_TOKEN, data.tokens.refreshToken);
  await setStorageItem(STORAGE_KEYS.USER, data.user);

  return data;
}

export async function logout(): Promise<void> {
  await clearAuth();
}

export async function getAuthState(): Promise<{ isAuthenticated: boolean; user: UserProfile | null }> {
  const user = await getStorageItem<UserProfile>(STORAGE_KEYS.USER);
  const token = await getStorageItem<string>(STORAGE_KEYS.ACCESS_TOKEN);
  return {
    isAuthenticated: !!user && !!token,
    user,
  };
}
