import type { SeatSlotStatus } from '../types/seat';

export const seatSlotStatusText: Record<SeatSlotStatus, string> = {
  AVAILABLE: '空闲',
  RESERVED: '已预约',
  USING: '使用中',
  ABNORMAL: '异常占用',
  UNPUBLISHED: '未开放',
};

export const seatSlotStatusColor: Record<SeatSlotStatus, string> = {
  AVAILABLE: 'green',
  RESERVED: 'blue',
  USING: 'orange',
  ABNORMAL: 'red',
  UNPUBLISHED: 'default',
};
