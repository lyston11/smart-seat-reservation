export type ReservationResult = {
  reservationId: number;
  seatSlotId: number;
  seatId: number;
  userId: number;
  status: string;
  checkinCode: string;
  expiresAt: string;
};

export type AdminSeatSlotReleaseResult = {
  seatSlotId: number;
  reservationId: number;
  releasedBy: number;
  reason: string;
  seatSlotStatus: string;
  reservation: ReservationResult;
};

export type CheckinPayload = {
  checkinCode: string;
};
