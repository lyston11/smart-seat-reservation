import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import AdminSeatSlotActions from './AdminSeatSlotActions';
import type { SeatSlot } from '../types/seat';

function makeSlot(overrides: Partial<SeatSlot>): SeatSlot {
  return {
    id: overrides.id ?? 1,
    seatId: overrides.seatId ?? 1,
    seatNo: overrides.seatNo ?? 'A-001',
    tableId: overrides.tableId ?? 1,
    tableNo: overrides.tableNo ?? 'T01',
    tableRowNo: overrides.tableRowNo ?? 1,
    tableColumnNo: overrides.tableColumnNo ?? 1,
    tableDisplayOrder: overrides.tableDisplayOrder ?? 1,
    tablePositionX: overrides.tablePositionX ?? null,
    tablePositionY: overrides.tablePositionY ?? null,
    tableWidthPx: overrides.tableWidthPx ?? null,
    tableHeightPx: overrides.tableHeightPx ?? null,
    tableRotationDeg: overrides.tableRotationDeg ?? null,
    seatLabel: overrides.seatLabel ?? '1',
    seatSide: overrides.seatSide ?? 'NORTH',
    seatOrder: overrides.seatOrder ?? 1,
    rowNo: overrides.rowNo ?? null,
    columnNo: overrides.columnNo ?? null,
    displayOrder: overrides.displayOrder ?? null,
    areaId: overrides.areaId ?? 1,
    slotDate: overrides.slotDate ?? '2026-05-21',
    startTime: overrides.startTime ?? '08:00:00',
    endTime: overrides.endTime ?? '12:00:00',
    status: overrides.status ?? 'LOCKED',
    reservedBy: overrides.reservedBy ?? 1,
    reservationId: overrides.reservationId ?? 100,
  };
}

afterEach(() => {
  cleanup();
});

describe('AdminSeatSlotActions', () => {
  it('allows administrators to release locked seat slots', () => {
    const onReasonAction = vi.fn();

    render(
      <AdminSeatSlotActions
        slot={makeSlot({ status: 'LOCKED' })}
        cancelling={false}
        actionLoading={false}
        onCancel={vi.fn()}
        onReasonAction={onReasonAction}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /释\s*放/ }));

    expect(onReasonAction).toHaveBeenCalledWith('release', 1);
  });
});
