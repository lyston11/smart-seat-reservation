import type { ReservationResult } from '../types/reservation';

export const reservationStatusColor: Record<string, string> = {
  RESERVED: 'blue',
  CHECKED_IN: 'orange',
  CHECKED_OUT: 'green',
  CANCELLED: 'default',
  EXPIRED: 'red',
  ADMIN_RELEASED: 'purple',
};

export const reservationStatusText: Record<string, string> = {
  RESERVED: '待签到',
  CHECKED_IN: '使用中',
  CHECKED_OUT: '已签退',
  CANCELLED: '已取消',
  EXPIRED: '已过期',
  ADMIN_RELEASED: '管理员释放',
};

export function isActiveReservation(reservation: ReservationResult) {
  return reservation.status === 'RESERVED' || reservation.status === 'CHECKED_IN';
}

export function canCheckInReservation(reservation: ReservationResult) {
  return reservation.status === 'RESERVED';
}

export function canCheckOutReservation(reservation: ReservationResult) {
  return reservation.status === 'CHECKED_IN';
}

export function canCancelReservation(reservation: ReservationResult) {
  return reservation.status === 'RESERVED';
}

export function formatTime(value?: string | null) {
  return value ? value.slice(0, 5) : '-';
}

export function formatDate(value?: string | null) {
  return value ?? '-';
}

export function formatDateTime(value?: string | null) {
  if (!value) {
    return '-';
  }
  return value.replace('T', ' ').slice(0, 16);
}

export function formatReservationTime(reservation: ReservationResult) {
  if (!reservation.slotDate && !reservation.startTime && !reservation.endTime) {
    return '-';
  }
  return `${formatDate(reservation.slotDate)} ${formatTime(reservation.startTime)}-${formatTime(reservation.endTime)}`;
}

export function formatReservationLocation(reservation: ReservationResult) {
  const area = reservation.areaName ?? '未知区域';
  const floor = reservation.floor ? ` · ${reservation.floor}` : '';
  const table = reservation.tableNo ? ` · ${reservation.tableNo}` : '';
  const seat = reservation.seatNo ?? `座位 ${reservation.seatId}`;
  const label = reservation.seatLabel ? ` (${reservation.seatLabel})` : '';
  return `${area}${floor}${table} · ${seat}${label}`;
}
