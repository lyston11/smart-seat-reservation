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
    expect(screen.getByText('4 个座位')).toBeTruthy();
    const table = screen.getByLabelText('A桌');
    expect(within(table).getByText('A桌')).toBeTruthy();

    const seatButtons = within(table).getAllByRole('button');
    expect(seatButtons.map((button) => button.textContent)).toEqual([
      expect.stringContaining('1号'),
      expect.stringContaining('2号'),
      expect.stringContaining('3号'),
    ]);

    const availableSeat = within(table).getByRole('button', { name: /2号/ });
    const reservedSeat = within(table).getByRole('button', { name: /3号/ });

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
    expect((table as HTMLElement).style.left).toBe('54px');
    expect((table as HTMLElement).style.top).toBe('36px');
    expect((table as HTMLElement).style.getPropertyValue('--table-width')).toBe('156px');
    expect((table as HTMLElement).style.getPropertyValue('--table-height')).toBe('58px');
    expect(within(table).getByText('1号')).toBeTruthy();
    expect(within(table).getByText('2号')).toBeTruthy();
    expect(within(table).getByText('3号')).toBeTruthy();
    expect(within(table).getByText('4号')).toBeTruthy();
  });

  it('shows zoom controls for coordinate layouts and scales the room canvas', () => {
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
            seatSide: 'NORTH',
          }),
          makeSlot({
            id: 2,
            seatId: 2,
            tableId: 2,
            tableNo: 'T02',
            tablePositionX: 520,
            tablePositionY: 80,
            tableWidthPx: 96,
            tableHeightPx: 260,
            seatSide: 'WEST',
          }),
        ]}
        onReserve={vi.fn()}
      />,
    );

    expect(screen.getByLabelText('座位图缩放控制')).toBeTruthy();
    expect(screen.getByText('100%')).toBeTruthy();

    const content = screen.getByTestId('seat-map-coordinate-content');
    expect(content.style.transform).toBe('scale(1)');

    fireEvent.click(screen.getByLabelText('放大座位图'));
    expect(screen.getByText('110%')).toBeTruthy();
    expect(content.style.transform).toBe('scale(1.1)');

    fireEvent.click(screen.getByLabelText('缩小座位图'));
    fireEvent.click(screen.getByLabelText('缩小座位图'));
    expect(screen.getByText('90%')).toBeTruthy();
    expect(content.style.transform).toBe('scale(0.9)');

    fireEvent.click(screen.getByLabelText('适配座位图'));
    expect(screen.getByText('100%')).toBeTruthy();
    expect(content.style.transform).toBe('scale(1)');
  });

  it('marks horizontal, vertical, and rotated coordinate tables for realistic placements', () => {
    render(
      <SeatMap
        slots={[
          makeSlot({
            id: 1,
            seatId: 1,
            tableNo: '横向桌',
            tablePositionX: 120,
            tablePositionY: 80,
            tableWidthPx: 280,
            tableHeightPx: 96,
            tableRotationDeg: 0,
            seatSide: 'NORTH',
          }),
          makeSlot({
            id: 2,
            seatId: 2,
            tableId: 2,
            tableNo: '侧向桌',
            tablePositionX: 500,
            tablePositionY: 120,
            tableWidthPx: 96,
            tableHeightPx: 260,
            tableRotationDeg: 90,
            seatSide: 'WEST',
          }),
        ]}
        onReserve={vi.fn()}
      />,
    );

    const horizontalTable = screen.getByLabelText('横向桌');
    const verticalTable = screen.getByLabelText('侧向桌');

    expect(horizontalTable.className).toContain('seat-table-horizontal');
    expect(verticalTable.className).toContain('seat-table-vertical');
    expect(verticalTable.className).toContain('seat-table-rotated');
    expect((verticalTable as HTMLElement).style.getPropertyValue('--table-rotation')).toBe('90deg');
  });

  it('labels seats from 1 within every table instead of using global seat labels', () => {
    render(
      <SeatMap
        slots={[
          makeSlot({
            id: 1,
            seatId: 41,
            tableId: 101,
            tableNo: 'T01',
            seatNo: 'A-041',
            seatLabel: '41号',
            seatSide: 'NORTH',
            seatOrder: 1,
          }),
          makeSlot({
            id: 2,
            seatId: 42,
            tableId: 101,
            tableNo: 'T01',
            seatNo: 'A-042',
            seatLabel: '42号',
            seatSide: 'SOUTH',
            seatOrder: 2,
          }),
          makeSlot({
            id: 3,
            seatId: 91,
            tableId: 202,
            tableNo: 'T02',
            tableDisplayOrder: 2,
            seatNo: 'B-091',
            seatLabel: '91号',
            seatSide: 'NORTH',
            seatOrder: 1,
          }),
        ]}
        onReserve={vi.fn()}
      />,
    );

    const firstTable = screen.getByLabelText('T01');
    const secondTable = screen.getByLabelText('T02');

    expect(within(firstTable).getByRole('button', { name: /1号/ })).toBeTruthy();
    expect(within(firstTable).getByRole('button', { name: /2号/ })).toBeTruthy();
    expect(within(firstTable).queryByRole('button', { name: /41号/ })).toBeNull();
    expect(within(secondTable).getByRole('button', { name: /1号/ })).toBeTruthy();
    expect(within(secondTable).queryByRole('button', { name: /91号/ })).toBeNull();
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

  it('renders unpublished real seats as disabled seats', () => {
    render(
      <SeatMap
        slots={[
          makeSlot({
            id: -41,
            seatId: 41,
            seatNo: 'A-041',
            seatLabel: '41号',
            status: 'UNPUBLISHED',
          }),
        ]}
        onReserve={vi.fn()}
      />,
    );

    const seat = screen.getByRole('button', { name: /1号/ });
    expect(seat).toHaveProperty('disabled', true);
    expect(screen.getByText('未开放')).toBeTruthy();
  });

  it('renders locked seats as an independent disabled status', () => {
    render(
      <SeatMap
        slots={[
          makeSlot({
            id: 51,
            seatId: 51,
            seatNo: 'A-051',
            seatLabel: '51号',
            status: 'LOCKED',
          }),
        ]}
        onReserve={vi.fn()}
      />,
    );

    const seat = screen.getByRole('button', { name: /1号/ });
    expect(seat).toHaveProperty('disabled', true);
    expect(screen.getByText('已锁位')).toBeTruthy();
  });
});
