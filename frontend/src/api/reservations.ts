import { apiPaths, withPath } from './endpoints';
import { get, post } from './http';
import type {
  CheckinPayload,
  ReservationResult,
  SeatCheckinPayload,
  TableCheckinPayload,
  WifiPresencePayload,
  WifiPresenceResult,
} from '../types/reservation';

export type CreateReservationPayload =
  | number
  | {
      seatSlotId?: number;
      seatId?: number;
      slotDate?: string;
      startTime?: string;
      endTime?: string;
    };

export function listUserReservations(limit = 50) {
  return get<ReservationResult[]>(apiPaths.reservations, { limit });
}

export function createReservation(payload: CreateReservationPayload) {
  const body = typeof payload === 'number' ? { seatSlotId: payload } : payload;
  return post<ReservationResult>(apiPaths.reservations, body);
}

export function checkInReservation(reservationId: number, payload: CheckinPayload) {
  return post<ReservationResult>(withPath(apiPaths.reservations, reservationId, 'check-in'), payload);
}

export function tableCheckInReservation(payload: TableCheckinPayload) {
  return post<ReservationResult>(withPath(apiPaths.reservations, 'table-check-in'), payload);
}

export function seatCheckInReservation(payload: SeatCheckinPayload) {
  return post<ReservationResult>(withPath(apiPaths.reservations, 'seat-check-in'), payload);
}

export function markReservationWifiPresence(reservationId: number, payload: WifiPresencePayload = {}) {
  return post<WifiPresenceResult>(withPath(apiPaths.reservations, reservationId, 'wifi-presence'), payload);
}

export function lockReservationSeat(reservationId: number) {
  return post<ReservationResult>(withPath(apiPaths.reservations, reservationId, 'seat-lock'), {});
}

export function reactivateSeatLock(reservationId: number, payload: CheckinPayload) {
  return post<ReservationResult>(withPath(apiPaths.reservations, reservationId, 'seat-lock', 'reactivate'), payload);
}

export function releaseSeatLock(reservationId: number) {
  return post<ReservationResult>(withPath(apiPaths.reservations, reservationId, 'seat-lock', 'release'), {});
}

export function checkOutReservation(reservationId: number) {
  return post<ReservationResult>(withPath(apiPaths.reservations, reservationId, 'check-out'), {});
}

export function cancelReservation(reservationId: number) {
  return post<ReservationResult>(withPath(apiPaths.reservations, reservationId, 'cancel'), {});
}
