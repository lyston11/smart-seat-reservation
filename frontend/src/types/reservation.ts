export type ReservationResult = {
  reservationId: number;
  seatSlotId: number;
  seatId: number;
  userId: number;
  status: string;
  checkinCode: string;
  expiresAt: string;
  checkedInAt?: string | null;
  checkedOutAt?: string | null;
  lastWifiSeenAt?: string | null;
  seatLockQuota?: number | null;
  seatLockUsedCount?: number | null;
  lockedUntilAt?: string | null;
  seatNo?: string | null;
  seatLabel?: string | null;
  tableId?: number | null;
  tableNo?: string | null;
  areaId?: number | null;
  areaName?: string | null;
  floor?: string | null;
  slotDate?: string | null;
  startTime?: string | null;
  endTime?: string | null;
};

export type AdminSeatSlotReleaseResult = {
  seatSlotId: number;
  reservationId: number;
  releasedBy: number;
  reason: string;
  seatSlotStatus: string;
  reservation: ReservationResult;
};

export type AdminSeatSlotStatusResult = {
  seatSlotId: number;
  changedBy: number;
  reason: string;
  seatSlotStatus: string;
};

export type CheckinPayload = {
  checkinCode: string;
};

export type TableCheckinPayload = {
  tableQrToken: string;
  checkinCode: string;
};

export type WifiPresencePayload = object;

export type WifiPresenceResult = {
  reservationId: number;
  status: string;
  lastWifiSeenAt: string | null;
  offlineReleaseMinutes: number;
};

export type ReservationRule = {
  checkinGraceMinutes: number;
  checkinLeadMinutes: number;
  maxAdvanceDays: number;
  reservationOpenHour: number;
  dailyActiveReservationLimit: number;
  wifiOfflineReleaseMinutes: number;
  seatLockMinutes: number;
  updatedBy: number | null;
  updatedAt: string | null;
};
