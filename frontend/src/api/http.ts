import type { ApiResponse } from '../types/api';
import type { LoginResult } from '../types/auth';

const AUTH_TOKEN_KEY = 'smart-seat-auth-token';
const AUTH_USER_KEY = 'smart-seat-auth-user';
export const AUTH_EXPIRED_EVENT = 'smart-seat-auth-expired';

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

export function clearAuthSession() {
  setAuthSession(null);
}

function isAuthExpiredResponse(response: Response, body: ApiResponse<unknown>) {
  return response.status === 401 && (body.code === 'AUTH_INVALID' || body.code === 'AUTH_REQUIRED' || body.code === 'AUTH_USER_NOT_FOUND');
}

function notifyAuthExpired(message: string) {
  clearAuthSession();
  window.dispatchEvent(new CustomEvent(AUTH_EXPIRED_EVENT, { detail: { message } }));
}

type QueryValue = boolean | number | string | null | undefined;

type ApiRequestOptions = Omit<RequestInit, 'body'> & {
  body?: BodyInit | object | null;
  query?: Record<string, QueryValue>;
};

function buildUrl(url: string, query?: Record<string, QueryValue>) {
  if (!query) {
    return url;
  }
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.set(key, String(value));
    }
  });
  const queryString = params.toString();
  if (!queryString) {
    return url;
  }
  return `${url}${url.includes('?') ? '&' : '?'}${queryString}`;
}

function buildBody(body: ApiRequestOptions['body']) {
  if (body === undefined || body === null) {
    return undefined;
  }
  if (typeof body === 'string' || body instanceof FormData || body instanceof URLSearchParams || body instanceof Blob) {
    return body;
  }
  return JSON.stringify(body);
}

export async function request<T>(url: string, options?: ApiRequestOptions): Promise<T> {
  const token = getAuthToken();
  const { body: requestBody, headers, query, ...requestOptions } = options ?? {};
  const response = await fetch(buildUrl(url, query), {
    ...requestOptions,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'X-Auth-Token': token } : {}),
      ...headers,
    },
    body: buildBody(requestBody),
  });

  const apiBody = (await response.json()) as ApiResponse<T>;
  if (!response.ok || !apiBody.success) {
    if (isAuthExpiredResponse(response, apiBody)) {
      notifyAuthExpired(apiBody.message || '登录状态已过期，请重新登录');
    }
    throw new Error(apiBody.message || '请求失败');
  }

  return apiBody.data;
}

export function get<T>(url: string, query?: Record<string, QueryValue>) {
  return request<T>(url, { method: 'GET', query });
}

export function post<T>(url: string, body?: object | null, query?: Record<string, QueryValue>) {
  return request<T>(url, { method: 'POST', body: body ?? undefined, query });
}

export function put<T>(url: string, body?: object | null, query?: Record<string, QueryValue>) {
  return request<T>(url, { method: 'PUT', body: body ?? undefined, query });
}

export function patch<T>(url: string, body?: object | null, query?: Record<string, QueryValue>) {
  return request<T>(url, { method: 'PATCH', body: body ?? undefined, query });
}

export function del<T>(url: string, query?: Record<string, QueryValue>) {
  return request<T>(url, { method: 'DELETE', query });
}
