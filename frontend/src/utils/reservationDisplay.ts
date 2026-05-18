import type { ReservationResult } from '../types/reservation';

export type ReservationStatusFilter = 'ALL' | 'RESERVED' | 'CHECKED_IN' | 'CHECKED_OUT' | 'CANCELLED' | 'EXPIRED';

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
  CHECKED_OUT: '已完成',
  CANCELLED: '已取消',
  EXPIRED: '已过期',
  ADMIN_RELEASED: '管理员释放',
};

export const reservationStatusFilterOptions: Array<{ label: string; value: ReservationStatusFilter }> = [
  { label: '全部状态', value: 'ALL' },
  { label: '待签到', value: 'RESERVED' },
  { label: '使用中', value: 'CHECKED_IN' },
  { label: '已完成', value: 'CHECKED_OUT' },
  { label: '已取消', value: 'CANCELLED' },
  { label: '已过期', value: 'EXPIRED' },
];

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

export function isTodayReservation(reservation: ReservationResult, now = new Date()) {
  return reservation.slotDate === toDateText(now);
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

export function getReservationStartAt(reservation: ReservationResult) {
  if (!reservation.slotDate || !reservation.startTime) {
    return null;
  }
  return new Date(`${reservation.slotDate}T${reservation.startTime}`);
}

export function getReservationEndAt(reservation: ReservationResult) {
  if (!reservation.slotDate || !reservation.endTime) {
    return null;
  }
  return new Date(`${reservation.slotDate}T${reservation.endTime}`);
}

export function toDateText(value: Date) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const date = String(value.getDate()).padStart(2, '0');
  return `${year}-${month}-${date}`;
}

export function getCheckinCountdown(reservation: ReservationResult, now = new Date()) {
  if (reservation.status !== 'RESERVED' || !reservation.expiresAt) {
    return null;
  }

  const expiresAt = new Date(reservation.expiresAt);
  const remainingMs = expiresAt.getTime() - now.getTime();
  if (Number.isNaN(remainingMs)) {
    return null;
  }

  if (remainingMs <= 0) {
    return {
      text: '已超过签到截止',
      urgent: true,
      expired: true,
      remainingMinutes: 0,
    };
  }

  const remainingMinutes = Math.ceil(remainingMs / 60000);
  return {
    text: `剩余 ${remainingMinutes} 分钟`,
    urgent: remainingMinutes <= 5,
    expired: false,
    remainingMinutes,
  };
}

export function compareReservationsByStartTime(left: ReservationResult, right: ReservationResult) {
  const leftStart = getReservationStartAt(left)?.getTime() ?? 0;
  const rightStart = getReservationStartAt(right)?.getTime() ?? 0;
  return leftStart - rightStart;
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

export function filterReservations(
  reservations: ReservationResult[],
  statusFilter: ReservationStatusFilter,
  dateFilter?: string | null,
) {
  return reservations.filter((reservation) => {
    const matchesStatus = statusFilter === 'ALL' || reservation.status === statusFilter;
    const matchesDate = !dateFilter || reservation.slotDate === dateFilter;
    return matchesStatus && matchesDate;
  });
}
