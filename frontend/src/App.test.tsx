import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import App from './App';

afterEach(() => {
  cleanup();
  window.localStorage.clear();
  vi.unstubAllGlobals();
});

describe('App', () => {
  it('renders student seat page title', async () => {
    window.localStorage.setItem('smart-seat-auth-token', 'test-token');
    window.localStorage.setItem(
      'smart-seat-auth-user',
      JSON.stringify({ id: 1, name: 'Demo Student', studentNo: '20260001', role: 'STUDENT' }),
    );

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, code: 'OK', message: 'ok', data: [] }),
      }),
    );

    render(
      <MemoryRouter initialEntries={['/student/seats']}>
        <App />
      </MemoryRouter>,
    );
    expect(await screen.findByRole('heading', { level: 3, name: '学生选座' })).toBeTruthy();
  });

  it('submits table QR check-in with token and check-in code', async () => {
    window.localStorage.setItem('smart-seat-auth-token', 'test-token');
    window.localStorage.setItem(
      'smart-seat-auth-user',
      JSON.stringify({ id: 1, name: 'Demo Student', studentNo: '20260001', role: 'STUDENT' }),
    );

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        code: 'OK',
        message: 'ok',
        data: {
          reservationId: 7,
          seatSlotId: 8,
          seatId: 9,
          userId: 1,
          status: 'CHECKED_IN',
          checkinCode: '246810',
          expiresAt: '2026-05-18T10:00:00',
        },
      }),
    });
    vi.stubGlobal('fetch', fetchMock);

    render(
      <MemoryRouter initialEntries={['/student/table-checkin?token=table-token-1']}>
        <App />
      </MemoryRouter>,
    );

    fireEvent.change(await screen.findByLabelText('签到码'), {
      target: { value: '246810' },
    });
    fireEvent.click(screen.getByRole('button', { name: '确认签到' }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/reservations/table-check-in',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ tableQrToken: 'table-token-1', checkinCode: '246810' }),
        }),
      );
    });
    expect(await screen.findByText('预约 7 已完成签到，座位进入使用中状态。')).toBeTruthy();
  });

  it('restores checked-in reservation on student seat page so the student can check out', async () => {
    window.localStorage.setItem('smart-seat-auth-token', 'test-token');
    window.localStorage.setItem(
      'smart-seat-auth-user',
      JSON.stringify({ id: 1, name: 'Demo Student', studentNo: '20260001', role: 'STUDENT' }),
    );

    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url.startsWith('/api/reservations?')) {
        return {
          ok: true,
          json: async () => ({
            success: true,
            code: 'OK',
            message: 'ok',
            data: [
              {
                reservationId: 7,
                seatSlotId: 8,
                seatId: 9,
                userId: 1,
                status: 'CHECKED_IN',
                checkinCode: '246810',
                expiresAt: '2026-05-18T10:00:00',
              },
            ],
          }),
        };
      }

      if (url === '/api/reservations/7/check-out') {
        expect(init?.method).toBe('POST');
        return {
          ok: true,
          json: async () => ({
            success: true,
            code: 'OK',
            message: 'ok',
            data: {
              reservationId: 7,
              seatSlotId: 8,
              seatId: 9,
              userId: 1,
              status: 'CHECKED_OUT',
              checkinCode: '246810',
              expiresAt: '2026-05-18T10:00:00',
            },
          }),
        };
      }

      return {
        ok: true,
        json: async () => ({ success: true, code: 'OK', message: 'ok', data: [] }),
      };
    });
    vi.stubGlobal('fetch', fetchMock);

    render(
      <MemoryRouter initialEntries={['/student/seats']}>
        <App />
      </MemoryRouter>,
    );

    expect(await screen.findByDisplayValue('7')).toBeTruthy();
    expect(await screen.findByDisplayValue('246810')).toBeTruthy();

    const checkoutButton = await screen.findByRole('button', { name: '签 退' });
    expect(checkoutButton).not.toHaveProperty('disabled', true);
    fireEvent.click(checkoutButton);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/reservations/7/check-out',
        expect.objectContaining({ method: 'POST' }),
      );
    });
  });

  it('returns to table QR check-in path after login', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        code: 'OK',
        message: 'ok',
        data: {
          token: 'test-token',
          user: { id: 1, name: 'Demo Student', studentNo: '20260001', role: 'STUDENT' },
          expiresAt: '2026-05-18T12:00:00',
        },
      }),
    });
    vi.stubGlobal('fetch', fetchMock);

    render(
      <MemoryRouter initialEntries={['/student/table-checkin?token=table-token-1']}>
        <App />
      </MemoryRouter>,
    );

    const loginButton = await screen.findByRole('button', { name: /登\s*录/ });
    expect(loginButton).toBeTruthy();
    fireEvent.click(loginButton);

    expect(await screen.findByRole('heading', { level: 3, name: '桌码签到' })).toBeTruthy();
    expect(await screen.findByLabelText('签到码')).toBeTruthy();
  });

  it('renders admin table management route for administrators', async () => {
    window.localStorage.setItem('smart-seat-auth-token', 'test-token');
    window.localStorage.setItem(
      'smart-seat-auth-user',
      JSON.stringify({ id: 2, name: 'Demo Admin', studentNo: 'admin', role: 'ADMIN' }),
    );

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, code: 'OK', message: 'ok', data: [] }),
      }),
    );

    render(
      <MemoryRouter initialEntries={['/admin/tables']}>
        <App />
      </MemoryRouter>,
    );

    expect(await screen.findByRole('heading', { level: 3, name: '桌子管理' })).toBeTruthy();
    expect(await screen.findByRole('link', { name: '桌子管理' })).toBeTruthy();
  });
});
