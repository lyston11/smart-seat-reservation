import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import App from './App';

function makeReservation(overrides: Record<string, unknown> = {}) {
  return {
    reservationId: 7,
    seatSlotId: 8,
    seatId: 9,
    userId: 1,
    status: 'RESERVED',
    checkinCode: '246810',
    expiresAt: '2026-05-18T10:00:00',
    seatNo: 'A-001',
    seatLabel: '1号',
    tableId: 1,
    tableNo: 'T01',
    areaId: 1,
    areaName: 'A 区',
    floor: '1F',
    slotDate: '2026-05-18',
    startTime: '09:00:00',
    endTime: '10:00:00',
    ...overrides,
  };
}

function storeStudentSession() {
  window.localStorage.setItem('smart-seat-auth-token', 'test-token');
  window.localStorage.setItem(
    'smart-seat-auth-user',
    JSON.stringify({ id: 1, name: 'Demo Student', studentNo: '20260001', role: 'STUDENT' }),
  );
}

function toLocalDateTimeText(value: Date) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const date = String(value.getDate()).padStart(2, '0');
  const hours = String(value.getHours()).padStart(2, '0');
  const minutes = String(value.getMinutes()).padStart(2, '0');
  const seconds = String(value.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${date}T${hours}:${minutes}:${seconds}`;
}

afterEach(() => {
  cleanup();
  window.localStorage.clear();
  vi.unstubAllGlobals();
});

describe('App', () => {
  it('renders student seat page title', async () => {
    storeStudentSession();

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
    storeStudentSession();

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
    storeStudentSession();

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

    expect(await screen.findByText('#7')).toBeTruthy();
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

  it('submits a concrete seat reservation with the selected custom time range', async () => {
    storeStudentSession();

    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url.startsWith('/api/areas')) {
        return {
          ok: true,
          json: async () => ({
            success: true,
            code: 'OK',
            message: 'ok',
            data: [
              {
                id: 1,
                name: 'A 区',
                floor: '1F',
                description: null,
                status: 'ACTIVE',
                openTime: '08:00:00',
                closeTime: '22:00:00',
              },
            ],
          }),
        };
      }

      if (url.startsWith('/api/seat-slots?')) {
        return {
          ok: true,
          json: async () => ({
            success: true,
            code: 'OK',
            message: 'ok',
            data: [
              {
                id: 8,
                seatId: 9,
                seatNo: 'A-001',
                tableId: 1,
                tableNo: 'T01',
                tableRowNo: 1,
                tableColumnNo: 1,
                tableDisplayOrder: 1,
                tablePositionX: 120,
                tablePositionY: 80,
                tableWidthPx: 260,
                tableHeightPx: 96,
                tableRotationDeg: 0,
                seatLabel: '1号',
                seatSide: 'NORTH',
                seatOrder: 1,
                rowNo: 1,
                columnNo: 1,
                displayOrder: 1,
                areaId: 1,
                slotDate: '2026-05-18',
                startTime: '08:00:00',
                endTime: '22:00:00',
                status: 'AVAILABLE',
                reservedBy: null,
                reservationId: null,
              },
            ],
          }),
        };
      }

      if (url === '/api/reservations' && init?.method === 'POST') {
        expect(JSON.parse(String(init.body))).toEqual(
          {
            seatId: 9,
            slotDate: expect.any(String),
            startTime: '09:30:00',
            endTime: '17:30:00',
          },
        );
        return {
          ok: true,
          json: async () => ({
            success: true,
            code: 'OK',
            message: 'ok',
            data: {
              reservationId: 7,
              seatSlotId: 88,
              seatId: 9,
              userId: 1,
              status: 'RESERVED',
              checkinCode: '246810',
              expiresAt: '2026-05-18T09:45:00',
            },
          }),
        };
      }

      if (url.startsWith('/api/reservations/rules')) {
        return {
          ok: true,
          json: async () => ({
            success: true,
            code: 'OK',
            message: 'ok',
            data: {
              checkinGraceMinutes: 15,
              maxAdvanceDays: 7,
              dailyActiveReservationLimit: 3,
              updatedBy: null,
              updatedAt: null,
            },
          }),
        };
      }

      if (url.startsWith('/api/reservations?')) {
        return {
          ok: true,
          json: async () => ({ success: true, code: 'OK', message: 'ok', data: [] }),
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

    fireEvent.change(await screen.findByLabelText('开始时间'), {
      target: { value: '09:30' },
    });
    fireEvent.change(screen.getByLabelText('结束时间'), {
      target: { value: '17:30' },
    });
    fireEvent.click(await screen.findByRole('button', { name: /1号/ }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/reservations',
        expect.objectContaining({ method: 'POST' }),
      );
    });
  });

  it('renders the student home dashboard with active reservation details', async () => {
    storeStudentSession();

    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.startsWith('/api/reservations?')) {
        return {
          ok: true,
          json: async () => ({
            success: true,
            code: 'OK',
            message: 'ok',
            data: [
              makeReservation(),
              makeReservation({
                reservationId: 8,
                status: 'CHECKED_OUT',
                areaName: 'B 区',
                floor: '2F',
                tableNo: 'T02',
                seatNo: 'B-002',
                seatLabel: '2号',
                slotDate: '2026-05-18',
                startTime: '14:00:00',
                endTime: '16:00:00',
              }),
            ],
          }),
        };
      }
      if (url.startsWith('/api/reservations/rules')) {
        return {
          ok: true,
          json: async () => ({
            success: true,
            code: 'OK',
            message: 'ok',
            data: {
              checkinGraceMinutes: 15,
              maxAdvanceDays: 7,
              dailyActiveReservationLimit: 3,
              updatedBy: null,
              updatedAt: null,
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
      <MemoryRouter initialEntries={['/student/home']}>
        <App />
      </MemoryRouter>,
    );

    expect(await screen.findByRole('heading', { level: 3, name: '学生首页' })).toBeTruthy();
    expect((await screen.findAllByText('A 区 · 1F · T01 · A-001 (1号)')).length).toBeGreaterThan(0);
    expect(await screen.findByText('签到码 246810 · 截止 2026-05-18 10:00')).toBeTruthy();
    expect(await screen.findByText('今日预约时间线')).toBeTruthy();
    expect(await screen.findByText('最近常用区域')).toBeTruthy();
    expect(await screen.findByText('A 区 · 1F')).toBeTruthy();
  });

  it('lets students check in from the reservation management page', async () => {
    storeStudentSession();

    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url.startsWith('/api/reservations?')) {
        return {
          ok: true,
          json: async () => ({
            success: true,
            code: 'OK',
            message: 'ok',
            data: [makeReservation()],
          }),
        };
      }
      if (url === '/api/reservations/7/check-in') {
        expect(init?.method).toBe('POST');
        expect(JSON.parse(String(init?.body))).toEqual({ checkinCode: '246810' });
        return {
          ok: true,
          json: async () => ({
            success: true,
            code: 'OK',
            message: 'ok',
            data: makeReservation({ status: 'CHECKED_IN' }),
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
      <MemoryRouter initialEntries={['/student/reservations']}>
        <App />
      </MemoryRouter>,
    );

    expect((await screen.findAllByText('A 区 · 1F · T01 · A-001 (1号)')).length).toBeGreaterThan(0);
    fireEvent.click(await screen.findByRole('button', { name: /签\s*到/ }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/reservations/7/check-in',
        expect.objectContaining({ method: 'POST' }),
      );
    });
  });

  it('filters reservations and opens the reservation detail dialog', async () => {
    storeStudentSession();
    const futureExpiresAt = toLocalDateTimeText(new Date(Date.now() + 12 * 60 * 1000));

    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url.startsWith('/api/reservations?')) {
          return {
            ok: true,
            json: async () => ({
              success: true,
              code: 'OK',
              message: 'ok',
              data: [
                makeReservation({ expiresAt: futureExpiresAt }),
                makeReservation({
                  reservationId: 8,
                  status: 'CHECKED_OUT',
                  areaName: 'B 区',
                  floor: '2F',
                  tableNo: 'T02',
                  seatNo: 'B-002',
                  seatLabel: '2号',
                  slotDate: '2026-05-19',
                }),
              ],
            }),
          };
        }
        return {
          ok: true,
          json: async () => ({ success: true, code: 'OK', message: 'ok', data: [] }),
        };
      }),
    );

    render(
      <MemoryRouter initialEntries={['/student/reservations']}>
        <App />
      </MemoryRouter>,
    );

    expect((await screen.findAllByText('A 区 · 1F · T01 · A-001 (1号)')).length).toBeGreaterThan(0);
    expect((await screen.findAllByText('B 区 · 2F · T02 · B-002 (2号)')).length).toBeGreaterThan(0);

    fireEvent.mouseDown(screen.getByLabelText('状态筛选'));
    const reservedOptions = await screen.findAllByText('待签到');
    fireEvent.click(reservedOptions[reservedOptions.length - 1]);

    await waitFor(() => {
      expect(screen.queryByText('B 区 · 2F · T02 · B-002 (2号)')).toBeNull();
    });

    fireEvent.click(screen.getAllByRole('button', { name: '查看详情' })[0]);

    await waitFor(() => {
      expect(document.querySelector('.ant-modal-title')?.textContent).toBe('预约 #7');
    });
    expect(await screen.findByText('2026-05-18')).toBeTruthy();
    expect(await screen.findByText('09:00-10:00')).toBeTruthy();
    expect((await screen.findAllByText(/剩余 \d+ 分钟/)).length).toBeGreaterThan(0);
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
