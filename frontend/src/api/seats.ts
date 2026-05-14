import { request } from './http';
import type { Seat } from '../types/seat';

export function listSeats(areaId: number) {
  const params = new URLSearchParams({ areaId: String(areaId) });
  return request<Seat[]>(`/api/seats?${params.toString()}`);
}
