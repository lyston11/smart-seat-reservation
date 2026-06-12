import type { ApiResponse } from '../types/api';
import type { LoginResult } from '../types/auth';

const AUTH_TOKEN_KEY = 'smart-seat-auth-token';
const AUTH_USER_KEY = 'smart-seat-auth-user';
const DEFAULT_AUTH_EXPIRED_MESSAGE = '登录状态已过期，请重新登录';
const DEFAULT_REQUEST_ERROR_MESSAGE = '请求失败';
const DEFAULT_RESPONSE_FORMAT_ERROR_MESSAGE = '响应格式异常';
const AUTH_EXPIRED_CODES = new Set(['AUTH_INVALID', 'AUTH_REQUIRED', 'AUTH_USER_NOT_FOUND']);
const BUSINESS_ERROR_MESSAGES: Record<string, string> = {
  RESERVATION_CHECKIN_TIME_NOT_ALLOWED: '当前不在签到时间窗内，请在预约开始前后规定时间内签到',
  CHECKIN_WIFI_IP_NOT_ALLOWED: '当前网络不在允许的校园网范围内，请连接指定校园网后再签到',
  RESERVATION_CHECKIN_FAILED: '签到失败，请确认预约状态和签到码是否正确',
};
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isApiResponse(value: unknown): value is ApiResponse<unknown> {
  return (
    isRecord(value) &&
    typeof value.success === 'boolean' &&
    typeof value.code === 'string' &&
    typeof value.message === 'string' &&
    'data' in value
  );
}

async function parseResponsePayload(response: Response) {
  if (typeof response.text === 'function') {
    const text = await response.text();
    if (!text.trim()) {
      return null;
    }
    try {
      return JSON.parse(text) as unknown;
    } catch {
      return null;
    }
  }

  if (typeof response.json === 'function') {
    try {
      return (await response.json()) as unknown;
    } catch {
      return null;
    }
  }

  return null;
}

async function parseApiResponse<T>(response: Response): Promise<ApiResponse<T> | null> {
  const payload = await parseResponsePayload(response);
  if (!isApiResponse(payload)) {
    return null;
  }
  return payload as ApiResponse<T>;
}

function isAuthExpiredResponse(response: Response, body: ApiResponse<unknown> | null) {
  return response.status === 401 || (body !== null && AUTH_EXPIRED_CODES.has(body.code));
}

function getErrorMessage(response: Response, body: ApiResponse<unknown> | null) {
  if (isAuthExpiredResponse(response, body)) {
    return body?.message || DEFAULT_AUTH_EXPIRED_MESSAGE;
  }
  if (body) {
    const businessMessage = BUSINESS_ERROR_MESSAGES[body.code];
    if (businessMessage) {
      return businessMessage;
    }
    return body.message || DEFAULT_REQUEST_ERROR_MESSAGE;
  }
  if (response.ok) {
    return DEFAULT_RESPONSE_FORMAT_ERROR_MESSAGE;
  }
  return response.statusText || DEFAULT_REQUEST_ERROR_MESSAGE;
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

  const apiBody = await parseApiResponse<T>(response);
  if (!apiBody || !response.ok || !apiBody.success) {
    if (isAuthExpiredResponse(response, apiBody)) {
      notifyAuthExpired(getErrorMessage(response, apiBody));
    }
    throw new Error(getErrorMessage(response, apiBody));
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
