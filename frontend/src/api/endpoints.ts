export const apiPaths = {
  auth: '/api/auth',
  health: '/api/health',
  areas: '/api/areas',
  seats: '/api/seats',
  seatSlots: '/api/seat-slots',
  tables: '/api/tables',
  reservations: '/api/reservations',
  admin: {
    auditLogs: '/api/admin/audit-logs',
    dashboard: '/api/admin/dashboard',
    reservations: '/api/admin/reservations',
    seatSlots: '/api/admin/seat-slots',
  },
} as const;

export function withPath(basePath: string, ...segments: Array<number | string>) {
  const suffix = segments.map((segment) => encodeURIComponent(String(segment))).join('/');
  return suffix ? `${basePath}/${suffix}` : basePath;
}
