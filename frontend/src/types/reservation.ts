export type ReservationResult = {
  reservationId: number;
  seatSlotId: number;
  seatId: number;
  userId: number;
  status: string;
  checkinCode: string;
  expiresAt: string;
};

export type CheckinPayload = {
  userId: number;
  checkinCode: string;
};
