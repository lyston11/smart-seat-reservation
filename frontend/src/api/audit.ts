import { request } from './http';
import type { AuditLog } from '../types/audit';

export function listAuditLogs(limit = 50) {
  const params = new URLSearchParams({ limit: String(limit) });
  return request<AuditLog[]>(`/api/admin/audit-logs?${params.toString()}`);
}
