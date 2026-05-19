import type { ReservationRule } from '../types/reservation';

export type ReservationRuleValues = {
  checkinGraceMinutes: number;
  checkinLeadMinutes: number;
  maxAdvanceDays: number;
  reservationOpenHour: number;
  dailyActiveReservationLimit: number;
  wifiOfflineReleaseMinutes: number;
  seatLockMinutes: number;
};

export type NormalizedReservationRule = ReservationRuleValues &
  Pick<ReservationRule, 'updatedBy' | 'updatedAt'>;

export const DEFAULT_RESERVATION_RULES: ReservationRuleValues = {
  checkinGraceMinutes: 10,
  checkinLeadMinutes: 10,
  maxAdvanceDays: 7,
  reservationOpenHour: 18,
  dailyActiveReservationLimit: 3,
  wifiOfflineReleaseMinutes: 15,
  seatLockMinutes: 60,
};

export function normalizeReservationRules(rule: ReservationRule): NormalizedReservationRule {
  return {
    checkinGraceMinutes: rule.checkinGraceMinutes ?? DEFAULT_RESERVATION_RULES.checkinGraceMinutes,
    checkinLeadMinutes: rule.checkinLeadMinutes ?? DEFAULT_RESERVATION_RULES.checkinLeadMinutes,
    maxAdvanceDays: rule.maxAdvanceDays ?? DEFAULT_RESERVATION_RULES.maxAdvanceDays,
    reservationOpenHour: rule.reservationOpenHour ?? DEFAULT_RESERVATION_RULES.reservationOpenHour,
    dailyActiveReservationLimit: rule.dailyActiveReservationLimit ?? DEFAULT_RESERVATION_RULES.dailyActiveReservationLimit,
    wifiOfflineReleaseMinutes: rule.wifiOfflineReleaseMinutes ?? DEFAULT_RESERVATION_RULES.wifiOfflineReleaseMinutes,
    seatLockMinutes: rule.seatLockMinutes ?? DEFAULT_RESERVATION_RULES.seatLockMinutes,
    updatedBy: rule.updatedBy ?? null,
    updatedAt: rule.updatedAt ?? null,
  };
}
