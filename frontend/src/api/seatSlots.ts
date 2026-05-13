import { request } from './http';

export type SeatSlot = {
  id: number;
  seatId: number;
  areaId: number;
  slotDate: string;
  startTime: string;
  endTime: string;
  status: 'AVAILABLE' | 'RESERVED' | 'USING' | 'RELEASED' | 'CANCELLED' | 'EXPIRED' | 'ABNORMAL';
  reservedBy: number | null;
};

export type ReservationResult = {
  reservationId: number;
  seatSlotId: number;
  seatId: number;
  userId: number;
  status: string;
  checkinCode: string;
  expiresAt: string;
};

export function listSeatSlots(areaId: number, date: string) {
  const params = new URLSearchParams({ areaId: String(areaId), date });
  return request<SeatSlot[]>(`/api/seat-slots?${params.toString()}`);
}

export function createReservation(seatSlotId: number, userId: number) {
  return request<ReservationResult>('/api/reservations', {
    method: 'POST',
    body: JSON.stringify({ seatSlotId, userId }),
  });
}
