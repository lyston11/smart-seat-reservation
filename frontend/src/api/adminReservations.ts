import { apiPaths, withPath } from './endpoints';
import { post } from './http';

export function expireOverdueReservations(limit = 100) {
  return post<number>(withPath(apiPaths.admin.reservations, 'expire-overdue'), null, { limit });
}

export function releaseWifiOfflineReservations(limit = 100) {
  return post<number>(withPath(apiPaths.admin.reservations, 'release-wifi-offline'), null, { limit });
}

export function releaseExpiredSeatLocks(limit = 100) {
  return post<number>(withPath(apiPaths.admin.reservations, 'release-expired-seat-locks'), null, { limit });
}
