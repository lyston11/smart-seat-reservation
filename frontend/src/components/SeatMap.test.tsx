import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import SeatMap from './SeatMap';
import type { SeatSlot } from '../types/seat';

function makeSlot(overrides: Partial<SeatSlot>): SeatSlot {
  return {
    id: overrides.id ?? 1,
    seatId: overrides.seatId ?? 1,
    seatNo: overrides.seatNo ?? 'S1',
    tableId: Object.hasOwn(overrides, 'tableId') ? (overrides.tableId as number) : 1,
    tableNo: Object.hasOwn(overrides, 'tableNo') ? (overrides.tableNo as string | null) : 'T1',
    tableRowNo: Object.hasOwn(overrides, 'tableRowNo') ? (overrides.tableRowNo as number | null) : 1,
    tableColumnNo: Object.hasOwn(overrides, 'tableColumnNo') ? (overrides.tableColumnNo as number | null) : 1,
    tableDisplayOrder: Object.hasOwn(overrides, 'tableDisplayOrder')
      ? (overrides.tableDisplayOrder as number | null)
      : 1,
    tablePositionX: overrides.tablePositionX ?? null,
    tablePositionY: overrides.tablePositionY ?? null,
    tableWidthPx: overrides.tableWidthPx ?? null,
    tableHeightPx: overrides.tableHeightPx ?? null,
    tableRotationDeg: overrides.tableRotationDeg ?? null,
    seatLabel: overrides.seatLabel ?? null,
    seatSide: overrides.seatSide ?? 'SINGLE',
    seatOrder: overrides.seatOrder ?? 1,
    rowNo: overrides.rowNo ?? null,
    columnNo: overrides.columnNo ?? null,
    displayOrder: overrides.displayOrder ?? null,
    areaId: overrides.areaId ?? 1,
    slotDate: overrides.slotDate ?? '2026-05-18',
    startTime: overrides.startTime ?? '09:00:00',
    endTime: overrides.endTime ?? '10:00:00',
    status: overrides.status ?? 'AVAILABLE',
    reservedBy: overrides.reservedBy ?? null,
    reservationId: overrides.reservationId ?? null,
  };
}

afterEach(() => {
  cleanup();
});

describe('SeatMap', () => {
  it('groups seats by time and table, orders concrete seats, and reserves only available seats', () => {
    const onReserve = vi.fn();
    const slots = [
      makeSlot({
        id: 12,
        seatId: 12,
        seatNo: 'A2',
        tableId: 101,
        tableNo: 'A桌',
        seatLabel: '东侧 1',
        seatSide: 'EAST',
        seatOrder: 1,
        status: 'RESERVED',
      }),
      makeSlot({
        id: 11,
        seatId: 11,
        seatNo: 'A1',
        tableId: 101,
        tableNo: 'A桌',
        seatLabel: '西侧 1',
        seatSide: 'WEST',
        seatOrder: 1,
        status: 'AVAILABLE',
      }),
      makeSlot({
        id: 13,
        seatId: 13,
        seatNo: 'A3',
        tableId: 101,
        tableNo: 'A桌',
        seatLabel: '北侧 1',
        seatSide: 'NORTH',
        seatOrder: 1,
        status: 'USING',
      }),
      makeSlot({
        id: 21,
        seatId: 21,
        seatNo: 'B1',
        tableId: 202,
        tableNo: 'B桌',
        tableColumnNo: 2,
        tableDisplayOrder: 2,
        seatLabel: '单座',
        seatSide: 'SINGLE',
        seatOrder: 1,
        status: 'AVAILABLE',
      }),
    ];

    render(<SeatMap slots={slots} onReserve={onReserve} />);

    expect(screen.getByText('09:00-10:00')).toBeTruthy();
    expect(screen.getByText('4 个开放座位')).toBeTruthy();
    const table = screen.getByLabelText('A桌');
    expect(within(table).getByText('A桌')).toBeTruthy();

    const seatButtons = within(table).getAllByRole('button');
    expect(seatButtons.map((button) => button.textContent)).toEqual([
      expect.stringContaining('北侧 1'),
      expect.stringContaining('西侧 1'),
      expect.stringContaining('东侧 1'),
    ]);

    const availableSeat = within(table).getByRole('button', { name: /西侧 1/ });
    const reservedSeat = within(table).getByRole('button', { name: /东侧 1/ });

    expect((availableSeat as HTMLButtonElement).disabled).toBe(false);
    expect((reservedSeat as HTMLButtonElement).disabled).toBe(true);

    fireEvent.click(availableSeat);
    fireEvent.click(reservedSeat);

    expect(onReserve).toHaveBeenCalledTimes(1);
    expect(onReserve).toHaveBeenCalledWith(expect.objectContaining({ id: 11, seatId: 11 }));
  });

  it('renders coordinate tables as long desks with two seats above and two below', () => {
    const onReserve = vi.fn();
    render(
      <SeatMap
        slots={[
          makeSlot({
            id: 1,
            seatId: 1,
            seatNo: 'A-001',
            tableNo: 'T01',
            tablePositionX: 120,
            tablePositionY: 80,
            tableWidthPx: 260,
            tableHeightPx: 96,
            seatLabel: '1号',
            seatSide: 'NORTH',
            seatOrder: 1,
          }),
          makeSlot({
            id: 2,
            seatId: 2,
            seatNo: 'A-002',
            tableNo: 'T01',
            tablePositionX: 120,
            tablePositionY: 80,
            tableWidthPx: 260,
            tableHeightPx: 96,
            seatLabel: '2号',
            seatSide: 'NORTH',
            seatOrder: 2,
          }),
          makeSlot({
            id: 3,
            seatId: 3,
            seatNo: 'A-003',
            tableNo: 'T01',
            tablePositionX: 120,
            tablePositionY: 80,
            tableWidthPx: 260,
            tableHeightPx: 96,
            seatLabel: '3号',
            seatSide: 'SOUTH',
            seatOrder: 1,
          }),
          makeSlot({
            id: 4,
            seatId: 4,
            seatNo: 'A-004',
            tableNo: 'T01',
            tablePositionX: 120,
            tablePositionY: 80,
            tableWidthPx: 260,
            tableHeightPx: 96,
            seatLabel: '4号',
            seatSide: 'SOUTH',
            seatOrder: 2,
          }),
        ]}
        onReserve={onReserve}
      />,
    );

    const table = screen.getByLabelText('T01');
    expect(table.className).toContain('seat-table-positioned');
    expect((table as HTMLElement).style.left).toBe('120px');
    expect((table as HTMLElement).style.top).toBe('80px');
    expect(within(table).getByText('1号')).toBeTruthy();
    expect(within(table).getByText('2号')).toBeTruthy();
    expect(within(table).getByText('3号')).toBeTruthy();
    expect(within(table).getByText('4号')).toBeTruthy();
  });

  it('marks coordinate rooms as horizontally scrollable for narrow screens', () => {
    render(
      <SeatMap
        slots={[
          makeSlot({
            id: 1,
            seatId: 1,
            tableNo: 'T01',
            tablePositionX: 120,
            tablePositionY: 80,
            tableWidthPx: 260,
            tableHeightPx: 96,
            seatLabel: '1号',
            seatSide: 'NORTH',
          }),
        ]}
        onReserve={vi.fn()}
      />,
    );

    const room = screen.getByTestId('seat-room-layout-09:00-10:00');
    expect(room.className).toContain('seat-room-layout-scrollable');
    expect(room.getAttribute('tabindex')).toBe('0');
  });

  it('renders a fallback table label for legacy seats without table data', () => {
    render(
      <SeatMap
        slots={[
          makeSlot({
            id: 31,
            seatId: 31,
            seatNo: 'L1',
            tableId: null as unknown as number,
            tableNo: null,
            tableRowNo: null,
            tableColumnNo: null,
            tableDisplayOrder: null,
            seatLabel: null,
            seatSide: null,
            seatOrder: null,
          }),
        ]}
        onReserve={vi.fn()}
      />,
    );

    expect(screen.getByText('未分配桌位')).toBeTruthy();
    expect(screen.getByRole('button', { name: /L1/ })).toBeTruthy();
  });
});
