import { App as AntApp } from 'antd';
import { cleanup, render, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import WifiPresenceGuard from './WifiPresenceGuard';
import { isStudentSessionActive } from '../utils/authSession';

function storeSession(role: 'ADMIN' | 'STUDENT') {
  window.localStorage.setItem('smart-seat-auth-token', `${role.toLowerCase()}-token`);
  window.localStorage.setItem(
    'smart-seat-auth-user',
    JSON.stringify({
      id: role === 'STUDENT' ? 1 : 2,
      name: role === 'STUDENT' ? 'Demo Student' : 'Demo Admin',
      studentNo: role === 'STUDENT' ? '20260001' : 'admin',
      role,
    }),
  );
}

function okResponse(data: unknown) {
  return {
    ok: true,
    json: async () => ({ success: true, code: 'OK', message: 'ok', data }),
  };
}

afterEach(() => {
  cleanup();
  window.localStorage.clear();
  vi.unstubAllGlobals();
});

describe('WifiPresenceGuard', () => {
  it('does not query student reservations for an admin session', async () => {
    storeSession('ADMIN');

    const fetchMock = vi.fn(async () => okResponse([]));
    vi.stubGlobal('fetch', fetchMock);

    render(
      <AntApp>
        <WifiPresenceGuard />
      </AntApp>,
    );

    await Promise.resolve();

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('checks the latest stored role before each WiFi heartbeat', async () => {
    storeSession('STUDENT');

    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.startsWith('/api/reservations?')) {
        return okResponse([
          {
            reservationId: 7,
            seatSlotId: 8,
            seatId: 9,
            userId: 1,
            status: 'CHECKED_IN',
            checkinCode: '246810',
            expiresAt: '2026-05-19T10:00:00',
          },
        ]);
      }
      if (url === '/api/reservations/7/wifi-presence') {
        return okResponse({
          reservationId: 7,
          status: 'CHECKED_IN',
          lastWifiSeenAt: '2026-05-19T09:01:00',
          offlineReleaseMinutes: 15,
        });
      }
      return okResponse([]);
    });
    vi.stubGlobal('fetch', fetchMock);

    render(
      <AntApp>
        <WifiPresenceGuard />
      </AntApp>,
    );

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/reservations?limit=20',
        expect.objectContaining({ method: 'GET' }),
      );
    }, { timeout: 1000 });

    expect(isStudentSessionActive()).toBe(true);

    storeSession('ADMIN');
    expect(isStudentSessionActive()).toBe(false);
  });
});
