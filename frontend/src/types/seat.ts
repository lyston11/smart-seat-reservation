export type Area = {
  id: number;
  name: string;
  floor: string | null;
  description: string | null;
  status: AreaStatus;
};

export type AreaStatus = 'ACTIVE' | 'INACTIVE';

export type Seat = {
  id: number;
  areaId: number;
  seatNo: string;
  status: string;
};

export type SeatStatus = 'ACTIVE' | 'INACTIVE';

export type SeatSlotStatus = 'AVAILABLE' | 'RESERVED' | 'USING' | 'ABNORMAL';

export type SeatSlot = {
  id: number;
  seatId: number;
  areaId: number;
  slotDate: string;
  startTime: string;
  endTime: string;
  status: SeatSlotStatus;
  reservedBy: number | null;
};

export type PublishSeatSlotsResult = {
  createdCount: number;
  skippedCount: number;
  createdSlots: SeatSlot[];
};

export type PublishSeatSlotPeriod = {
  startTime: string;
  endTime: string;
};
