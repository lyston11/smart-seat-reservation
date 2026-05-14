import { request } from './http';
import type { Area } from '../types/seat';

export function listAreas() {
  return request<Area[]>('/api/areas');
}
