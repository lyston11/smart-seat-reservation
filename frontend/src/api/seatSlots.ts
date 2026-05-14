import { request } from './http';
import type {
  AdminSeatSlotReleaseResult,
  CheckinPayload,
  ReservationResult,
} from '../types/reservation';
import type { PublishSeatSlotPeriod, PublishSeatSlotsResult, SeatSlot } from '../types/seat';

export type PublishSeatSlotsPayload = {
  areaId: number;
  slotDate: string;
  startTime?: string;
  endTime?: string;
  periods?: PublishSeatSlotPeriod[];
  seatIds: number[];
};

export function listSeatSlots(areaId: number, date: string) {
  const params = new URLSearchParams({ areaId: String(areaId), date });
  return request<SeatSlot[]>(`/api/seat-slots?${params.toString()}`);
}

export function publishSeatSlots(payload: PublishSeatSlotsPayload) {
  return request<PublishSeatSlotsResult>('/api/seat-slots/publish', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function cancelSeatSlot(seatSlotId: number) {
  return request<SeatSlot>(`/api/seat-slots/${seatSlotId}`, {
    method: 'DELETE',
  });
}

export function adminReleaseSeatSlot(seatSlotId: number, reason: string) {
  return request<AdminSeatSlotReleaseResult>(`/api/admin/seat-slots/${seatSlotId}/release`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  });
}

export function listUserReservations(limit = 50) {
  const params = new URLSearchParams({ limit: String(limit) });
  return request<ReservationResult[]>(`/api/reservations?${params.toString()}`);
}

export function createReservation(seatSlotId: number) {
  return request<ReservationResult>('/api/reservations', {
    method: 'POST',
    body: JSON.stringify({ seatSlotId }),
  });
}

export function checkInReservation(reservationId: number, payload: CheckinPayload) {
  return request<ReservationResult>(`/api/reservations/${reservationId}/check-in`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function checkOutReservation(reservationId: number) {
  return request<ReservationResult>(`/api/reservations/${reservationId}/check-out`, {
    method: 'POST',
    body: JSON.stringify({}),
  });
}

export function cancelReservation(reservationId: number) {
  return request<ReservationResult>(`/api/reservations/${reservationId}/cancel`, {
    method: 'POST',
    body: JSON.stringify({}),
  });
}
