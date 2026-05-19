import { Button, Empty, Spin, Tag, Tooltip } from 'antd';
import type { CSSProperties } from 'react';
import { seatSlotStatusColor, seatSlotStatusText } from '../constants/seatSlotStatus';
import type { SeatSlot, SeatSlotStatus } from '../types/seat';

type SeatMapProps = {
  slots: SeatSlot[];
  loading?: boolean;
  loadingSlotId?: number | null;
  emptyDescription?: string;
  sectionTitle?: string;
  selectedSeatId?: number | null;
  selectableStatuses?: SeatSlotStatus[];
  onReserve: (slot: SeatSlot) => void;
};

type SeatSide = 'NORTH' | 'EAST' | 'SOUTH' | 'WEST' | 'SINGLE';

type TableGroup = {
  key: string;
  tableId: number | null;
  tableNo: string | null;
  rowNo: number | null;
  columnNo: number | null;
  displayOrder: number | null;
  positionX: number | null;
  positionY: number | null;
  widthPx: number | null;
  heightPx: number | null;
  rotationDeg: number | null;
  seats: SeatSlot[];
};

type TimeGroup = {
  timeRange: string;
  tables: TableGroup[];
  totalSeats: number;
};

const sideOrder: Record<SeatSide, number> = {
  NORTH: 1,
  WEST: 2,
  EAST: 3,
  SOUTH: 4,
  SINGLE: 5,
};

const sideClass: Record<SeatSide, string> = {
  NORTH: 'north',
  EAST: 'east',
  SOUTH: 'south',
  WEST: 'west',
  SINGLE: 'single',
};

const tableSeatSides: SeatSide[] = ['NORTH', 'WEST', 'EAST', 'SOUTH', 'SINGLE'];
const TABLE_SIDE_OFFSET = 86;
const TABLE_VERTICAL_OFFSET = 58;

function getTimeRange(slot: SeatSlot) {
  return `${slot.startTime.slice(0, 5)}-${slot.endTime.slice(0, 5)}`;
}

function getSeatSide(slot: SeatSlot): SeatSide {
  if (slot.seatSide === 'NORTH' || slot.seatSide === 'EAST' || slot.seatSide === 'SOUTH' || slot.seatSide === 'WEST') {
    return slot.seatSide;
  }
  return 'SINGLE';
}

function getTableKey(slot: SeatSlot) {
  if (slot.tableId) {
    return `table-${slot.tableId}`;
  }
  return `legacy-${slot.tableNo ?? slot.seatId}`;
}

function getTableLabel(table: TableGroup) {
  return table.tableNo ?? (table.tableId ? String(table.tableId) : '未分配桌位');
}

function getSeatLabel(slot: SeatSlot) {
  return slot.seatLabel ?? slot.seatNo ?? `座位 ${slot.seatId}`;
}

function byTimeTableAndSeat(left: SeatSlot, right: SeatSlot) {
  const timeCompare = `${left.startTime}-${left.endTime}`.localeCompare(`${right.startTime}-${right.endTime}`);
  if (timeCompare !== 0) {
    return timeCompare;
  }
  const tableDisplayCompare =
    (left.tableDisplayOrder ?? Number.MAX_SAFE_INTEGER) - (right.tableDisplayOrder ?? Number.MAX_SAFE_INTEGER);
  if (tableDisplayCompare !== 0) {
    return tableDisplayCompare;
  }
  const tableRowCompare =
    (left.tableRowNo ?? Number.MAX_SAFE_INTEGER) - (right.tableRowNo ?? Number.MAX_SAFE_INTEGER);
  if (tableRowCompare !== 0) {
    return tableRowCompare;
  }
  const tableColumnCompare =
    (left.tableColumnNo ?? Number.MAX_SAFE_INTEGER) - (right.tableColumnNo ?? Number.MAX_SAFE_INTEGER);
  if (tableColumnCompare !== 0) {
    return tableColumnCompare;
  }
  const tableCompare = getTableKey(left).localeCompare(getTableKey(right));
  if (tableCompare !== 0) {
    return tableCompare;
  }
  return bySeatPosition(left, right);
}

function bySeatPosition(left: SeatSlot, right: SeatSlot) {
  const sideCompare = sideOrder[getSeatSide(left)] - sideOrder[getSeatSide(right)];
  if (sideCompare !== 0) {
    return sideCompare;
  }
  const orderCompare = (left.seatOrder ?? Number.MAX_SAFE_INTEGER) - (right.seatOrder ?? Number.MAX_SAFE_INTEGER);
  if (orderCompare !== 0) {
    return orderCompare;
  }
  return (left.seatNo ?? String(left.seatId)).localeCompare(right.seatNo ?? String(right.seatId));
}

function byTablePosition(left: TableGroup, right: TableGroup) {
  const yCompare = (left.positionY ?? Number.MAX_SAFE_INTEGER) - (right.positionY ?? Number.MAX_SAFE_INTEGER);
  if (yCompare !== 0) {
    return yCompare;
  }
  const xCompare = (left.positionX ?? Number.MAX_SAFE_INTEGER) - (right.positionX ?? Number.MAX_SAFE_INTEGER);
  if (xCompare !== 0) {
    return xCompare;
  }
  const displayCompare = (left.displayOrder ?? Number.MAX_SAFE_INTEGER) - (right.displayOrder ?? Number.MAX_SAFE_INTEGER);
  if (displayCompare !== 0) {
    return displayCompare;
  }
  const rowCompare = (left.rowNo ?? Number.MAX_SAFE_INTEGER) - (right.rowNo ?? Number.MAX_SAFE_INTEGER);
  if (rowCompare !== 0) {
    return rowCompare;
  }
  const columnCompare = (left.columnNo ?? Number.MAX_SAFE_INTEGER) - (right.columnNo ?? Number.MAX_SAFE_INTEGER);
  if (columnCompare !== 0) {
    return columnCompare;
  }
  return getTableLabel(left).localeCompare(getTableLabel(right));
}

function groupSlots(slots: SeatSlot[]): TimeGroup[] {
  const groups = new Map<string, Map<string, TableGroup>>();

  [...slots].sort(byTimeTableAndSeat).forEach((slot) => {
    const timeRange = getTimeRange(slot);
    const tableKey = getTableKey(slot);
    const tableGroups = groups.get(timeRange) ?? new Map<string, TableGroup>();
    const tableGroup = tableGroups.get(tableKey) ?? {
      key: tableKey,
      tableId: slot.tableId ?? null,
      tableNo: slot.tableNo,
      rowNo: slot.tableRowNo,
      columnNo: slot.tableColumnNo,
      displayOrder: slot.tableDisplayOrder,
      positionX: slot.tablePositionX,
      positionY: slot.tablePositionY,
      widthPx: slot.tableWidthPx,
      heightPx: slot.tableHeightPx,
      rotationDeg: slot.tableRotationDeg,
      seats: [],
    };

    tableGroup.seats = [...tableGroup.seats, slot].sort(bySeatPosition);
    tableGroups.set(tableKey, tableGroup);
    groups.set(timeRange, tableGroups);
  });

  return Array.from(groups.entries()).map(([timeRange, tableGroups]) => {
    const tables = normalizeCoordinateTables(Array.from(tableGroups.values()).sort(byTablePosition));
    return {
      timeRange,
      tables,
      totalSeats: tables.reduce((sum, table) => sum + table.seats.length, 0),
    };
  });
}

function hasCoordinateLayout(tables: TableGroup[]) {
  return tables.some((table) => table.positionX !== null && table.positionY !== null);
}

function isLegacyCoordinateFallback(table: TableGroup) {
  return table.tableNo === 'LEGACY' && table.rowNo === null && table.columnNo === null;
}

function normalizeCoordinateTables(tables: TableGroup[]) {
  if (!hasCoordinateLayout(tables)) {
    return tables;
  }

  const occupied = new Set<string>();
  let fallbackIndex = 0;

  return tables.map((table) => {
    const width = table.widthPx ?? 220;
    const height = table.heightPx ?? 96;
    let positionX = table.positionX;
    let positionY = table.positionY;

    if (positionX === null || positionY === null || isLegacyCoordinateFallback(table)) {
      positionX = 80 + (fallbackIndex % 3) * 320;
      positionY = 260 + Math.floor(fallbackIndex / 3) * 220;
      fallbackIndex += 1;
    }

    let key = `${positionX}:${positionY}`;
    while (occupied.has(key)) {
      positionY += height + 170;
      key = `${positionX}:${positionY}`;
    }
    occupied.add(key);

    return {
      ...table,
      positionX,
      positionY,
      widthPx: width,
      heightPx: height,
    };
  });
}

function getCoordinateRoomStyle(tables: TableGroup[]): CSSProperties {
  const positionedTables = tables.filter((table) => table.positionX !== null && table.positionY !== null);
  if (positionedTables.length === 0) {
    return {};
  }
  const maxRight = Math.max(
    ...positionedTables.map((table) => (table.positionX ?? 0) + (table.widthPx ?? 220) + TABLE_SIDE_OFFSET + 96),
  );
  const maxBottom = Math.max(
    ...positionedTables.map((table) => (table.positionY ?? 0) + (table.heightPx ?? 96) + TABLE_VERTICAL_OFFSET + 132),
  );
  return {
    minWidth: Math.max(maxRight + 96, 640),
    minHeight: Math.max(maxBottom + 64, 360),
  };
}

function getLayoutStyle(tables: TableGroup[]): CSSProperties {
  if (hasCoordinateLayout(tables)) {
    return getCoordinateRoomStyle(tables);
  }
  const positionedItems = tables.filter((table) => table.rowNo && table.columnNo);
  if (positionedItems.length === 0) {
    return {};
  }
  const maxColumn = Math.max(...positionedItems.map((table) => table.columnNo ?? 1));
  return {
    '--table-grid-columns': maxColumn,
  } as CSSProperties;
}

function getTableStyle(table: TableGroup): CSSProperties {
  if (table.positionX !== null && table.positionY !== null) {
    return {
      '--table-width': `${table.widthPx ?? 220}px`,
      '--table-height': `${table.heightPx ?? 96}px`,
      left: Math.max(table.positionX - TABLE_SIDE_OFFSET, 0),
      top: Math.max(table.positionY - TABLE_VERTICAL_OFFSET, 0),
      transform: table.rotationDeg ? `rotate(${table.rotationDeg}deg)` : undefined,
    } as CSSProperties;
  }
  if (!table.rowNo || !table.columnNo) {
    return {};
  }
  return {
    gridRow: table.rowNo,
    gridColumn: table.columnNo,
  };
}

function getTableSurfaceStyle(table: TableGroup): CSSProperties {
  if (table.widthPx === null && table.heightPx === null) {
    return {};
  }
  return {
    width: table.widthPx ?? 220,
    height: table.heightPx ?? 96,
  };
}

export default function SeatMap({
  slots,
  loading = false,
  loadingSlotId,
  emptyDescription = '当前区域日期暂无开放座位',
  sectionTitle,
  selectedSeatId,
  selectableStatuses = ['AVAILABLE'],
  onReserve,
}: SeatMapProps) {
  const groups = groupSlots(slots);
  const selectableStatusSet = new Set(selectableStatuses);

  if (loading) {
    return (
      <div className="empty-panel">
        <Spin />
      </div>
    );
  }

  if (groups.length === 0) {
    return (
      <div className="empty-panel">
        <Empty description={emptyDescription} />
      </div>
    );
  }

  return (
    <div className="seat-map">
      {groups.map((group) => (
        <section className="seat-map-section" key={group.timeRange}>
          <div className="seat-map-section-header">
            <strong>{sectionTitle ?? group.timeRange}</strong>
            <span>{group.totalSeats} 个座位</span>
          </div>
          <div className={`seat-room-layout ${hasCoordinateLayout(group.tables) ? 'seat-room-layout-coordinate' : ''}`}>
            <div className="seat-room-feature seat-room-door">入口</div>
            <div className="seat-room-feature seat-room-window">采光窗</div>
            <div
              className={`seat-map-grid ${hasCoordinateLayout(group.tables) ? 'seat-map-grid-coordinate' : ''}`}
              style={getLayoutStyle(group.tables)}
            >
              {group.tables.map((table) => (
                <div
                  className={`seat-table ${table.positionX !== null && table.positionY !== null ? 'seat-table-positioned' : ''}`}
                  style={getTableStyle(table)}
                  key={table.key}
                  role="group"
                  aria-label={getTableLabel(table)}
                >
                  <div className="seat-table-surface" style={getTableSurfaceStyle(table)}>
                    <span>{getTableLabel(table)}</span>
                  </div>
                  {tableSeatSides.map((side) => {
                    const sideSeats = table.seats.filter((slot) => getSeatSide(slot) === side);
                    if (sideSeats.length === 0) {
                      return null;
                    }

                    return (
                      <div className={`seat-table-side seat-table-side-${sideClass[side]}`} key={side}>
                        {sideSeats.map((slot) => {
                          const disabled = !selectableStatusSet.has(slot.status);
                          const selected = selectedSeatId === slot.seatId;
                          const label = getSeatLabel(slot);
                          const tableLabel = getTableLabel(table);
                          const title = `${tableLabel} · ${label} · ${seatSlotStatusText[slot.status]}`;

                          return (
                            <Tooltip title={title} key={slot.id}>
                              <Button
                                aria-pressed={selected}
                                className={`seat-map-cell seat-map-cell-${slot.status.toLowerCase()} ${
                                  selected ? 'seat-map-cell-selected' : ''
                                }`}
                                disabled={disabled}
                                loading={loadingSlotId === slot.id}
                                onClick={() => onReserve(slot)}
                              >
                                <span>{label}</span>
                                <Tag color={seatSlotStatusColor[slot.status]}>{seatSlotStatusText[slot.status]}</Tag>
                              </Button>
                            </Tooltip>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
            <div className="seat-room-feature seat-room-desk">服务台</div>
          </div>
        </section>
      ))}
    </div>
  );
}
