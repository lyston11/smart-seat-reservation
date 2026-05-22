import { apiPaths } from './endpoints';
import { get, put } from './http';
import type { ReservationRule } from '../types/reservation';
import type { ReservationRuleValues } from '../utils/reservationRules';

export function getReservationRules() {
  return get<ReservationRule>(apiPaths.reservationRules);
}

export function updateReservationRules(payload: ReservationRuleValues) {
  return put<ReservationRule>(apiPaths.reservationRules, payload);
}
