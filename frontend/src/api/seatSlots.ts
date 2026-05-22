import { apiPaths, withPath } from './endpoints';
import { del, get, post } from './http';
import type {
  CancelSeatSlotsBatchResult,
  CancelSeatSlotsByDateResult,
  SeatSlotPublishPlan,
  PublishSeatSlotsBatchResult,
  PublishSeatSlotPeriod,
  PublishSeatSlotsResult,
  SeatSlot,
  StopSeatSlotPublishPlanResult,
} from '../types/seat';

export type PublishSeatSlotsPayload = {
  areaId: number;
  slotDate: string;
  startTime?: string;
  endTime?: string;
  periods?: PublishSeatSlotPeriod[];
  seatIds: number[];
};

export type PublishSeatSlotsBatchPayload = {
  areaId: number;
  slotDates: string[];
  startTime?: string;
  endTime?: string;
  periods?: PublishSeatSlotPeriod[];
  seatIds: number[];
};

export type CreateSeatSlotPublishPlanPayload = {
  areaId: number;
  startDate: string;
  endDate?: string | null;
  startTime?: string;
  endTime?: string;
  periods?: PublishSeatSlotPeriod[];
  seatIds: number[];
};

export type CancelSeatSlotsBatchPayload = {
  areaId: number;
  slotDates?: string[];
  startDate?: string;
  endDate?: string;
  blockAutoPublish?: boolean;
  reason?: string;
};

export type StopSeatSlotPublishPlanPayload = {
  stopFromDate: string;
  cancelGeneratedSlots: boolean;
};

export function listSeatSlots(areaId: number, date: string) {
  return get<SeatSlot[]>(apiPaths.seatSlots, { areaId, date });
}

export function publishSeatSlots(payload: PublishSeatSlotsPayload) {
  return post<PublishSeatSlotsResult>(withPath(apiPaths.seatSlots, 'publish'), payload);
}

export function publishSeatSlotsBatch(payload: PublishSeatSlotsBatchPayload) {
  return post<PublishSeatSlotsBatchResult>(withPath(apiPaths.seatSlots, 'publish-batch'), payload);
}

export function cancelSeatSlotsByDate(areaId: number, date: string) {
  return del<CancelSeatSlotsByDateResult>(apiPaths.seatSlots, { areaId, date });
}

export function cancelSeatSlotsBatch(payload: CancelSeatSlotsBatchPayload) {
  return post<CancelSeatSlotsBatchResult>(withPath(apiPaths.seatSlots, 'cancel-batch'), payload);
}

export function cancelSeatSlot(seatSlotId: number) {
  return del<SeatSlot>(withPath(apiPaths.seatSlots, seatSlotId));
}

export function listSeatSlotPublishPlans(areaId: number) {
  return get<SeatSlotPublishPlan[]>(withPath(apiPaths.seatSlots, 'publish-plans'), { areaId });
}

export function createSeatSlotPublishPlan(payload: CreateSeatSlotPublishPlanPayload) {
  return post<SeatSlotPublishPlan>(withPath(apiPaths.seatSlots, 'publish-plans'), payload);
}

export function stopSeatSlotPublishPlan(planId: number, payload: StopSeatSlotPublishPlanPayload) {
  return post<StopSeatSlotPublishPlanResult>(
    withPath(apiPaths.seatSlots, 'publish-plans', planId, 'stop'),
    payload,
  );
}
