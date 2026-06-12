import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import App from './App';
import { toBusinessTime } from './utils/businessTime';

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

function makeReservationRules(overrides: Record<string, unknown> = {}) {
  return {
    checkinGraceMinutes: 10,
    checkinLeadMinutes: 10,
    maxAdvanceDays: 7,
    reservationOpenHour: 18,
    dailyActiveReservationLimit: 3,
    wifiOfflineReleaseMinutes: 15,
    seatLockMinutes: 60,
    updatedBy: null,
    updatedAt: null,
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

function storeAdminSession() {
  window.localStorage.setItem('smart-seat-auth-token', 'test-token');
  window.localStorage.setItem(
    'smart-seat-auth-user',
    JSON.stringify({ id: 2, name: 'Demo Admin', studentNo: 'admin', role: 'ADMIN' }),
  );
}

function toLocalDateTimeText(value: Date) {
  return toBusinessTime(value).format('YYYY-MM-DDTHH:mm:ss');
}

function toLocalDateText(value: Date) {
  return toBusinessTime(value).format('YYYY-MM-DD');
}

function nextFutureHalfHourText(minOffsetMinutes = 30) {
  const value = toBusinessTime(Date.now() + minOffsetMinutes * 60 * 1000);
  const minutes = value.hour() * 60 + value.minute();
  const nextMinutes = Math.min(Math.ceil((minutes + 1) / 30) * 30, 22 * 60);
  return `${String(Math.floor(nextMinutes / 60)).padStart(2, '0')}:${String(nextMinutes % 60).padStart(2, '0')}`;
}

function addMinutesToTimeText(value: string, minutesToAdd: number) {
  const [hours, minutes] = value.split(':').map(Number);
  const total = Math.min(hours * 60 + minutes + minutesToAdd, 23 * 60 + 30);
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

function withOrigin(path: string) {
  return `${window.location.origin}${path}`;
}

async function selectComboboxValue(label: string, value: string) {
  fireEvent.mouseDown(await screen.findByLabelText(label));
  const options = await screen.findAllByText(value);
  fireEvent.click(options[options.length - 1]);
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
    expect(document.querySelector('.app-content')?.className).toContain('motion-viewport');
  });

  it('clears stored session and redirects to login when token is invalid', async () => {
    storeAdminSession();

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({
          success: false,
          code: 'AUTH_INVALID',
          message: 'Authentication token is invalid or expired',
          data: null,
        }),
      }),
    );

    render(
      <MemoryRouter initialEntries={['/admin/dashboard']}>
        <App />
      </MemoryRouter>,
    );

    expect(await screen.findByRole('heading', { level: 3, name: '占用看板' })).toBeTruthy();
    await waitFor(() => {
      expect(window.localStorage.getItem('smart-seat-auth-token')).toBeNull();
      expect(window.localStorage.getItem('smart-seat-auth-user')).toBeNull();
    });
    expect(await screen.findByRole('button', { name: /登\s*录/ })).toBeTruthy();
  });

  it('renders the polished login page with role quick accounts', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, code: 'OK', message: 'ok', data: [] }),
      }),
    );

    render(
      <MemoryRouter initialEntries={['/login']}>
        <App />
      </MemoryRouter>,
    );

    expect(await screen.findByRole('heading', { level: 1, name: 'Smart Seat' })).toBeTruthy();
    expect(document.querySelector('.login-page')?.className).toContain('motion-page');
    expect(await screen.findByText('智慧座位预约系统')).toBeTruthy();
    expect(await screen.findByText('实时选座')).toBeTruthy();
    expect(await screen.findByText('扫码签到')).toBeTruthy();
    expect(await screen.findByText('预约规则')).toBeTruthy();
    expect(await screen.findByText('管理看板')).toBeTruthy();
    expect(await screen.findByText('防重复预约')).toBeTruthy();
    expect(await screen.findByText('座位地图 / Seat Map')).toBeTruthy();
    expect(await screen.findByText('学生预约流程')).toBeTruthy();
    expect(await screen.findByText('学生预约')).toBeTruthy();
    expect((await screen.findAllByText('到场签到')).length).toBeGreaterThanOrEqual(1);
    expect(await screen.findByText('管理员调度')).toBeTruthy();
    expect(await screen.findByText('状态追踪')).toBeTruthy();
    expect(screen.queryByText('我的预约')).toBeNull();
    expect(screen.queryByText('已预约')).toBeNull();
    expect(screen.queryByText('A区-2F-026')).toBeNull();

    const adminAccount = await screen.findByRole('button', { name: /管理员演示账号/ });
    fireEvent.click(adminAccount);

    expect(screen.getByLabelText('学号/账号')).toHaveProperty('value', 'admin');
    expect(screen.getByLabelText('密码')).toHaveProperty('value', 'admin');
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

  it('submits seat QR check-in with token and can restore a locked reservation', async () => {
    storeStudentSession();

    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url === '/api/reservations/seat-check-in') {
        expect(init?.method).toBe('POST');
        expect(JSON.parse(String(init?.body))).toEqual({ seatQrToken: 'seat-token-1', checkinCode: '246810' });
        return {
          ok: true,
          json: async () => ({
            success: true,
            code: 'OK',
            message: 'ok',
            data: makeReservation({
              status: 'CHECKED_IN',
              seatNo: 'A-001',
              lockedUntilAt: null,
            }),
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
      <MemoryRouter initialEntries={['/student/seat-checkin?token=seat-token-1']}>
        <App />
      </MemoryRouter>,
    );

    expect(await screen.findByRole('heading', { level: 3, name: '座位码签到' })).toBeTruthy();
    fireEvent.change(await screen.findByLabelText('签到码'), {
      target: { value: '246810' },
    });
    fireEvent.click(screen.getByRole('button', { name: '确认签到/解锁' }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/reservations/seat-check-in',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ seatQrToken: 'seat-token-1', checkinCode: '246810' }),
        }),
      );
    });
    expect(await screen.findByText('预约 7 已通过座位码确认到场或恢复使用。')).toBeTruthy();
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
                areaName: 'A/B 连廊学习区',
                floor: '2F',
                tableNo: 'T04',
                seatNo: 'A-013',
                seatLabel: '1',
                slotDate: '2026-05-18',
                startTime: '08:00:00',
                endTime: '22:00:00',
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
    const currentReservation = await screen.findByLabelText('当前预约');
    expect(currentReservation.className).toContain('student-current-reservation-card');
    expect(within(currentReservation).getByText('使用中')).toBeTruthy();
    expect(within(currentReservation).getByText('预约位置')).toBeTruthy();
    expect(within(currentReservation).getByText('A-B教学楼连廊学习区 · 2F · T04 · A-013 (1)')).toBeTruthy();
    expect(within(currentReservation).getByText('签到凭证')).toBeTruthy();

    const checkinButton = await screen.findByRole('button', { name: '开发测试签到' });
    expect(checkinButton).toHaveProperty('disabled', true);
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
    const todayText = toLocalDateText(new Date());
    const startText = nextFutureHalfHourText();
    const endText = addMinutesToTimeText(startText, 60);

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
                name: 'A/B 连廊学习区',
                floor: '2F',
                buildingCode: 'CONNECTOR',
                floorCode: '2F',
                areaType: 'CONNECTOR',
                description: 'A/B connector',
                status: 'ACTIVE',
                openTime: '08:00:00',
                closeTime: '22:00:00',
                checkinIpCidrs: '127.0.0.1/32,::1/128',
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
                slotDate: todayText,
                startTime: `${startText}:00`,
                endTime: `${endText}:00`,
                status: 'AVAILABLE',
                reservedBy: null,
                reservationId: null,
              },
            ],
          }),
        };
      }

      if (url.startsWith('/api/seats?')) {
        return {
          ok: true,
          json: async () => ({
            success: true,
            code: 'OK',
            message: 'ok',
            data: [
              {
                id: 9,
                areaId: 1,
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
                seatNo: 'A-001',
                seatLabel: '1号',
                seatSide: 'NORTH',
                seatOrder: 1,
                rowNo: 1,
                columnNo: 1,
                displayOrder: 1,
                status: 'ACTIVE',
              },
            ],
          }),
        };
      }

      if (url === '/api/reservations' && init?.method === 'POST') {
        expect(JSON.parse(String(init.body))).toEqual(
          {
            seatId: 9,
            slotDate: todayText,
            startTime: `${startText}:00`,
            endTime: `${endText}:00`,
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
            data: makeReservationRules({ reservationOpenHour: 0 }),
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

    fireEvent.click(await screen.findByRole('button', { name: /A-001|1号/ }));
    await selectComboboxValue('开始时间', startText);
    await selectComboboxValue('结束时间', endText);
    fireEvent.click(await screen.findByRole('button', { name: '预约该座位' }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/reservations',
        expect.objectContaining({ method: 'POST' }),
      );
    });
    expect(await screen.findByText('扫描桌面/座位二维码完成正式签到；测试入口仍会校验校园网 IP 和签到时间窗。')).toBeTruthy();
    expect(await screen.findByText('下一步：确认座位和时间无误后提交预约，成功后到座扫码签到。')).toBeTruthy();
  });

  it('keeps the selected seat visible after changing the selected time', async () => {
    storeStudentSession();
    const todayText = toLocalDateText(new Date());
    const startText = nextFutureHalfHourText();
    const nextStartText = addMinutesToTimeText(startText, 30);
    const endText = addMinutesToTimeText(startText, 90);

    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
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
                name: 'A/B 连廊学习区',
                floor: '2F',
                buildingCode: 'CONNECTOR',
                floorCode: '2F',
                areaType: 'CONNECTOR',
                description: 'A/B connector',
                status: 'ACTIVE',
                openTime: '08:00:00',
                closeTime: '22:00:00',
                checkinIpCidrs: '127.0.0.1/32,::1/128',
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
                slotDate: todayText,
                startTime: `${startText}:00`,
                endTime: `${endText}:00`,
                status: 'AVAILABLE',
                reservedBy: null,
                reservationId: null,
              },
            ],
          }),
        };
      }

      if (url.startsWith('/api/seats?')) {
        return {
          ok: true,
          json: async () => ({
            success: true,
            code: 'OK',
            message: 'ok',
            data: [
              {
                id: 9,
                areaId: 1,
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
                seatNo: 'A-001',
                seatLabel: '1号',
                seatSide: 'NORTH',
                seatOrder: 1,
                rowNo: 1,
                columnNo: 1,
                displayOrder: 1,
                status: 'ACTIVE',
              },
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
            data: makeReservationRules({ reservationOpenHour: 0 }),
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

    fireEvent.click(await screen.findByRole('button', { name: /A-001|1号/ }));
    expect((await screen.findAllByText('1号')).length).toBeGreaterThan(0);

    await selectComboboxValue('开始时间', nextStartText);

    expect((await screen.findAllByText('1号')).length).toBeGreaterThan(0);
    expect(screen.queryByText('请先在座位地图中选择一个位置。')).toBeNull();
  });

  it('shows real seats as unpublished when the area has no opened slots yet', async () => {
    storeStudentSession();

    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
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
                name: 'A/B 连廊学习区',
                floor: '2F',
                buildingCode: 'CONNECTOR',
                floorCode: '2F',
                areaType: 'CONNECTOR',
                description: 'A/B connector',
                status: 'ACTIVE',
                openTime: '08:00:00',
                closeTime: '22:00:00',
                checkinIpCidrs: '127.0.0.1/32,::1/128',
              },
            ],
          }),
        };
      }

      if (url.startsWith('/api/seats?')) {
        return {
          ok: true,
          json: async () => ({
            success: true,
            code: 'OK',
            message: 'ok',
            data: [
              {
                id: 9,
                areaId: 1,
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
                seatNo: 'A-001',
                seatLabel: '1号',
                seatSide: 'NORTH',
                seatOrder: 1,
                rowNo: 1,
                columnNo: 1,
                displayOrder: 1,
                status: 'ACTIVE',
              },
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
            data: makeReservationRules(),
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

    const seat = await screen.findByRole('button', { name: /1号/ });
    expect(seat).toHaveProperty('disabled', false);
    fireEvent.click(seat);
    expect((await screen.findAllByText('未开放')).length).toBeGreaterThan(0);
    expect(await screen.findByRole('button', { name: '预约该座位' })).toHaveProperty('disabled', true);
    expect(fetchMock).toHaveBeenCalledWith('/api/seats?areaId=1', expect.any(Object));
  });

  it('switches reservation area from the indoor map and loads that area seats', async () => {
    storeStudentSession();

    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
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
                name: 'A 楼北自习区',
                floor: '1F',
                description: null,
                status: 'ACTIVE',
                openTime: '08:00:00',
                closeTime: '22:00:00',
                checkinIpCidrs: '127.0.0.1/32,::1/128',
              },
              {
                id: 2,
                name: 'B/C 连廊学习区',
                floor: '2F',
                buildingCode: 'CONNECTOR_CD',
                floorCode: '2F',
                areaType: 'CONNECTOR',
                description: 'B/C connector',
                status: 'ACTIVE',
                openTime: '09:00:00',
                closeTime: '21:00:00',
                checkinIpCidrs: '127.0.0.1/32,::1/128',
              },
              {
                id: 3,
                name: 'A/B 连廊学习区',
                floor: '2F',
                buildingCode: 'CONNECTOR',
                floorCode: '2F',
                areaType: 'CONNECTOR',
                description: 'A/B connector',
                status: 'ACTIVE',
                openTime: '08:00:00',
                closeTime: '22:00:00',
                checkinIpCidrs: '127.0.0.1/32,::1/128',
              },
            ],
          }),
        };
      }

      if (url.startsWith('/api/seats?')) {
        const areaId = new URL(url, 'http://localhost').searchParams.get('areaId');
        return {
          ok: true,
          json: async () => ({
            success: true,
            code: 'OK',
            message: 'ok',
            data:
              areaId === '2'
                ? [
                    {
                      id: 20,
                      areaId: 2,
                      tableId: 20,
                      tableNo: 'B01',
                      tableRowNo: 1,
                      tableColumnNo: 1,
                      tableDisplayOrder: 1,
                      tablePositionX: 180,
                      tablePositionY: 100,
                      tableWidthPx: 260,
                      tableHeightPx: 96,
                      tableRotationDeg: 0,
                      seatNo: 'B-001',
                      seatLabel: 'B座1号',
                      seatSide: 'NORTH',
                      seatOrder: 1,
                      rowNo: 1,
                      columnNo: 1,
                      displayOrder: 1,
                      status: 'ACTIVE',
                    },
                  ]
                : [],
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
            data: makeReservationRules(),
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

    const seatNavigator = await screen.findByLabelText('选座导航');
    expect(within(seatNavigator).getByText('公共区域位置')).toBeTruthy();
    expect(within(seatNavigator).queryByText('连廊区域')).toBeNull();
    expect(screen.queryByRole('button', { name: /A 楼北自习区/ })).toBeNull();
    fireEvent.click(await screen.findByRole('button', { name: /B-C教学楼连廊学习区/ }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith('/api/seats?areaId=2', expect.any(Object));
    });
    expect(await screen.findByRole('button', { name: /1号/ })).toBeTruthy();
  });

  it('finishes student seat loading after connector areas and slots resolve', async () => {
    storeStudentSession();
    const todayText = toLocalDateText(new Date());
    const startText = nextFutureHalfHourText();
    const endText = addMinutesToTimeText(startText, 60);

    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
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
                name: 'A/B 连廊学习区',
                floor: '2F',
                buildingCode: 'CONNECTOR',
                floorCode: '2F',
                areaType: 'CONNECTOR',
                description: 'A/B connector',
                status: 'ACTIVE',
                openTime: '08:00:00',
                closeTime: '22:00:00',
                checkinIpCidrs: '127.0.0.1/32,::1/128',
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
                slotDate: todayText,
                startTime: `${startText}:00`,
                endTime: `${endText}:00`,
                status: 'AVAILABLE',
                reservedBy: null,
                reservationId: null,
              },
            ],
          }),
        };
      }

      if (url.startsWith('/api/seats?')) {
        return {
          ok: true,
          json: async () => ({
            success: true,
            code: 'OK',
            message: 'ok',
            data: [
              {
                id: 9,
                areaId: 1,
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
                seatNo: 'A-001',
                seatLabel: '1号',
                seatSide: 'NORTH',
                seatOrder: 1,
                rowNo: 1,
                columnNo: 1,
                displayOrder: 1,
                status: 'ACTIVE',
              },
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
            data: makeReservationRules({ reservationOpenHour: 0 }),
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

    await screen.findByRole('button', { name: /1号/ });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: '刷新座位' }).querySelector('.anticon-loading')).toBeNull();
    });
  });

  it('keeps floor changes, time filters, and the seat map aligned on the student page', async () => {
    storeStudentSession();
    const todayText = toLocalDateText(new Date());
    const startText = nextFutureHalfHourText();
    const endText = addMinutesToTimeText(startText, 60);

    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
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
                name: 'A 楼一层自习区',
                floor: '1F',
                buildingCode: 'A',
                floorCode: '1F',
                areaType: 'STUDY_ROOM',
                mapX: 20,
                mapY: 20,
                description: null,
                status: 'ACTIVE',
                openTime: '08:00:00',
                closeTime: '22:00:00',
                checkinIpCidrs: '127.0.0.1/32,::1/128',
              },
              {
                id: 2,
                name: 'B/C 连廊二层学习区',
                floor: '2F',
                buildingCode: 'CONNECTOR_CD',
                floorCode: '2F',
                areaType: 'CONNECTOR',
                mapX: 70,
                mapY: 20,
                description: 'B/C connector',
                status: 'ACTIVE',
                openTime: '09:00:00',
                closeTime: '21:00:00',
                checkinIpCidrs: '127.0.0.1/32,::1/128',
              },
            ],
          }),
        };
      }

      if (url.startsWith('/api/seat-slots?')) {
        const areaId = new URL(url, 'http://localhost').searchParams.get('areaId');
        return {
          ok: true,
          json: async () => ({
            success: true,
            code: 'OK',
            message: 'ok',
            data:
              areaId === '2'
                ? [
                    {
                      id: 28,
                      seatId: 29,
                      seatNo: 'B-201',
                      tableId: 2,
                      tableNo: 'B02',
                      tableRowNo: 1,
                      tableColumnNo: 1,
                      tableDisplayOrder: 1,
                      tablePositionX: 180,
                      tablePositionY: 120,
                      tableWidthPx: 260,
                      tableHeightPx: 96,
                      tableRotationDeg: 0,
                      seatLabel: 'B座1号',
                      seatSide: 'NORTH',
                      seatOrder: 1,
                      rowNo: 1,
                      columnNo: 1,
                      displayOrder: 1,
                      areaId: 2,
                      slotDate: todayText,
                      startTime: `${startText}:00`,
                      endTime: `${endText}:00`,
                      status: 'AVAILABLE',
                      reservedBy: null,
                      reservationId: null,
                    },
                  ]
                : [],
          }),
        };
      }

      if (url.startsWith('/api/seats?')) {
        const areaId = new URL(url, 'http://localhost').searchParams.get('areaId');
        return {
          ok: true,
          json: async () => ({
            success: true,
            code: 'OK',
            message: 'ok',
            data:
              areaId === '2'
                ? [
                    {
                      id: 29,
                      areaId: 2,
                      tableId: 2,
                      tableNo: 'B02',
                      tableRowNo: 1,
                      tableColumnNo: 1,
                      tableDisplayOrder: 1,
                      tablePositionX: 180,
                      tablePositionY: 120,
                      tableWidthPx: 260,
                      tableHeightPx: 96,
                      tableRotationDeg: 0,
                      seatNo: 'B-201',
                      seatLabel: 'B座1号',
                      seatSide: 'NORTH',
                      seatOrder: 1,
                      rowNo: 1,
                      columnNo: 1,
                      displayOrder: 1,
                      status: 'ACTIVE',
                    },
                  ]
                : [],
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
            data: makeReservationRules({ reservationOpenHour: 0 }),
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

    const seatNavigator = await screen.findByLabelText('选座导航');
    expect(screen.queryByLabelText('选座筛选')).toBeNull();
    expect(within(seatNavigator).getByText('公共区域位置')).toBeTruthy();
    expect(within(seatNavigator).queryByText('连廊区域')).toBeNull();
    const dateSegmented = within(seatNavigator).getByLabelText('预约日期');
    expect(dateSegmented.className).toContain('student-seat-date-segmented');
    const startTimeSelect = within(seatNavigator).getByLabelText('开始时间');
    const endTimeSelect = within(seatNavigator).getByLabelText('结束时间');
    expect(startTimeSelect.closest('.ant-select')?.className).toContain('student-seat-time-select');
    expect(endTimeSelect.closest('.ant-select')?.className).toContain('student-seat-time-select');

    fireEvent.click(await screen.findByRole('radio', { name: '2F' }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith('/api/seats?areaId=2', expect.any(Object));
    });
    expect(await screen.findByRole('group', { name: 'B02' })).toBeTruthy();

    const reservationPath = await screen.findByLabelText('预约确认浮窗');
    await waitFor(() => {
      expect(within(reservationPath).getByText('2F')).toBeTruthy();
      expect(within(reservationPath).getByText('B-C教学楼连廊二层学习区')).toBeTruthy();
    });
    expect(within(reservationPath).getByText('可预约')).toBeTruthy();
    expect(within(reservationPath).getByText('占用/异常')).toBeTruthy();
    expect(within(reservationPath).queryByText('日期')).toBeNull();
    expect(screen.queryByLabelText('选择路径')).toBeNull();
    expect(screen.queryByLabelText('预约概览')).toBeNull();
  });

  it('connects floor, area, time, table, and seat in one reservation path', async () => {
    storeStudentSession();
    const todayText = toLocalDateText(new Date());
    const startText = nextFutureHalfHourText();
    const endText = addMinutesToTimeText(startText, 60);

    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
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
                name: 'A/B 连廊学习区',
                floor: '2F',
                buildingCode: 'CONNECTOR',
                floorCode: '2F',
                areaType: 'CONNECTOR',
                mapX: 20,
                mapY: 20,
                description: 'A/B connector',
                status: 'ACTIVE',
                openTime: '08:00:00',
                closeTime: '22:00:00',
                checkinIpCidrs: '127.0.0.1/32,::1/128',
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
                seatId: 41,
                seatNo: 'A-041',
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
                seatLabel: '41号',
                seatSide: 'NORTH',
                seatOrder: 1,
                rowNo: 1,
                columnNo: 1,
                displayOrder: 1,
                areaId: 1,
                slotDate: todayText,
                startTime: `${startText}:00`,
                endTime: `${endText}:00`,
                status: 'AVAILABLE',
                reservedBy: null,
                reservationId: null,
              },
            ],
          }),
        };
      }

      if (url.startsWith('/api/seats?')) {
        return {
          ok: true,
          json: async () => ({
            success: true,
            code: 'OK',
            message: 'ok',
            data: [
              {
                id: 41,
                areaId: 1,
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
                seatNo: 'A-041',
                seatLabel: '41号',
                seatSide: 'NORTH',
                seatOrder: 1,
                rowNo: 1,
                columnNo: 1,
                displayOrder: 1,
                status: 'ACTIVE',
              },
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
            data: makeReservationRules({ reservationOpenHour: 0 }),
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

    const reservationPath = await screen.findByLabelText('预约确认浮窗');
    expect(within(reservationPath).getByText('选择路径')).toBeTruthy();
    expect(reservationPath.className).toContain('student-reservation-floating-summary');
    expect(within(reservationPath).getByText('楼层')).toBeTruthy();
    await waitFor(() => {
      expect(within(reservationPath).getByText('2F')).toBeTruthy();
    });
    expect(within(reservationPath).getByText('区域')).toBeTruthy();
    await waitFor(() => {
      expect(within(reservationPath).getByText('A-B教学楼连廊学习区')).toBeTruthy();
    });
    expect(within(reservationPath).getByText('预约时段')).toBeTruthy();

    fireEvent.click(await screen.findByRole('button', { name: /1号/ }));

    expect(within(reservationPath).getByText('桌座')).toBeTruthy();
    await waitFor(() => {
      expect(within(reservationPath).getByText('T01 · 1号')).toBeTruthy();
    });
    expect((await screen.findAllByText('T01 · 1号')).length).toBeGreaterThan(0);
    expect(screen.queryByText('T01 · 41号')).toBeNull();
  });

  it('marks student reservation panels as adaptive content frames', async () => {
    storeStudentSession();
    const todayText = toLocalDateText(new Date());
    const startText = nextFutureHalfHourText();
    const endText = addMinutesToTimeText(startText, 60);

    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
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
                name: 'A/B 连廊学习区',
                floor: '2F',
                buildingCode: 'CONNECTOR',
                floorCode: '2F',
                areaType: 'CONNECTOR',
                mapX: 30,
                mapY: 20,
                description: 'A/B connector',
                status: 'ACTIVE',
                openTime: '08:00:00',
                closeTime: '22:00:00',
                checkinIpCidrs: '127.0.0.1/32,::1/128',
              },
              {
                id: 2,
                name: 'B/C 连廊学习区',
                floor: '2F',
                buildingCode: 'CONNECTOR_CD',
                floorCode: '2F',
                areaType: 'CONNECTOR',
                mapX: 70,
                mapY: 20,
                description: 'B/C connector',
                status: 'ACTIVE',
                openTime: '08:00:00',
                closeTime: '22:00:00',
                checkinIpCidrs: '127.0.0.1/32,::1/128',
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
                seatId: 41,
                seatNo: 'A-041',
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
                seatLabel: '41号',
                seatSide: 'NORTH',
                seatOrder: 1,
                rowNo: 1,
                columnNo: 1,
                displayOrder: 1,
                areaId: 1,
                slotDate: todayText,
                startTime: `${startText}:00`,
                endTime: `${endText}:00`,
                status: 'AVAILABLE',
                reservedBy: null,
                reservationId: null,
              },
            ],
          }),
        };
      }

      if (url.startsWith('/api/seats?')) {
        return {
          ok: true,
          json: async () => ({
            success: true,
            code: 'OK',
            message: 'ok',
            data: [
              {
                id: 41,
                areaId: 1,
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
                seatNo: 'A-041',
                seatLabel: '41号',
                seatSide: 'NORTH',
                seatOrder: 1,
                rowNo: 1,
                columnNo: 1,
                displayOrder: 1,
                status: 'ACTIVE',
              },
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
            data: makeReservationRules({ reservationOpenHour: 0 }),
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

    const navigationFrame = await screen.findByLabelText('选座导航');
    const page = navigationFrame.closest('.student-seat-page');
    expect(page?.className).toContain('student-seat-centered-page');
    expect(within(navigationFrame).getByText('公共区域位置')).toBeTruthy();
    expect(within(navigationFrame).queryByText('连廊区域')).toBeNull();
    await waitFor(() => {
      expect(within(navigationFrame).getByText('A-B教学楼连廊')).toBeTruthy();
      expect(within(navigationFrame).getByText('B-C教学楼连廊')).toBeTruthy();
    });
    expect(within(navigationFrame).queryByText('A/B 连廊')).toBeNull();
    expect(within(navigationFrame).queryByText('B/C 连廊')).toBeNull();
    const currentSelection = within(navigationFrame).getByLabelText('当前选择');
    expect(within(currentSelection).queryByText('A-B教学楼连廊学习区')).toBeNull();
    expect(within(currentSelection).queryByText('B-C教学楼连廊学习区')).toBeNull();
    expect(within(navigationFrame).getByLabelText('开始时间')).toBeTruthy();
    expect(screen.queryByLabelText('室内导航')).toBeNull();
    expect(screen.queryByLabelText('选座筛选')).toBeNull();

    const adaptiveFrames = [
      navigationFrame,
      await screen.findByLabelText('预约确认浮窗'),
      screen.getByLabelText('座位预约工作区'),
    ];

    adaptiveFrames.forEach((frame) => {
      expect(frame.className).toContain('student-seat-adaptive-frame');
    });
    expect(screen.queryByLabelText('预约规则提示')).toBeNull();
  });

  it('shows the reservation rule warning only when the selected time is out of range', async () => {
    storeStudentSession();
    const todayText = toLocalDateText(new Date());

    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
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
                name: 'A/B 连廊学习区',
                floor: '2F',
                buildingCode: 'CONNECTOR',
                floorCode: '2F',
                areaType: 'CONNECTOR',
                description: 'A/B connector',
                status: 'ACTIVE',
                openTime: '08:00:00',
                closeTime: '08:30:00',
                checkinIpCidrs: '127.0.0.1/32,::1/128',
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
                id: 18,
                seatId: 41,
                seatNo: 'A-041',
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
                seatLabel: '41号',
                seatSide: 'NORTH',
                seatOrder: 1,
                rowNo: 1,
                columnNo: 1,
                displayOrder: 1,
                areaId: 1,
                slotDate: todayText,
                startTime: '08:00:00',
                endTime: '08:30:00',
                status: 'AVAILABLE',
                reservedBy: null,
                reservationId: null,
              },
            ],
          }),
        };
      }

      if (url.startsWith('/api/seats?')) {
        return {
          ok: true,
          json: async () => ({
            success: true,
            code: 'OK',
            message: 'ok',
            data: [
              {
                id: 41,
                areaId: 1,
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
                seatNo: 'A-041',
                seatLabel: '41号',
                seatSide: 'NORTH',
                seatOrder: 1,
                rowNo: 1,
                columnNo: 1,
                displayOrder: 1,
                status: 'ACTIVE',
              },
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
            data: makeReservationRules({ reservationOpenHour: 0 }),
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

    const ruleWarning = await screen.findByLabelText('预约规则提示');
    expect(ruleWarning.getAttribute('role')).toBe('alert');
    expect(within(ruleWarning).getByText('已开始或过去的时间段不可预约')).toBeTruthy();
    expect(screen.getAllByText('已开始或过去的时间段不可预约')).toHaveLength(1);
    expect(screen.queryByText('同一时间仅允许保留一个活跃预约')).toBeNull();
    expect(screen.queryByText('时间最小粒度为半小时')).toBeNull();
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
            data: makeReservationRules(),
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

    expect(await screen.findByRole('heading', { level: 3, name: '学生预约工作台' })).toBeTruthy();
    expect(await screen.findByLabelText('今日状态')).toBeTruthy();
    expect(await screen.findByLabelText('快捷入口')).toBeTruthy();
    expect(await screen.findByLabelText('学生首页主内容')).toBeTruthy();
    expect((await screen.findAllByText('A 区 · 1F · T01 · A-001 (1号)')).length).toBeGreaterThan(0);
    expect(await screen.findByText('签到码 246810 · 截止 2026-05-18 10:00')).toBeTruthy();
    expect(await screen.findByText('正式签到请扫描桌面/座位二维码，测试按钮仍会校验校园网 IP。')).toBeTruthy();
    expect(await screen.findByText('今日预约时间线')).toBeTruthy();
    expect(await screen.findByText('最近常用区域')).toBeTruthy();
    expect(await screen.findByText('A 区 · 1F')).toBeTruthy();
  });

  it('centers the student home content wrapper', async () => {
    storeStudentSession();

    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url.startsWith('/api/reservations/rules')) {
          return {
            ok: true,
            json: async () => ({
              success: true,
              code: 'OK',
              message: 'ok',
              data: makeReservationRules(),
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
      <MemoryRouter initialEntries={['/student/home']}>
        <App />
      </MemoryRouter>,
    );

    const heroText = await screen.findByText('先看今天状态，再选择座位或处理签到。');
    const page = heroText.closest('.page');
    expect(page?.className).toContain('student-home-page');
  });

  it('lets students lock a checked-in reservation directly from the home page', async () => {
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
              makeReservation({
                status: 'CHECKED_IN',
                startTime: '09:00:00',
                endTime: '14:00:00',
                seatLockQuota: 1,
                seatLockUsedCount: 0,
              }),
            ],
          }),
        };
      }
      if (url === '/api/reservations/7/seat-lock') {
        expect(init?.method).toBe('POST');
        return {
          ok: true,
          json: async () => ({
            success: true,
            code: 'OK',
            message: 'ok',
            data: makeReservation({
              status: 'LOCKED',
              startTime: '09:00:00',
              endTime: '14:00:00',
              seatLockQuota: 1,
              seatLockUsedCount: 1,
              lockedUntilAt: '2026-05-18T11:00:00',
            }),
          }),
        };
      }
      if (url === '/api/reservations/7/wifi-presence') {
        return {
          ok: true,
          json: async () => ({
            success: true,
            code: 'OK',
            message: 'ok',
            data: {
              reservationId: 7,
              status: 'CHECKED_IN',
              lastWifiSeenAt: '2026-05-18T10:01:00',
              offlineReleaseMinutes: 15,
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
            data: makeReservationRules({ seatLockMinutes: 60 }),
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

    expect(await screen.findByText('锁位权益')).toBeTruthy();
    expect(await screen.findByText('可锁位 1 次')).toBeTruthy();
    fireEvent.click(await screen.findByRole('button', { name: /锁\s*位/ }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/reservations/7/seat-lock',
        expect.objectContaining({ method: 'POST' }),
      );
    });
  });

  it('sends WiFi presence heartbeats globally for checked-in student reservations', async () => {
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
            data: [makeReservation({ status: 'CHECKED_IN' })],
          }),
        };
      }
      if (url === '/api/reservations/7/wifi-presence') {
        expect(init?.method).toBe('POST');
        return {
          ok: true,
          json: async () => ({
            success: true,
            code: 'OK',
            message: 'ok',
            data: {
              reservationId: 7,
              status: 'CHECKED_IN',
              lastWifiSeenAt: '2026-05-19T09:01:00',
              offlineReleaseMinutes: 15,
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
            data: makeReservationRules(),
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

    expect(await screen.findByRole('heading', { level: 3, name: '学生预约工作台' })).toBeTruthy();
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/reservations/7/wifi-presence',
        expect.objectContaining({ method: 'POST' }),
      );
    });
  });

  it('centers the student reservation management content wrapper', async () => {
    storeStudentSession();

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, code: 'OK', message: 'ok', data: [] }),
      }),
    );

    render(
      <MemoryRouter initialEntries={['/student/reservations']}>
        <App />
      </MemoryRouter>,
    );

    const sectionTitle = await screen.findByText('当前可操作预约');
    const page = sectionTitle.closest('.page');
    expect(page?.className).toContain('student-reservations-page');
  });

  it('keeps a clearly marked development check-in entry on the reservation management page', async () => {
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
    expect(
      await screen.findByText('正式流程请扫描桌面/座位二维码；下方入口仅用于开发测试，仍会校验校园网 IP 和签到时间窗。'),
    ).toBeTruthy();
    const checkinButtons = await screen.findAllByRole('button', { name: /开发测试签到/ });
    fireEvent.click(checkinButtons[0]);

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
    storeAdminSession();

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

  it('renders a student-view seat map on the admin table page for locating reported seats', async () => {
    storeAdminSession();

    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL) => {
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
                  checkinIpCidrs: '127.0.0.1/32,::1/128',
                },
              ],
            }),
          };
        }
        if (url.startsWith('/api/tables?')) {
          return {
            ok: true,
            json: async () => ({
              success: true,
              code: 'OK',
              message: 'ok',
              data: [
                {
                  id: 1,
                  areaId: 1,
                  tableNo: 'T01',
                  name: 'A 区 T01',
                  status: 'ACTIVE',
                  rowNo: 1,
                  columnNo: 1,
                  displayOrder: 1,
                  positionX: 120,
                  positionY: 80,
                  widthPx: 260,
                  heightPx: 96,
                  rotationDeg: 0,
                },
              ],
            }),
          };
        }
        if (url.startsWith('/api/seats?')) {
          return {
            ok: true,
            json: async () => ({
              success: true,
              code: 'OK',
              message: 'ok',
              data: [
                {
                  id: 101,
                  areaId: 1,
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
                  seatNo: 'A-101',
                  seatLabel: '101号',
                  seatSide: 'NORTH',
                  seatOrder: 1,
                  rowNo: null,
                  columnNo: null,
                  displayOrder: null,
                  status: 'ACTIVE',
                },
                {
                  id: 102,
                  areaId: 1,
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
                  seatNo: 'A-102',
                  seatLabel: '102号',
                  seatSide: 'SOUTH',
                  seatOrder: 1,
                  rowNo: null,
                  columnNo: null,
                  displayOrder: null,
                  status: 'INACTIVE',
                },
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
      <MemoryRouter initialEntries={['/admin/tables']}>
        <App />
      </MemoryRouter>,
    );

    expect(await screen.findByRole('heading', { level: 3, name: '桌子管理' })).toBeTruthy();
    const adminSeatPage = (await screen.findByLabelText('桌子筛选')).closest('.admin-seat-layout-page');
    expect(adminSeatPage?.className).toContain('admin-seat-centered-page');

    const adaptiveFrames = [
      await screen.findByLabelText('桌子筛选'),
      await screen.findByLabelText('桌子统计'),
      await screen.findByLabelText('桌子列表'),
      await screen.findByLabelText('区域桌位平面图'),
      await screen.findByLabelText('学生视角座位图'),
    ];

    adaptiveFrames.forEach((frame) => {
      expect(frame.className).toContain('admin-seat-adaptive-frame');
    });

    const adminSeatMap = await screen.findByLabelText('学生视角座位图');
    expect(within(adminSeatMap).getByText('当前区域 2 个座位，点击座位可同步查看系统编号和启停状态。')).toBeTruthy();
    expect(within(adminSeatMap).getByText('T01')).toBeTruthy();
    expect(within(adminSeatMap).getByRole('button', { name: /1号.*启用/ })).toBeTruthy();
    expect(within(adminSeatMap).getByRole('button', { name: /2号.*停用/ })).toBeTruthy();

    fireEvent.click(within(adminSeatMap).getByRole('button', { name: /1号.*启用/ }));

    expect(await screen.findByText('T01 · 1号')).toBeTruthy();
    expect(await screen.findByText('系统座位号 A-101')).toBeTruthy();
  });

  it('normalizes nullable reservation rule fields on the admin rule page', async () => {
    storeAdminSession();

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          code: 'OK',
          message: 'ok',
          data: makeReservationRules({
            checkinLeadMinutes: null,
            reservationOpenHour: null,
            wifiOfflineReleaseMinutes: null,
            seatLockMinutes: null,
          }),
        }),
      }),
    );

    render(
      <MemoryRouter initialEntries={['/admin/reservation-rules']}>
        <App />
      </MemoryRouter>,
    );

    expect(await screen.findByRole('heading', { level: 3, name: '预约规则' })).toBeTruthy();
    expect(await screen.findByText('WiFi 离线释放')).toBeTruthy();
    expect(await screen.findByDisplayValue('18')).toBeTruthy();
    expect(await screen.findByDisplayValue('60')).toBeTruthy();
    expect(await screen.findByDisplayValue('15')).toBeTruthy();
  });

  it('lets administrators manually release expired seat locks from the dashboard', async () => {
    storeAdminSession();

    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url.startsWith('/api/admin/dashboard')) {
        return {
          ok: true,
          json: async () => ({
            success: true,
            code: 'OK',
            message: 'ok',
            data: {
              date: '2026-05-18',
              summary: {
                totalSlots: 10,
                availableSlots: 4,
                reservedSlots: 3,
                usingSlots: 2,
                abnormalSlots: 1,
                activeReservations: 5,
                checkedInReservations: 2,
              },
              areaUsage: [
                {
                  areaId: 1,
                  areaName: 'A/B 连廊学习区',
                  totalSlots: 10,
                  reservedSlots: 3,
                  usingSlots: 2,
                  abnormalSlots: 1,
                  usageRate: 0.5,
                },
              ],
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
            data: makeReservationRules({ seatLockMinutes: 60 }),
          }),
        };
      }
      if (url.startsWith('/api/admin/reservations/release-expired-seat-locks')) {
        expect(init?.method).toBe('POST');
        return {
          ok: true,
          json: async () => ({ success: true, code: 'OK', message: 'ok', data: 2 }),
        };
      }
      return {
        ok: true,
        json: async () => ({ success: true, code: 'OK', message: 'ok', data: [] }),
      };
    });
    vi.stubGlobal('fetch', fetchMock);

    render(
      <MemoryRouter initialEntries={['/admin/dashboard']}>
        <App />
      </MemoryRouter>,
    );

    expect(await screen.findByRole('heading', { level: 3, name: '管理员运营工作台' })).toBeTruthy();
    expect(await screen.findByLabelText('运行概览')).toBeTruthy();
    expect(await screen.findByLabelText('异常处理')).toBeTruthy();
    expect(await screen.findByText('锁位运维')).toBeTruthy();
    expect(await screen.findByText('区域利用率')).toBeTruthy();
    expect(await screen.findByText('运营指挥')).toBeTruthy();
    expect(await screen.findByText('处理建议')).toBeTruthy();
    expect(await screen.findByText('状态流')).toBeTruthy();
    expect(await screen.findByText('高利用区域')).toBeTruthy();
    expect((await screen.findAllByText('A-B教学楼连廊学习区')).length).toBeGreaterThanOrEqual(1);
    fireEvent.click(await screen.findByRole('button', { name: '释放过期锁位' }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/admin/reservations/release-expired-seat-locks?limit=100',
        expect.objectContaining({ method: 'POST' }),
      );
    });
    expect(await screen.findByText('已释放 2 个过期锁位')).toBeTruthy();
  });

  it('tests admin area check-in IP ranges against the current request IP', async () => {
    storeAdminSession();

    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url.startsWith('/api/areas') && url !== '/api/areas/checkin-ip-test') {
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
                checkinIpCidrs: '10.10.0.0/16',
              },
            ],
          }),
        };
      }

      if (url === '/api/areas/checkin-ip-test') {
        expect(init?.method).toBe('POST');
        expect(JSON.parse(String(init?.body))).toEqual({ checkinIpCidrs: '10.10.0.0/16' });
        return {
          ok: true,
          json: async () => ({
            success: true,
            code: 'OK',
            message: 'ok',
            data: {
              clientIp: '10.10.1.20',
              remoteAddr: '127.0.0.1',
              forwardedFor: '10.10.1.20',
              trustedProxy: true,
              matched: true,
              checkinIpCidrs: '10.10.0.0/16',
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
      <MemoryRouter initialEntries={['/admin/areas']}>
        <App />
      </MemoryRouter>,
    );

    expect(await screen.findByRole('heading', { level: 3, name: '区域管理' })).toBeTruthy();
    fireEvent.click(await screen.findByRole('button', { name: '新增区域' }));
    fireEvent.change(await screen.findByLabelText('签到校园网 IP 网段'), {
      target: { value: '10.10.0.0/16' },
    });
    fireEvent.click(await screen.findByRole('button', { name: '测试当前 IP' }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/areas/checkin-ip-test',
        expect.objectContaining({ method: 'POST' }),
      );
    });
    expect(await screen.findByText(/当前 IP 10\.10\.1\.20 命中该网段/)).toBeTruthy();
  });

  it('shows teaching building connector names in admin area management', async () => {
    storeAdminSession();

    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
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
                name: 'A/B 连廊学习区',
                floor: '2F',
                buildingCode: 'CONNECTOR',
                floorCode: '2F',
                areaType: 'CONNECTOR',
                mapX: 30,
                mapY: 30,
                description: 'A/B connector public study seats',
                status: 'ACTIVE',
                openTime: '08:00:00',
                closeTime: '22:00:00',
                checkinIpCidrs: '127.0.0.1/32,::1/128',
              },
              {
                id: 2,
                name: 'B/C 连廊学习区',
                floor: '2F',
                buildingCode: 'CONNECTOR_CD',
                floorCode: '2F',
                areaType: 'CONNECTOR',
                mapX: 70,
                mapY: 30,
                description: 'B/C connector public study seats',
                status: 'ACTIVE',
                openTime: '08:00:00',
                closeTime: '22:00:00',
                checkinIpCidrs: '127.0.0.1/32,::1/128',
              },
            ],
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
      <MemoryRouter initialEntries={['/admin/areas']}>
        <App />
      </MemoryRouter>,
    );

    expect(await screen.findByRole('heading', { level: 3, name: '区域管理' })).toBeTruthy();
    expect(await screen.findByText('A-B教学楼连廊学习区')).toBeTruthy();
    expect(await screen.findByText('B-C教学楼连廊学习区')).toBeTruthy();
    expect(screen.queryByText('A/B 连廊学习区')).toBeNull();
    expect(screen.queryByText('B/C 连廊学习区')).toBeNull();
  });

  it('submits admin area map metadata when creating an area', async () => {
    storeAdminSession();

    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url === '/api/areas' && init?.method === 'POST') {
        expect(JSON.parse(String(init.body))).toEqual({
          name: '三楼连廊学习区',
          floor: '3F',
          description: 'A/B 连廊公共座位',
          openTime: '08:00:00',
          closeTime: '22:00:00',
          checkinIpCidrs: '127.0.0.1/32,::1/128',
          buildingCode: 'CONNECTOR',
          floorCode: '3F',
          areaType: 'CONNECTOR',
          mapX: 50,
          mapY: 20,
        });
        return {
          ok: true,
          json: async () => ({
            success: true,
            code: 'OK',
            message: 'ok',
            data: {
              id: 2,
              name: '三楼连廊学习区',
              floor: '3F',
              buildingCode: 'CONNECTOR',
              floorCode: '3F',
              areaType: 'CONNECTOR',
              mapX: 50,
              mapY: 20,
              description: 'A/B 连廊公共座位',
              status: 'ACTIVE',
              openTime: '08:00:00',
              closeTime: '22:00:00',
              checkinIpCidrs: '127.0.0.1/32,::1/128',
            },
          }),
        };
      }

      if (url.startsWith('/api/areas')) {
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
      <MemoryRouter initialEntries={['/admin/areas']}>
        <App />
      </MemoryRouter>,
    );

    expect(await screen.findByRole('heading', { level: 3, name: '区域管理' })).toBeTruthy();
    fireEvent.click(await screen.findByRole('button', { name: '新增区域' }));
    fireEvent.change(await screen.findByLabelText('区域名称'), { target: { value: '三楼连廊学习区' } });
    fireEvent.change(await screen.findByLabelText('楼层'), { target: { value: '3F' } });
    fireEvent.change(await screen.findByLabelText('说明'), { target: { value: 'A/B 连廊公共座位' } });
    await selectComboboxValue('楼栋分区', 'A-B教学楼连廊');
    fireEvent.change(await screen.findByLabelText('地图楼层'), { target: { value: '3F' } });
    await selectComboboxValue('区域类型', '连廊');
    fireEvent.change(await screen.findByLabelText('地图 X %'), { target: { value: '50' } });
    fireEvent.change(await screen.findByLabelText('地图 Y %'), { target: { value: '20' } });
    fireEvent.click(await screen.findByRole('button', { name: /保\s*存/ }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/areas',
        expect.objectContaining({ method: 'POST' }),
      );
    });
  });

  it('shows a fixed seat QR code in admin seat management', async () => {
    storeAdminSession();

    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
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
                checkinIpCidrs: '127.0.0.1/32,::1/128',
              },
            ],
          }),
        };
      }
      if (url.startsWith('/api/tables?')) {
        return {
          ok: true,
          json: async () => ({
            success: true,
            code: 'OK',
            message: 'ok',
            data: [
              {
                id: 1,
                areaId: 1,
                tableNo: 'T01',
                name: 'A 区 T01',
                status: 'ACTIVE',
                rowNo: 1,
                columnNo: 1,
                displayOrder: 1,
                positionX: 120,
                positionY: 80,
                widthPx: 260,
                heightPx: 96,
                rotationDeg: 0,
              },
            ],
          }),
        };
      }
      if (url.startsWith('/api/seats?')) {
        return {
          ok: true,
          json: async () => ({
            success: true,
            code: 'OK',
            message: 'ok',
            data: [
              {
                id: 9,
                areaId: 1,
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
                seatNo: 'A-001',
                seatLabel: '1号',
                seatSide: 'NORTH',
                seatOrder: 1,
                rowNo: 1,
                columnNo: 1,
                displayOrder: 1,
                status: 'ACTIVE',
              },
            ],
          }),
        };
      }
      if (url === '/api/seats/9/checkin-qr') {
        return {
          ok: true,
          json: async () => ({
            success: true,
            code: 'OK',
            message: 'ok',
            data: {
              seatId: 9,
              tableId: 1,
              tableNo: 'T01',
              seatNo: 'A-001',
              seatLabel: '1号',
              qrToken: 'seat-token-1',
              checkinPath: '/student/seat-checkin?token=seat-token-1',
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
      <MemoryRouter initialEntries={['/admin/seats']}>
        <App />
      </MemoryRouter>,
    );

    expect(await screen.findByRole('heading', { level: 3, name: '座位管理' })).toBeTruthy();
    expect(await screen.findByText('A-001')).toBeTruthy();
    fireEvent.click(await screen.findByText('座位码'));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith('/api/seats/9/checkin-qr', expect.any(Object));
    });
    expect(await screen.findByText(withOrigin('/student/seat-checkin?token=seat-token-1'))).toBeTruthy();
  });

  it('saves dragged admin table layout changes without exposing coordinate inputs', async () => {
    storeAdminSession();

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
                checkinIpCidrs: '127.0.0.1/32,::1/128',
              },
            ],
          }),
        };
      }

      if (url.startsWith('/api/tables?')) {
        return {
          ok: true,
          json: async () => ({
            success: true,
            code: 'OK',
            message: 'ok',
            data: [
              {
                id: 1,
                areaId: 1,
                tableNo: 'T01',
                name: 'A 区 T01',
                status: 'ACTIVE',
                rowNo: 1,
                columnNo: 1,
                displayOrder: 1,
                positionX: 120,
                positionY: 80,
                widthPx: 260,
                heightPx: 96,
                rotationDeg: 0,
              },
            ],
          }),
        };
      }

      if (url.startsWith('/api/seats?')) {
        return {
          ok: true,
          json: async () => ({
            success: true,
            code: 'OK',
            message: 'ok',
            data: [
              {
                id: 1,
                areaId: 1,
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
                seatNo: 'A-001',
                seatLabel: '1号',
                seatSide: 'NORTH',
                seatOrder: 1,
                rowNo: 1,
                columnNo: 1,
                displayOrder: 1,
                status: 'ACTIVE',
              },
              {
                id: 2,
                areaId: 1,
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
                seatNo: 'A-002',
                seatLabel: '2号',
                seatSide: 'SOUTH',
                seatOrder: 2,
                rowNo: 1,
                columnNo: 2,
                displayOrder: 2,
                status: 'ACTIVE',
              },
            ],
          }),
        };
      }

      if (url === '/api/tables/1' && init?.method === 'PUT') {
        expect(JSON.parse(String(init.body))).toEqual({
          areaId: 1,
          tableNo: 'T01',
          name: 'A 区 T01',
          rowNo: 1,
          columnNo: 1,
          displayOrder: 1,
          positionX: 150,
          positionY: 110,
          widthPx: 260,
          heightPx: 96,
          rotationDeg: 0,
          status: 'ACTIVE',
        });
        return {
          ok: true,
          json: async () => ({
            success: true,
            code: 'OK',
            message: 'ok',
            data: {
              id: 1,
              areaId: 1,
              tableNo: 'T01',
              name: 'A 区 T01',
              status: 'ACTIVE',
              rowNo: 1,
              columnNo: 1,
              displayOrder: 1,
              positionX: 150,
              positionY: 110,
              widthPx: 260,
              heightPx: 96,
              rotationDeg: 0,
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
      <MemoryRouter initialEntries={['/admin/tables']}>
        <App />
      </MemoryRouter>,
    );

    expect(await screen.findByRole('heading', { level: 3, name: '桌子管理' })).toBeTruthy();
    expect(screen.queryByText('平面坐标')).toBeNull();
    expect(screen.queryByText('入口')).toBeNull();
    expect(screen.queryByText('采光窗')).toBeNull();
    expect(screen.queryByText('服务台')).toBeNull();
    expect((await screen.findAllByText('2人桌')).length).toBeGreaterThan(0);
    const tableButton = await screen.findByRole('button', { name: '编辑 T01' }) as HTMLElement;
    tableButton.setPointerCapture = vi.fn();
    tableButton.releasePointerCapture = vi.fn();

    fireEvent.pointerDown(tableButton, {
      button: 0,
      clientX: 100,
      clientY: 100,
      pointerId: 1,
    });
    fireEvent.pointerMove(tableButton, {
      clientX: 130,
      clientY: 130,
      pointerId: 1,
    });
    fireEvent.pointerUp(tableButton, {
      clientX: 130,
      clientY: 130,
      pointerId: 1,
    });

    expect(await screen.findByText('有 1 张桌子待保存')).toBeTruthy();
    fireEvent.click(await screen.findByRole('button', { name: /保存\s*布局/ }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/tables/1',
        expect.objectContaining({ method: 'PUT' }),
      );
    });
  });

  it('offers admin table presets and hides custom size fields by default', async () => {
    storeAdminSession();

    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL) => {
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
                checkinIpCidrs: '127.0.0.1/32,::1/128',
                },
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
      <MemoryRouter initialEntries={['/admin/tables']}>
        <App />
      </MemoryRouter>,
    );

    fireEvent.click(await screen.findByRole('button', { name: '新增桌子' }));

    expect(await screen.findByText('实时预览')).toBeTruthy();
    expect((await screen.findAllByText('4人桌')).length).toBeGreaterThanOrEqual(2);
    expect(screen.queryByLabelText('桌宽 px')).toBeNull();
    expect(screen.queryByLabelText('桌高 px')).toBeNull();

    fireEvent.click(screen.getByText('3人桌'));
    await waitFor(() => {
      expect(screen.getAllByText('3人桌').length).toBeGreaterThanOrEqual(2);
    });

    fireEvent.click(screen.getByText('自定义'));
    expect(await screen.findByLabelText('桌宽 px')).toBeTruthy();
    expect(await screen.findByLabelText('桌高 px')).toBeTruthy();
  });

  it('submits the selected table seat count when administrators create a table', async () => {
    storeAdminSession();

    let createPayload: unknown;
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
                checkinIpCidrs: '127.0.0.1/32,::1/128',
              },
            ],
          }),
        };
      }
      if (url === '/api/tables' && init?.method === 'POST') {
        createPayload = JSON.parse(String(init.body));
        return {
          ok: true,
          json: async () => ({
            success: true,
            code: 'OK',
            message: 'ok',
            data: {
              id: 10,
              areaId: 1,
              tableNo: 'T10',
              name: null,
              status: 'ACTIVE',
              rowNo: null,
              columnNo: null,
              displayOrder: 1,
              positionX: 80,
              positionY: 80,
              widthPx: 220,
              heightPx: 96,
              rotationDeg: 0,
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
      <MemoryRouter initialEntries={['/admin/tables']}>
        <App />
      </MemoryRouter>,
    );

    fireEvent.click(await screen.findByRole('button', { name: '新增桌子' }));
    fireEvent.change(await screen.findByLabelText('桌号'), { target: { value: 'T10' } });
    fireEvent.click(within(await screen.findByRole('dialog')).getByRole('button', { name: /保\s*存/ }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/tables',
        expect.objectContaining({ method: 'POST' }),
      );
    });
    expect(createPayload).toEqual(
      expect.objectContaining({
        areaId: 1,
        tableNo: 'T10',
        seatCount: 4,
        widthPx: 220,
        heightPx: 96,
      }),
    );
  });

  it('uses table preset seat count in the admin layout when seats are not configured yet', async () => {
    storeAdminSession();

    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL) => {
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
                checkinIpCidrs: '127.0.0.1/32,::1/128',
                },
              ],
            }),
          };
        }
        if (url.startsWith('/api/tables?')) {
          return {
            ok: true,
            json: async () => ({
              success: true,
              code: 'OK',
              message: 'ok',
              data: [
                {
                  id: 12,
                  areaId: 1,
                  tableNo: 'T09',
                  name: null,
                  status: 'ACTIVE',
                  rowNo: null,
                  columnNo: null,
                  displayOrder: 6,
                  positionX: 260,
                  positionY: 180,
                  widthPx: 180,
                  heightPx: 84,
                  rotationDeg: 0,
                },
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
      <MemoryRouter initialEntries={['/admin/tables']}>
        <App />
      </MemoryRouter>,
    );

    expect(await screen.findByRole('button', { name: '编辑 T09' })).toBeTruthy();
    expect((await screen.findAllByText('2人桌')).length).toBeGreaterThanOrEqual(2);
    expect(screen.queryByText('未配置座位')).toBeNull();
  });

  it('publishes admin seat slots with table batch selection and time templates', async () => {
    storeAdminSession();
    const todayText = toLocalDateText(new Date());
    const tomorrowText = toLocalDateText(new Date(Date.now() + 24 * 60 * 60 * 1000));
    const startText = nextFutureHalfHourText();
    const endText = addMinutesToTimeText(startText, 60);

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
                checkinIpCidrs: '127.0.0.1/32,::1/128',
              },
            ],
          }),
        };
      }

      if (url.startsWith('/api/seats?')) {
        return {
          ok: true,
          json: async () => ({
            success: true,
            code: 'OK',
            message: 'ok',
            data: [
              {
                id: 1,
                areaId: 1,
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
                seatNo: 'A-001',
                seatLabel: '1号',
                seatSide: 'NORTH',
                seatOrder: 1,
                rowNo: 1,
                columnNo: 1,
                displayOrder: 1,
                status: 'ACTIVE',
              },
              {
                id: 2,
                areaId: 1,
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
                seatNo: 'A-002',
                seatLabel: '2号',
                seatSide: 'SOUTH',
                seatOrder: 2,
                rowNo: 1,
                columnNo: 2,
                displayOrder: 2,
                status: 'ACTIVE',
              },
              {
                id: 3,
                areaId: 1,
                tableId: 2,
                tableNo: 'T02',
                tableRowNo: 1,
                tableColumnNo: 2,
                tableDisplayOrder: 2,
                tablePositionX: 420,
                tablePositionY: 80,
                tableWidthPx: 260,
                tableHeightPx: 96,
                tableRotationDeg: 0,
                seatNo: 'A-003',
                seatLabel: '3号',
                seatSide: 'NORTH',
                seatOrder: 1,
                rowNo: 1,
                columnNo: 1,
                displayOrder: 1,
                status: 'ACTIVE',
              },
            ],
          }),
        };
      }

      if (url === '/api/seat-slots/publish-batch' && init?.method === 'POST') {
        expect(JSON.parse(String(init.body))).toEqual({
          areaId: 1,
          slotDates: [todayText, tomorrowText],
          periods: [
            { startTime: `${startText}:00`, endTime: `${endText}:00` },
          ],
          seatIds: [1, 2],
        });
        return {
          ok: true,
          json: async () => ({
            success: true,
            code: 'OK',
            message: 'ok',
            data: { dateCount: 2, createdCount: 4, skippedCount: 0 },
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
      <MemoryRouter initialEntries={['/admin/seat-slots']}>
        <App />
      </MemoryRouter>,
    );

    expect(await screen.findByRole('heading', { level: 3, name: '开放时段' })).toBeTruthy();
    fireEvent.click(await screen.findByRole('button', { name: 'T01 0/2' }));
    fireEvent.click(await screen.findByRole('button', { name: /选择开放日期/ }));
    fireEvent.pointerDown(await screen.findByRole('button', { name: `${tomorrowText} 未选择` }));
    expect(await screen.findByText('预计发布 4 个座位时段')).toBeTruthy();
    fireEvent.click(await screen.findByRole('button', { name: /发布\s*时段/ }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/seat-slots/publish-batch',
        expect.objectContaining({ method: 'POST' }),
      );
    });
  });
});
