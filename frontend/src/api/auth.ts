import { apiPaths, withPath } from './endpoints';
import { clearAuthSession, get, post, request } from './http';
import type { CurrentUser, LoginResult } from '../types/auth';

export function login(studentNo: string, password: string) {
  return post<LoginResult>(withPath(apiPaths.auth, 'login'), { studentNo, password });
}

export async function logout() {
  try {
    await request<void>(withPath(apiPaths.auth, 'logout'), {
      method: 'POST',
    });
  } finally {
    clearAuthSession();
  }
}

export function getCurrentUser() {
  return get<CurrentUser>(withPath(apiPaths.auth, 'me'));
}
