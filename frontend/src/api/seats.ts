import { apiPaths, withPath } from './endpoints';
import { get, patch, post, put } from './http';
import type { Seat, SeatStatus } from '../types/seat';

export function listSeats(areaId: number) {
  return get<Seat[]>(apiPaths.seats, { areaId });
}

export type CreateSeatPayload = {
  areaId: number;
  tableId: number;
  seatNo: string;
  seatLabel?: string;
  seatSide?: string;
  seatOrder?: number;
  rowNo?: number;
  columnNo?: number;
  displayOrder?: number;
};

export type UpdateSeatPayload = {
  areaId: number;
  tableId: number;
  seatNo: string;
  seatLabel?: string;
  seatSide?: string;
  seatOrder?: number;
  rowNo?: number;
  columnNo?: number;
  displayOrder?: number;
  status: SeatStatus;
};

export function createSeat(payload: CreateSeatPayload) {
  return post<Seat>(apiPaths.seats, payload);
}

export function updateSeat(seatId: number, payload: UpdateSeatPayload) {
  return put<Seat>(withPath(apiPaths.seats, seatId), payload);
}

export function updateSeatStatus(seatId: number, status: SeatStatus) {
  return patch<Seat>(withPath(apiPaths.seats, seatId, 'status'), { status });
}
