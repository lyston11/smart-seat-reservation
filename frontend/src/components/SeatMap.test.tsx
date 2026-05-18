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
    expect(onReserve).toHaveBeenCalledWith(11);
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
