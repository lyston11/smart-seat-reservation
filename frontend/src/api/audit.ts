import { apiPaths } from './endpoints';
import { get } from './http';
import type { AuditLog, AuditLogQuery } from '../types/audit';

export function listAuditLogs(query: AuditLogQuery = {}) {
  return get<AuditLog[]>(apiPaths.admin.auditLogs, { limit: 50, ...query });
}
