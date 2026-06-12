import { afterEach, describe, expect, it, vi } from 'vitest';
import { AUTH_EXPIRED_EVENT, request, setAuthSession } from './http';

function storeSession() {
  setAuthSession({
    token: 'stale-token',
    expiresAt: '2026-05-19T21:00:00',
    user: {
      id: 1,
      name: 'Demo Student',
      studentNo: '20260001',
      role: 'STUDENT',
    },
  });
}

function makeResponse(body: string | null, init?: ResponseInit) {
  return new Response(body, {
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    ...init,
  });
}

afterEach(() => {
  window.localStorage.clear();
  vi.unstubAllGlobals();
});

describe('request', () => {
  it('returns data from a successful API response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(makeResponse(JSON.stringify({ success: true, code: 'OK', message: 'ok', data: { id: 1 } }))),
    );

    await expect(request<{ id: number }>('/api/test')).resolves.toEqual({ id: 1 });
  });

  it('uses backend error message for normal API errors', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        makeResponse(JSON.stringify({ success: false, code: 'SEAT_OCCUPIED', message: '座位已被占用', data: null }), {
          status: 409,
        }),
      ),
    );

    await expect(request('/api/test')).rejects.toThrow('座位已被占用');
  });

  it('translates known backend business error codes to Chinese messages', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        makeResponse(
          JSON.stringify({
            success: false,
            code: 'RESERVATION_CHECKIN_TIME_NOT_ALLOWED',
            message: 'Check-in is only allowed within the configured time window',
            data: null,
          }),
          { status: 400 },
        ),
      ),
    );

    await expect(request('/api/reservations/1/check-in')).rejects.toThrow('当前不在签到时间窗内，请在预约开始前后规定时间内签到');
  });

  it('clears local session and emits auth expiry for non-json 401 responses', async () => {
    storeSession();
    const authExpiredListener = vi.fn();
    window.addEventListener(AUTH_EXPIRED_EVENT, authExpiredListener);
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(makeResponse('<html>Unauthorized</html>', { status: 401, statusText: 'Unauthorized' })));

    await expect(request('/api/admin/test')).rejects.toThrow('登录状态已过期，请重新登录');

    expect(window.localStorage.getItem('smart-seat-auth-token')).toBeNull();
    expect(window.localStorage.getItem('smart-seat-auth-user')).toBeNull();
    expect(authExpiredListener).toHaveBeenCalledTimes(1);

    window.removeEventListener(AUTH_EXPIRED_EVENT, authExpiredListener);
  });

  it('clears local session and emits auth expiry for empty 401 responses', async () => {
    storeSession();
    const authExpiredListener = vi.fn();
    window.addEventListener(AUTH_EXPIRED_EVENT, authExpiredListener);
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(makeResponse(null, { status: 401, statusText: 'Unauthorized' })));

    await expect(request('/api/admin/test')).rejects.toThrow('登录状态已过期，请重新登录');

    expect(window.localStorage.getItem('smart-seat-auth-token')).toBeNull();
    expect(window.localStorage.getItem('smart-seat-auth-user')).toBeNull();
    expect(authExpiredListener).toHaveBeenCalledTimes(1);

    window.removeEventListener(AUTH_EXPIRED_EVENT, authExpiredListener);
  });

  it('reports malformed successful responses without clearing auth', async () => {
    storeSession();
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(makeResponse('<html>ok</html>', { status: 200 })));

    await expect(request('/api/test')).rejects.toThrow('响应格式异常');

    expect(window.localStorage.getItem('smart-seat-auth-token')).toBe('stale-token');
  });
});
