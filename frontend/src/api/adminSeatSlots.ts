import { apiPaths, withPath } from './endpoints';
import { post } from './http';
import type { AdminSeatSlotReleaseResult, AdminSeatSlotStatusResult } from '../types/reservation';

export function adminReleaseSeatSlot(seatSlotId: number, reason: string) {
  return post<AdminSeatSlotReleaseResult>(withPath(apiPaths.admin.seatSlots, seatSlotId, 'release'), { reason });
}

export function adminMarkSeatSlotAbnormal(seatSlotId: number, reason: string) {
  return post<AdminSeatSlotStatusResult>(withPath(apiPaths.admin.seatSlots, seatSlotId, 'abnormal'), { reason });
}

export function adminRestoreSeatSlot(seatSlotId: number, reason: string) {
  return post<AdminSeatSlotStatusResult>(withPath(apiPaths.admin.seatSlots, seatSlotId, 'restore'), { reason });
}
