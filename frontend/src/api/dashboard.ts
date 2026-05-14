import { request } from './http';
import type { DashboardData } from '../types/dashboard';

export function getDashboard(date?: string) {
  const params = date ? `?${new URLSearchParams({ date }).toString()}` : '';
  return request<DashboardData>(`/api/admin/dashboard${params}`);
}
