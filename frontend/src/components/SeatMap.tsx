import { Button, Empty, Spin, Tag, Tooltip } from 'antd';
import type { CSSProperties } from 'react';
import { seatSlotStatusColor, seatSlotStatusText } from '../constants/seatSlotStatus';
import type { SeatSlot } from '../types/seat';

type SeatMapProps = {
  slots: SeatSlot[];
  loading?: boolean;
  loadingSlotId?: number | null;
  onReserve: (slotId: number) => void;
};

type SeatSide = 'NORTH' | 'EAST' | 'SOUTH' | 'WEST' | 'SINGLE';

type TableGroup = {
  key: string;
  tableId: number | null;
  tableNo: string | null;
  rowNo: number | null;
  columnNo: number | null;
  displayOrder: number | null;
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
      seats: [],
    };

    tableGroup.seats = [...tableGroup.seats, slot].sort(bySeatPosition);
    tableGroups.set(tableKey, tableGroup);
    groups.set(timeRange, tableGroups);
  });

  return Array.from(groups.entries()).map(([timeRange, tableGroups]) => {
    const tables = Array.from(tableGroups.values()).sort(byTablePosition);
    return {
      timeRange,
      tables,
      totalSeats: tables.reduce((sum, table) => sum + table.seats.length, 0),
    };
  });
}

function getLayoutStyle(tables: TableGroup[]): CSSProperties {
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
  if (!table.rowNo || !table.columnNo) {
    return {};
  }
  return {
    gridRow: table.rowNo,
    gridColumn: table.columnNo,
  };
}

export default function SeatMap({ slots, loading = false, loadingSlotId, onReserve }: SeatMapProps) {
  const groups = groupSlots(slots);

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
        <Empty description="当前区域日期暂无开放座位" />
      </div>
    );
  }

  return (
    <div className="seat-map">
      {groups.map((group) => (
        <section className="seat-map-section" key={group.timeRange}>
          <div className="seat-map-section-header">
            <strong>{group.timeRange}</strong>
            <span>{group.totalSeats} 个开放座位</span>
          </div>
          <div className="seat-room-layout">
            <div className="seat-room-feature seat-room-door">入口</div>
            <div className="seat-room-feature seat-room-window">采光窗</div>
            <div className="seat-map-grid" style={getLayoutStyle(group.tables)}>
              {group.tables.map((table) => (
                <div
                  className="seat-table"
                  style={getTableStyle(table)}
                  key={table.key}
                  role="group"
                  aria-label={getTableLabel(table)}
                >
                  <div className="seat-table-surface">
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
                          const disabled = slot.status !== 'AVAILABLE';
                          const label = getSeatLabel(slot);
                          const tableLabel = getTableLabel(table);
                          const title = `${tableLabel} · ${label} · ${seatSlotStatusText[slot.status]}`;

                          return (
                            <Tooltip title={title} key={slot.id}>
                              <Button
                                className={`seat-map-cell seat-map-cell-${slot.status.toLowerCase()}`}
                                disabled={disabled}
                                loading={loadingSlotId === slot.id}
                                onClick={() => onReserve(slot.id)}
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
