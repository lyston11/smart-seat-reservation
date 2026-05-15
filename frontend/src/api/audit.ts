import { request } from './http';
import type { AuditLog, AuditLogQuery } from '../types/audit';

export function listAuditLogs(query: AuditLogQuery = {}) {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.set(key, String(value));
    }
  });
  if (!params.has('limit')) {
    params.set('limit', '50');
  }
  return request<AuditLog[]>(`/api/admin/audit-logs?${params.toString()}`);
}
