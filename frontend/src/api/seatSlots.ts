import { request } from './http';
import type {
  AdminSeatSlotReleaseResult,
  AdminSeatSlotStatusResult,
  CheckinPayload,
  ReservationRule,
  ReservationResult,
  TableCheckinPayload,
  WifiPresencePayload,
  WifiPresenceResult,
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

export function adminMarkSeatSlotAbnormal(seatSlotId: number, reason: string) {
  return request<AdminSeatSlotStatusResult>(`/api/admin/seat-slots/${seatSlotId}/abnormal`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  });
}

export function adminRestoreSeatSlot(seatSlotId: number, reason: string) {
  return request<AdminSeatSlotStatusResult>(`/api/admin/seat-slots/${seatSlotId}/restore`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  });
}

export function listUserReservations(limit = 50) {
  const params = new URLSearchParams({ limit: String(limit) });
  return request<ReservationResult[]>(`/api/reservations?${params.toString()}`);
}

export function getReservationRules() {
  return request<ReservationRule>('/api/reservations/rules');
}

export function updateReservationRules(payload: Pick<
  ReservationRule,
  'checkinGraceMinutes' | 'checkinLeadMinutes' | 'maxAdvanceDays' | 'dailyActiveReservationLimit' | 'wifiOfflineReleaseMinutes'
>) {
  return request<ReservationRule>('/api/reservations/rules', {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export type CreateReservationPayload =
  | number
  | {
      seatSlotId?: number;
      seatId?: number;
      slotDate?: string;
      startTime?: string;
      endTime?: string;
    };

export function createReservation(payload: CreateReservationPayload) {
  const body = typeof payload === 'number' ? { seatSlotId: payload } : payload;
  return request<ReservationResult>('/api/reservations', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export function checkInReservation(reservationId: number, payload: CheckinPayload) {
  return request<ReservationResult>(`/api/reservations/${reservationId}/check-in`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function markReservationWifiPresence(reservationId: number, payload: WifiPresencePayload = {}) {
  return request<WifiPresenceResult>(`/api/reservations/${reservationId}/wifi-presence`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function tableCheckInReservation(payload: TableCheckinPayload) {
  return request<ReservationResult>('/api/reservations/table-check-in', {
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
