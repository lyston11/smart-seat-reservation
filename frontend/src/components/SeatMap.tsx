import { Button, Empty, Spin, Tag, Tooltip } from 'antd';
import { Maximize2, Minus, Plus } from 'lucide-react';
import { useState, type CSSProperties } from 'react';
import { seatSlotStatusColor, seatSlotStatusText } from '../constants/seatSlotStatus';
import type { SeatSlot, SeatSlotStatus } from '../types/seat';
import {
  compareSeatDisplayOrder,
  getSeatDisplayLabel,
  getSeatSide,
  getTableKey,
  getTableLabel,
  type SeatSide,
} from '../utils/seatDisplay';

type SeatMapProps = {
  slots: SeatSlot[];
  loading?: boolean;
  loadingSlotId?: number | null;
  emptyDescription?: string;
  sectionTitle?: string;
  selectedSeatId?: number | null;
  selectableStatuses?: SeatSlotStatus[];
  statusTextOverrides?: Partial<Record<SeatSlotStatus, string>>;
  onReserve?: (slot: SeatSlot) => void;
  onSeatClick?: (slot: SeatSlot) => void;
};

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

type LayoutRect = {
  left: number;
  top: number;
  width: number;
  height: number;
};

const sideClass: Record<SeatSide, string> = {
  NORTH: 'north',
  EAST: 'east',
  SOUTH: 'south',
  WEST: 'west',
  SINGLE: 'single',
};

const tableSeatSides: SeatSide[] = ['NORTH', 'WEST', 'EAST', 'SOUTH', 'SINGLE'];
const TABLE_DISPLAY_SCALE = 0.5;
const TABLE_POSITION_SCALE = 0.62;
const TABLE_SIDE_OFFSET = 44;
const TABLE_VERTICAL_OFFSET = 30;
const TABLE_COLLISION_GAP = 14;
const MIN_ZOOM = 0.7;
const MAX_ZOOM = 1.4;
const ZOOM_STEP = 0.1;
const DEFAULT_ZOOM = 0.9;

function getTimeRange(slot: SeatSlot) {
  return `${slot.startTime.slice(0, 5)}-${slot.endTime.slice(0, 5)}`;
}

function getTableGroupLabel(table: TableGroup) {
  return table.tableNo ?? (table.tableId ? String(table.tableId) : '未分配桌位');
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
  return compareSeatDisplayOrder(left, right);
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
  return getTableGroupLabel(left).localeCompare(getTableGroupLabel(right));
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

  const occupiedRects: LayoutRect[] = [];
  let fallbackIndex = 0;

  return tables.map((table) => {
    const width = Math.round((table.widthPx ?? 220) * TABLE_DISPLAY_SCALE);
    const height = Math.round((table.heightPx ?? 96) * TABLE_DISPLAY_SCALE);
    let positionX = table.positionX;
    let positionY = table.positionY;

    if (positionX === null || positionY === null || isLegacyCoordinateFallback(table)) {
      positionX = 64 + (fallbackIndex % 3) * 220;
      positionY = 184 + Math.floor(fallbackIndex / 3) * 154;
      fallbackIndex += 1;
    } else {
      positionX = Math.round(positionX * TABLE_POSITION_SCALE);
      positionY = Math.round(positionY * TABLE_POSITION_SCALE);
    }

    let normalizedTable = {
      ...table,
      positionX,
      positionY,
      widthPx: width,
      heightPx: height,
    };
    let collisionRect = getTableCollisionRect(normalizedTable);
    let guard = 0;
    while (occupiedRects.some((rect) => rectsOverlap(collisionRect, rect, TABLE_COLLISION_GAP)) && guard < 100) {
      normalizedTable = {
        ...normalizedTable,
        positionY: (normalizedTable.positionY ?? 0) + collisionRect.height + TABLE_COLLISION_GAP,
      };
      collisionRect = getTableCollisionRect(normalizedTable);
      guard += 1;
    }
    occupiedRects.push(collisionRect);

    return normalizedTable;
  });
}

function rectsOverlap(left: LayoutRect, right: LayoutRect, gap = 0) {
  return (
    left.left < right.left + right.width + gap &&
    left.left + left.width + gap > right.left &&
    left.top < right.top + right.height + gap &&
    left.top + left.height + gap > right.top
  );
}

function getTableCollisionRect(table: TableGroup): LayoutRect {
  return {
    left: Math.max((table.positionX ?? 0) - TABLE_SIDE_OFFSET, 0),
    top: Math.max((table.positionY ?? 0) - TABLE_VERTICAL_OFFSET, 0),
    width: getTableFootprintWidth(table) + TABLE_SIDE_OFFSET * 2,
    height: getTableFootprintHeight(table) + TABLE_VERTICAL_OFFSET * 2,
  };
}

function getCoordinateRoomBounds(tables: TableGroup[]) {
  const positionedTables = tables.filter((table) => table.positionX !== null && table.positionY !== null);
  if (positionedTables.length === 0) {
    return null;
  }
  const maxRight = Math.max(
    ...positionedTables.map(
      (table) => (table.positionX ?? 0) + getTableFootprintWidth(table) + TABLE_SIDE_OFFSET + 64,
    ),
  );
  const maxBottom = Math.max(
    ...positionedTables.map(
      (table) => (table.positionY ?? 0) + getTableFootprintHeight(table) + TABLE_VERTICAL_OFFSET + 76,
    ),
  );
  return {
    width: Math.max(maxRight + 72, 640),
    height: Math.max(maxBottom + 44, 360),
  };
}

function getTableFootprintWidth(table: TableGroup) {
  const width = table.widthPx ?? 220;
  const height = table.heightPx ?? 96;
  return isQuarterTurn(table.rotationDeg) ? Math.max(width, height) : width;
}

function getTableFootprintHeight(table: TableGroup) {
  const width = table.widthPx ?? 220;
  const height = table.heightPx ?? 96;
  return isQuarterTurn(table.rotationDeg) ? Math.max(width, height) : height;
}

function isQuarterTurn(rotationDeg: number | null) {
  const normalized = Math.abs(rotationDeg ?? 0) % 180;
  return normalized > 45 && normalized < 135;
}

function getCoordinateRoomStyle(tables: TableGroup[]): CSSProperties {
  const bounds = getCoordinateRoomBounds(tables);
  if (!bounds) {
    return {};
  }
  return {
    width: bounds.width,
    height: bounds.height,
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
      '--table-rotation': `${table.rotationDeg ?? 0}deg`,
      left: Math.max(table.positionX - TABLE_SIDE_OFFSET, 0),
      top: Math.max(table.positionY - TABLE_VERTICAL_OFFSET, 0),
      transform: table.rotationDeg ? 'rotate(var(--table-rotation))' : undefined,
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

function getTableOrientationClass(table: TableGroup) {
  const width = table.widthPx ?? 220;
  const height = table.heightPx ?? 96;
  if (height > width * 1.15) {
    return 'seat-table-vertical';
  }
  if (width > height * 1.15) {
    return 'seat-table-horizontal';
  }
  return 'seat-table-square';
}

function getTableClassName(table: TableGroup) {
  const classes = ['seat-table'];
  if (table.positionX !== null && table.positionY !== null) {
    classes.push('seat-table-positioned', getTableOrientationClass(table));
  }
  if (table.rotationDeg) {
    classes.push('seat-table-rotated');
  }
  return classes.join(' ');
}

function clampZoom(value: number) {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Math.round(value * 10) / 10));
}

function formatZoomPercent(zoom: number) {
  return `${Math.round(zoom * 100)}%`;
}

function getCoordinateViewportStyle(tables: TableGroup[], zoom: number): CSSProperties {
  const bounds = getCoordinateRoomBounds(tables);
  if (!bounds) {
    return {};
  }
  return {
    width: Math.round(bounds.width * zoom),
    height: Math.round(bounds.height * zoom),
  };
}

function getCoordinateContentStyle(tables: TableGroup[], zoom: number): CSSProperties {
  return {
    ...getCoordinateRoomStyle(tables),
    transform: `scale(${zoom})`,
  };
}

function getTableSurfaceStyle(table: TableGroup): CSSProperties {
  if (table.widthPx === null && table.heightPx === null) {
    return {};
  }
  if (table.positionX === null && table.positionY === null) {
    return {
      width: Math.round((table.widthPx ?? 220) * TABLE_DISPLAY_SCALE),
      height: Math.round((table.heightPx ?? 96) * TABLE_DISPLAY_SCALE),
    };
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
  statusTextOverrides,
  onReserve,
  onSeatClick,
}: SeatMapProps) {
  const [zoom, setZoom] = useState(DEFAULT_ZOOM);
  const groups = groupSlots(slots);
  const selectableStatusSet = new Set(selectableStatuses);
  const zoomText = formatZoomPercent(zoom);
  const handleSeatClick = onSeatClick ?? onReserve;

  function getStatusText(status: SeatSlotStatus) {
    return statusTextOverrides?.[status] ?? seatSlotStatusText[status];
  }

  function changeZoom(delta: number) {
    setZoom((currentZoom) => clampZoom(currentZoom + delta));
  }

  function resetZoom() {
    setZoom(DEFAULT_ZOOM);
  }

  function renderZoomControls(isCoordinateLayout: boolean) {
    if (!isCoordinateLayout) {
      return null;
    }

    return (
      <div className="seat-map-zoom-controls" aria-label="座位图缩放控制" role="group">
        <Button
          aria-label="缩小座位图"
          disabled={zoom <= MIN_ZOOM}
          icon={<Minus size={15} />}
          onClick={() => changeZoom(-ZOOM_STEP)}
          size="small"
        />
        <span className="seat-map-zoom-value">{zoomText}</span>
        <Button
          aria-label="放大座位图"
          disabled={zoom >= MAX_ZOOM}
          icon={<Plus size={15} />}
          onClick={() => changeZoom(ZOOM_STEP)}
          size="small"
        />
        <Button aria-label="适配座位图" icon={<Maximize2 size={15} />} onClick={resetZoom} size="small" />
      </div>
    );
  }

  function renderTables(tables: TableGroup[]) {
    return tables.map((table) => (
      <div
        className={getTableClassName(table)}
        style={getTableStyle(table)}
        key={table.key}
        role="group"
        aria-label={getTableGroupLabel(table)}
      >
        <div className="seat-table-surface" style={getTableSurfaceStyle(table)}>
          <span>{getTableGroupLabel(table)}</span>
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
                const label = getSeatDisplayLabel(slot, table.seats);
                const tableLabel = getTableLabel(table);
                const statusText = getStatusText(slot.status);
                const title = `${tableLabel} · ${label} · ${statusText}`;

                return (
                  <Tooltip title={title} key={slot.id}>
                    <Button
                      aria-pressed={selected}
                      className={`seat-map-cell seat-map-cell-${slot.status.toLowerCase()} ${
                        selected ? 'seat-map-cell-selected' : ''
                      }`}
                      disabled={disabled}
                      loading={loadingSlotId === slot.id}
                      onClick={() => handleSeatClick?.(slot)}
                    >
                      <span>{label}</span>
                      <Tag color={seatSlotStatusColor[slot.status]}>{statusText}</Tag>
                    </Button>
                  </Tooltip>
                );
              })}
            </div>
          );
        })}
      </div>
    ));
  }

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
      {groups.map((group) => {
        const isCoordinateLayout = hasCoordinateLayout(group.tables);

        return (
          <section className="seat-map-section" key={group.timeRange}>
            <div className="seat-map-section-header">
              <div className="seat-map-section-title">
                <strong>{sectionTitle ?? group.timeRange}</strong>
                <span>{group.totalSeats} 个座位</span>
              </div>
              {renderZoomControls(isCoordinateLayout)}
            </div>
            <div className={`seat-room-layout ${isCoordinateLayout ? 'seat-room-layout-coordinate' : ''}`}>
              {isCoordinateLayout ? (
                <div className="seat-map-coordinate-viewport" style={getCoordinateViewportStyle(group.tables, zoom)}>
                  <div
                    className="seat-map-grid seat-map-grid-coordinate seat-map-coordinate-content"
                    data-testid="seat-map-coordinate-content"
                    style={getCoordinateContentStyle(group.tables, zoom)}
                  >
                    {renderTables(group.tables)}
                  </div>
                </div>
              ) : (
                <div className="seat-map-grid" style={getLayoutStyle(group.tables)}>
                  {renderTables(group.tables)}
                </div>
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
}
