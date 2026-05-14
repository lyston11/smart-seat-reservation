import type { ApiResponse } from '../types/api';
import type { LoginResult } from '../types/auth';

const AUTH_TOKEN_KEY = 'smart-seat-auth-token';
const AUTH_USER_KEY = 'smart-seat-auth-user';

export function getAuthToken() {
  return window.localStorage.getItem(AUTH_TOKEN_KEY);
}

export function getStoredUser() {
  const value = window.localStorage.getItem(AUTH_USER_KEY);
  if (!value) {
    return null;
  }
  try {
    return JSON.parse(value) as LoginResult['user'];
  } catch {
    return null;
  }
}

export function setAuthSession(session: LoginResult | null) {
  if (!session) {
    window.localStorage.removeItem(AUTH_TOKEN_KEY);
    window.localStorage.removeItem(AUTH_USER_KEY);
    return;
  }
  window.localStorage.setItem(AUTH_TOKEN_KEY, session.token);
  window.localStorage.setItem(AUTH_USER_KEY, JSON.stringify(session.user));
}

export async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const token = getAuthToken();
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'X-Auth-Token': token } : {}),
      ...options?.headers,
    },
    ...options,
  });

  const body = (await response.json()) as ApiResponse<T>;
  if (!response.ok || !body.success) {
    throw new Error(body.message || '请求失败');
  }

  return body.data;
}
