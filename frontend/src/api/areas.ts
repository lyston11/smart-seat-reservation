import { request } from './http';
import type { Area, AreaStatus } from '../types/seat';

export function listAreas() {
  return request<Area[]>('/api/areas');
}

export type CreateAreaPayload = {
  name: string;
  floor?: string;
  description?: string;
  openTime?: string;
  closeTime?: string;
};

export type UpdateAreaPayload = {
  name: string;
  floor?: string;
  description?: string;
  status: AreaStatus;
  openTime?: string;
  closeTime?: string;
};

export function createArea(payload: CreateAreaPayload) {
  return request<Area>('/api/areas', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function updateArea(areaId: number, payload: UpdateAreaPayload) {
  return request<Area>(`/api/areas/${areaId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export function updateAreaStatus(areaId: number, status: AreaStatus) {
  return request<Area>(`/api/areas/${areaId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}
