import { request } from './http';
import type { Seat, SeatStatus } from '../types/seat';

export function listSeats(areaId: number) {
  const params = new URLSearchParams({ areaId: String(areaId) });
  return request<Seat[]>(`/api/seats?${params.toString()}`);
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
  return request<Seat>('/api/seats', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function updateSeat(seatId: number, payload: UpdateSeatPayload) {
  return request<Seat>(`/api/seats/${seatId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export function updateSeatStatus(seatId: number, status: SeatStatus) {
  return request<Seat>(`/api/seats/${seatId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}
