import { apiPaths, withPath } from './endpoints';
import { del, get, post } from './http';
import type { PublishSeatSlotPeriod, PublishSeatSlotsResult, SeatSlot } from '../types/seat';

export type PublishSeatSlotsPayload = {
  areaId: number;
  slotDate: string;
  startTime?: string;
  endTime?: string;
  periods?: PublishSeatSlotPeriod[];
  seatIds: number[];
};

export function listSeatSlots(areaId: number, date: string) {
  return get<SeatSlot[]>(apiPaths.seatSlots, { areaId, date });
}

export function publishSeatSlots(payload: PublishSeatSlotsPayload) {
  return post<PublishSeatSlotsResult>(withPath(apiPaths.seatSlots, 'publish'), payload);
}

export function cancelSeatSlot(seatSlotId: number) {
  return del<SeatSlot>(withPath(apiPaths.seatSlots, seatSlotId));
}
