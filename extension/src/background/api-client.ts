import { API_BASE_URL, STORAGE_KEYS } from '../shared/constants.js';
import { getStorageItem, setStorageItem, clearAuth } from '../shared/storage.js';
import type { AuthResponse } from '../shared/types.js';

async function getAccessToken(): Promise<string | null> {
  return getStorageItem<string>(STORAGE_KEYS.ACCESS_TOKEN);
}

async function refreshTokens(): Promise<boolean> {
  const refreshToken = await getStorageItem<string>(STORAGE_KEYS.REFRESH_TOKEN);
  if (!refreshToken) return false;

  try {
    const res = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    if (!res.ok) {
      await clearAuth();
      return false;
    }

    const data: AuthResponse = await res.json();
    await setStorageItem(STORAGE_KEYS.ACCESS_TOKEN, data.tokens.accessToken);
    await setStorageItem(STORAGE_KEYS.REFRESH_TOKEN, data.tokens.refreshToken);
    await setStorageItem(STORAGE_KEYS.USER, data.user);
    return true;
  } catch {
    await clearAuth();
    return false;
  }
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  let token = await getAccessToken();

  const makeRequest = async (accessToken: string | null) => {
    const headers: Record<string, string> = {
      ...(options.headers as Record<string, string>),
    };
    if (options.body) {
      headers['Content-Type'] = 'application/json';
    }
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }

    return fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers,
    });
  };

  let res = await makeRequest(token);

  // If 401, try refreshing tokens
  if (res.status === 401 && token) {
    const refreshed = await refreshTokens();
    if (refreshed) {
      token = await getAccessToken();
      res = await makeRequest(token);
    }
  }

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: res.statusText }));
    throw { status: res.status, ...error };
  }

  // Handle 204 No Content
  if (res.status === 204) return undefined as T;

  return res.json();
}
