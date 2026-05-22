import { apiPaths, withPath } from './endpoints';
import { get, patch, post, put } from './http';
import type { Area, AreaBuildingCode, AreaMapType, AreaStatus } from '../types/seat';

export function listAreas() {
  return get<Area[]>(apiPaths.areas);
}

export type CreateAreaPayload = {
  name: string;
  floor?: string;
  buildingCode?: AreaBuildingCode;
  floorCode?: string;
  areaType?: AreaMapType;
  mapX?: number;
  mapY?: number;
  description?: string;
  openTime?: string;
  closeTime?: string;
  checkinIpCidrs?: string;
};

export type UpdateAreaPayload = {
  name: string;
  floor?: string;
  buildingCode?: AreaBuildingCode;
  floorCode?: string;
  areaType?: AreaMapType;
  mapX?: number;
  mapY?: number;
  description?: string;
  status: AreaStatus;
  openTime?: string;
  closeTime?: string;
  checkinIpCidrs?: string;
};

export type CheckinIpTestResult = {
  clientIp: string;
  remoteAddr: string;
  forwardedFor: string | null;
  trustedProxy: boolean;
  matched: boolean;
  checkinIpCidrs: string;
};

export function createArea(payload: CreateAreaPayload) {
  return post<Area>(apiPaths.areas, payload);
}

export function updateArea(areaId: number, payload: UpdateAreaPayload) {
  return put<Area>(withPath(apiPaths.areas, areaId), payload);
}

export function updateAreaStatus(areaId: number, status: AreaStatus) {
  return patch<Area>(withPath(apiPaths.areas, areaId, 'status'), { status });
}

export function testCheckinIp(checkinIpCidrs: string) {
  return post<CheckinIpTestResult>(withPath(apiPaths.areas, 'checkin-ip-test'), { checkinIpCidrs });
}
