import { apiPaths, withPath } from './endpoints';
import { get, patch, post, put } from './http';
import type { StudyTable, StudyTableQr, StudyTableStatus } from '../types/seat';

export type CreateTablePayload = {
  areaId: number;
  tableNo: string;
  name?: string;
  rowNo?: number;
  columnNo?: number;
  displayOrder?: number;
  seatCount?: number;
  positionX?: number;
  positionY?: number;
  widthPx?: number;
  heightPx?: number;
  rotationDeg?: number;
};

export type UpdateTablePayload = {
  areaId: number;
  tableNo: string;
  name?: string;
  status: StudyTableStatus;
  rowNo?: number;
  columnNo?: number;
  displayOrder?: number;
  seatCount?: number;
  positionX?: number;
  positionY?: number;
  widthPx?: number;
  heightPx?: number;
  rotationDeg?: number;
};

export function listTables(areaId: number) {
  return get<StudyTable[]>(apiPaths.tables, { areaId });
}

export function createTable(payload: CreateTablePayload) {
  return post<StudyTable>(apiPaths.tables, payload);
}

export function updateTable(tableId: number, payload: UpdateTablePayload) {
  return put<StudyTable>(withPath(apiPaths.tables, tableId), payload);
}

export function updateTableStatus(tableId: number, status: StudyTableStatus) {
  return patch<StudyTable>(withPath(apiPaths.tables, tableId, 'status'), { status });
}

export function getTableCheckinQr(tableId: number) {
  return get<StudyTableQr>(withPath(apiPaths.tables, tableId, 'checkin-qr'));
}
