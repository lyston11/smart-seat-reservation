import { apiPaths } from './endpoints';
import { get } from './http';
import type { DashboardData } from '../types/dashboard';

export function getDashboard(date?: string) {
  return get<DashboardData>(apiPaths.admin.dashboard, { date });
}
