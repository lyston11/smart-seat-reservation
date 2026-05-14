import { request, setAuthSession } from './http';
import type { CurrentUser, LoginResult } from '../types/auth';

export function login(studentNo: string) {
  return request<LoginResult>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ studentNo }),
  });
}

export async function logout() {
  await request<void>('/api/auth/logout', {
    method: 'POST',
  });
  setAuthSession(null);
}

export function getCurrentUser() {
  return request<CurrentUser>('/api/auth/me');
}
