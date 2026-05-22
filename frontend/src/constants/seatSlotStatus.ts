import type { SeatSlotStatus } from '../types/seat';

export const seatSlotStatusText: Record<SeatSlotStatus, string> = {
  AVAILABLE: '空闲',
  RESERVED: '已预约',
  USING: '使用中',
  LOCKED: '已锁位',
  ABNORMAL: '异常占用',
  UNPUBLISHED: '未开放',
};

export const seatSlotStatusColor: Record<SeatSlotStatus, string> = {
  AVAILABLE: 'green',
  RESERVED: 'blue',
  USING: 'orange',
  LOCKED: 'purple',
  ABNORMAL: 'red',
  UNPUBLISHED: 'default',
};
