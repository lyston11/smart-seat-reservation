import { request } from './http';
import type { CheckinPayload, ReservationResult } from '../types/reservation';
import type { SeatSlot } from '../types/seat';

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

export function checkInReservation(reservationId: number, payload: CheckinPayload) {
  return request<ReservationResult>(`/api/reservations/${reservationId}/check-in`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function checkOutReservation(reservationId: number, userId: number) {
  return request<ReservationResult>(`/api/reservations/${reservationId}/check-out`, {
    method: 'POST',
    body: JSON.stringify({ userId }),
  });
}

export function cancelReservation(reservationId: number, userId: number) {
  return request<ReservationResult>(`/api/reservations/${reservationId}/cancel`, {
    method: 'POST',
    body: JSON.stringify({ userId }),
  });
}
