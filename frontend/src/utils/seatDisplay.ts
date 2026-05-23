import type { SeatSlot } from '../types/seat';

export type SeatSide = 'NORTH' | 'EAST' | 'SOUTH' | 'WEST' | 'SINGLE';

type SeatDisplaySlot = Pick<SeatSlot, 'seatId' | 'seatNo' | 'seatLabel' | 'seatSide' | 'seatOrder'> & {
  tableId: number | null;
  tableNo: string | null;
};

const sideOrder: Record<SeatSide, number> = {
  NORTH: 1,
  WEST: 2,
  EAST: 3,
  SOUTH: 4,
  SINGLE: 5,
};

export function getSeatSide(slot: SeatDisplaySlot): SeatSide {
  if (slot.seatSide === 'NORTH' || slot.seatSide === 'EAST' || slot.seatSide === 'SOUTH' || slot.seatSide === 'WEST') {
    return slot.seatSide;
  }
  return 'SINGLE';
}

export function getTableKey(slot: SeatDisplaySlot) {
  if (slot.tableId) {
    return `table-${slot.tableId}`;
  }
  return `legacy-${slot.tableNo ?? slot.seatId}`;
}

export function getTableLabel(slot: Pick<SeatDisplaySlot, 'tableId' | 'tableNo'>) {
  return slot.tableNo ?? (slot.tableId ? String(slot.tableId) : '未分配桌位');
}

export function hasRealTable(slot: SeatDisplaySlot) {
  return Boolean(slot.tableId || slot.tableNo);
}

export function getFallbackSeatLabel(slot: SeatDisplaySlot) {
  return slot.seatLabel ?? slot.seatNo ?? `座位 ${slot.seatId}`;
}

export function compareSeatDisplayOrder(left: SeatDisplaySlot, right: SeatDisplaySlot) {
  const sideCompare = sideOrder[getSeatSide(left)] - sideOrder[getSeatSide(right)];
  if (sideCompare !== 0) {
    return sideCompare;
  }
  const orderCompare = (left.seatOrder ?? Number.MAX_SAFE_INTEGER) - (right.seatOrder ?? Number.MAX_SAFE_INTEGER);
  if (orderCompare !== 0) {
    return orderCompare;
  }
  return (left.seatNo ?? String(left.seatId)).localeCompare(right.seatNo ?? String(right.seatId));
}

export function getSeatDisplayLabel(slot: SeatDisplaySlot, tableSeats: SeatDisplaySlot[]) {
  if (!hasRealTable(slot)) {
    return getFallbackSeatLabel(slot);
  }

  const seatIndex = tableSeats
    .slice()
    .sort(compareSeatDisplayOrder)
    .findIndex((tableSeat) => tableSeat.seatId === slot.seatId);
  if (seatIndex < 0) {
    return getFallbackSeatLabel(slot);
  }
  return `${seatIndex + 1}号`;
}

export function getSeatDisplayLabelInSlots(slot: SeatDisplaySlot, slots: SeatDisplaySlot[]) {
  return getSeatDisplayLabel(
    slot,
    slots.filter((nextSlot) => getTableKey(nextSlot) === getTableKey(slot)),
  );
}

export function getSeatPathText(slot: SeatDisplaySlot, slots: SeatDisplaySlot[]) {
  return `${getTableLabel(slot)} · ${getSeatDisplayLabelInSlots(slot, slots)}`;
}
