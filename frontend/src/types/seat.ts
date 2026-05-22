export type Area = {
  id: number;
  name: string;
  floor: string | null;
  description: string | null;
  status: AreaStatus;
  openTime: string;
  closeTime: string;
  checkinIpCidrs: string;
};

export type AreaStatus = 'ACTIVE' | 'INACTIVE';

export type Seat = {
  id: number;
  areaId: number;
  tableId: number;
  tableNo: string | null;
  tableRowNo: number | null;
  tableColumnNo: number | null;
  tableDisplayOrder: number | null;
  tablePositionX: number | null;
  tablePositionY: number | null;
  tableWidthPx: number | null;
  tableHeightPx: number | null;
  tableRotationDeg: number | null;
  seatNo: string;
  seatLabel: string | null;
  seatSide: string | null;
  seatOrder: number | null;
  rowNo: number | null;
  columnNo: number | null;
  displayOrder: number | null;
  status: string;
};

export type SeatStatus = 'ACTIVE' | 'INACTIVE';

export type StudyTableStatus = 'ACTIVE' | 'INACTIVE';

export type StudyTable = {
  id: number;
  areaId: number;
  tableNo: string;
  name: string | null;
  status: StudyTableStatus;
  rowNo: number | null;
  columnNo: number | null;
  displayOrder: number | null;
  positionX: number;
  positionY: number;
  widthPx: number;
  heightPx: number;
  rotationDeg: number;
};

export type StudyTableQr = {
  tableId: number;
  tableNo: string;
  qrToken: string;
  checkinPath: string;
};

export type SeatQr = {
  seatId: number;
  tableId: number | null;
  tableNo: string | null;
  seatNo: string;
  seatLabel: string | null;
  qrToken: string;
  checkinPath: string;
};

export type SeatSlotStatus = 'AVAILABLE' | 'RESERVED' | 'USING' | 'LOCKED' | 'ABNORMAL' | 'UNPUBLISHED';

export type SeatSlot = {
  id: number;
  seatId: number;
  seatNo: string | null;
  tableId: number;
  tableNo: string | null;
  tableRowNo: number | null;
  tableColumnNo: number | null;
  tableDisplayOrder: number | null;
  tablePositionX: number | null;
  tablePositionY: number | null;
  tableWidthPx: number | null;
  tableHeightPx: number | null;
  tableRotationDeg: number | null;
  seatLabel: string | null;
  seatSide: string | null;
  seatOrder: number | null;
  rowNo: number | null;
  columnNo: number | null;
  displayOrder: number | null;
  areaId: number;
  slotDate: string;
  startTime: string;
  endTime: string;
  status: SeatSlotStatus;
  reservedBy: number | null;
  reservationId: number | null;
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
