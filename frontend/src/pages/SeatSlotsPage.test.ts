import { describe, expect, it } from 'vitest';
import { buildStudentTimeOptions } from '../utils/studentTimeOptions';
import type { Area, SeatSlot } from '../types/seat';

const activeArea: Area = {
  id: 1,
  name: 'Library Area A',
  floor: '1F',
  description: null,
  status: 'ACTIVE',
  openTime: '08:00:00',
  closeTime: '22:00:00',
  checkinIpCidrs: '127.0.0.1/32',
};

function makeSlot(overrides: Partial<SeatSlot> = {}): SeatSlot {
  return {
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
    slotDate: '2026-05-21',
    startTime: '18:00:00',
    endTime: '20:00:00',
    status: 'AVAILABLE',
    reservedBy: null,
    reservationId: null,
    ...overrides,
  };
}

describe('SeatSlotsPage time options', () => {
  it('uses published seat slot windows instead of the whole area opening range', () => {
    const options = buildStudentTimeOptions([makeSlot()], activeArea, '17:00', '17:00');

    expect(options.startOptions.map((option) => option.value)).toEqual(['18:00', '18:30', '19:00', '19:30']);
    expect(options.endOptions.map((option) => option.value)).toEqual(['18:30', '19:00', '19:30', '20:00']);
  });

  it('keeps published occupied windows visible when no seat is currently available', () => {
    const options = buildStudentTimeOptions([makeSlot({ status: 'RESERVED' })], activeArea, '18:00', '17:00');

    expect(options.startOptions.map((option) => option.value)).toEqual(['18:00', '18:30', '19:00', '19:30']);
    expect(options.endOptions.map((option) => option.value)).toEqual(['18:30', '19:00', '19:30', '20:00']);
  });

  it('merges continuous published windows for same-seat full-day reservations', () => {
    const options = buildStudentTimeOptions(
      [
        makeSlot({ id: 1, startTime: '08:00:00', endTime: '12:00:00' }),
        makeSlot({ id: 2, startTime: '12:00:00', endTime: '18:00:00' }),
        makeSlot({ id: 3, startTime: '18:00:00', endTime: '22:00:00' }),
      ],
      activeArea,
      '10:00',
      '08:00',
    );

    expect(options.endOptions.map((option) => option.value)).toContain('22:00');
    expect(options.endOptions.map((option) => option.value)).not.toEqual(['10:30', '11:00', '11:30', '12:00']);
  });
});
