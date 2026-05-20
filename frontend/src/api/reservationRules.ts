import { apiPaths, withPath } from './endpoints';
import { get, put } from './http';
import type { ReservationRule } from '../types/reservation';
import type { ReservationRuleValues } from '../utils/reservationRules';

const reservationRulesPath = withPath(apiPaths.reservations, 'rules');

export function getReservationRules() {
  return get<ReservationRule>(reservationRulesPath);
}

export function updateReservationRules(payload: ReservationRuleValues) {
  return put<ReservationRule>(reservationRulesPath, payload);
}
