export type ReservationResult = {
  reservationId: number;
  seatSlotId: number;
  seatId: number;
  userId: number;
  status: string;
  checkinCode: string;
  expiresAt: string;
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

export type ReservationRule = {
  checkinGraceMinutes: number;
  maxAdvanceDays: number;
  dailyActiveReservationLimit: number;
  updatedBy: number | null;
  updatedAt: string | null;
};
