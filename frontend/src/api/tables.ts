import { request } from './http';
import type { StudyTable, StudyTableQr, StudyTableStatus } from '../types/seat';

export type CreateTablePayload = {
  areaId: number;
  tableNo: string;
  name?: string;
  rowNo?: number;
  columnNo?: number;
  displayOrder?: number;
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
  positionX?: number;
  positionY?: number;
  widthPx?: number;
  heightPx?: number;
  rotationDeg?: number;
};

export function listTables(areaId: number) {
  const params = new URLSearchParams({ areaId: String(areaId) });
  return request<StudyTable[]>(`/api/tables?${params.toString()}`);
}

export function createTable(payload: CreateTablePayload) {
  return request<StudyTable>('/api/tables', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function updateTable(tableId: number, payload: UpdateTablePayload) {
  return request<StudyTable>(`/api/tables/${tableId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export function updateTableStatus(tableId: number, status: StudyTableStatus) {
  return request<StudyTable>(`/api/tables/${tableId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}

export function getTableCheckinQr(tableId: number) {
  return request<StudyTableQr>(`/api/tables/${tableId}/checkin-qr`);
}
