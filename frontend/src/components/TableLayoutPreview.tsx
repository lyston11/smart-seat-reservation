import { Empty } from 'antd';
import type { CSSProperties, KeyboardEvent, PointerEvent } from 'react';
import { useState } from 'react';
import type { StudyTable } from '../types/seat';

type TableLayoutPreviewProps = {
  tables: StudyTable[];
  seatCounts?: Record<number, number>;
  selectedTableId?: number | null;
  onSelectTable?: (table: StudyTable) => void;
  editable?: boolean;
  onMoveTable?: (table: StudyTable, position: TablePosition) => void;
};

type TablePosition = {
  positionX: number;
  positionY: number;
};

type DragState = {
  tableId: number;
  pointerId: number;
  startClientX: number;
  startClientY: number;
  startPositionX: number;
  startPositionY: number;
  bounds: LayoutBounds;
  moved: boolean;
};

const GRID_SIZE = 10;
const ROOM_MARGIN = 48;
const DEFAULT_ROOM_WIDTH = 760;
const DEFAULT_ROOM_HEIGHT = 420;
const MIN_STAGE_HEIGHT = 420;
const MAX_STAGE_HEIGHT = 560;
const VISUAL_SIZE_RATIO = 0.56;

type RoomMetrics = {
  width: number;
  height: number;
};

type LayoutBounds = {
  left: number;
  top: number;
  width: number;
  height: number;
};

function byTablePosition(left: StudyTable, right: StudyTable) {
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
  return left.tableNo.localeCompare(right.tableNo);
}

function isManagedTable(table: StudyTable) {
  return table.tableNo.toUpperCase() !== 'LEGACY';
}

function getVisualTableSize(table: StudyTable, seatCount: number) {
  const rawWidth = table.widthPx ?? 220;
  const rawHeight = table.heightPx ?? 96;
  if (seatCount >= 4) {
    return { width: Math.min(rawWidth * VISUAL_SIZE_RATIO, 124), height: Math.min(rawHeight * VISUAL_SIZE_RATIO, 54) };
  }
  if (seatCount === 3) {
    return {
      width: Math.min(rawWidth * VISUAL_SIZE_RATIO, 108),
      height: Math.min(Math.max(rawHeight * VISUAL_SIZE_RATIO, 66), 76),
    };
  }
  if (seatCount === 2) {
    return { width: Math.min(rawWidth * VISUAL_SIZE_RATIO, 100), height: Math.min(rawHeight * VISUAL_SIZE_RATIO, 48) };
  }
  if (seatCount === 1) {
    return { width: Math.min(rawWidth * VISUAL_SIZE_RATIO, 72), height: Math.min(rawHeight * VISUAL_SIZE_RATIO, 48) };
  }
  return { width: Math.min(rawWidth * VISUAL_SIZE_RATIO, 96), height: Math.min(rawHeight * VISUAL_SIZE_RATIO, 48) };
}

function getRoomMetrics(tables: StudyTable[], seatCounts: Record<number, number>): RoomMetrics {
  const activeTables = tables.filter((table) => table.status === 'ACTIVE' && isManagedTable(table));
  if (activeTables.length === 0) {
    return { width: DEFAULT_ROOM_WIDTH, height: DEFAULT_ROOM_HEIGHT };
  }
  const maxRight = Math.max(
    ...activeTables.map((table) => {
      const size = getVisualTableSize(table, seatCounts[table.id] ?? 0);
      return (table.positionX ?? 0) + size.width;
    }),
  );
  const maxBottom = Math.max(
    ...activeTables.map((table) => {
      const size = getVisualTableSize(table, seatCounts[table.id] ?? 0);
      return (table.positionY ?? 0) + size.height;
    }),
  );
  return {
    width: Math.max(maxRight + ROOM_MARGIN, DEFAULT_ROOM_WIDTH),
    height: Math.max(maxBottom + ROOM_MARGIN, DEFAULT_ROOM_HEIGHT),
  };
}

function getTableStyle(table: StudyTable, seatCount: number): CSSProperties {
  const size = getVisualTableSize(table, seatCount);
  return ({
    '--table-left': `${table.positionX ?? 80}px`,
    '--table-top': `${table.positionY ?? 80}px`,
    '--table-width': `${size.width}px`,
    '--table-height': `${size.height}px`,
    left: 'clamp(0px, var(--table-left), calc(100% - var(--table-width) - 24px))',
    top: 'clamp(0px, var(--table-top), calc(100% - var(--table-height) - 24px))',
    width: 'var(--table-width)',
    height: 'var(--table-height)',
    transform: table.rotationDeg ? `rotate(${table.rotationDeg}deg)` : undefined,
  } as CSSProperties);
}

function snapToGrid(value: number) {
  return Math.round(value / GRID_SIZE) * GRID_SIZE;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function getNextPosition(
  table: StudyTable,
  seatCount: number,
  rawX: number,
  rawY: number,
  bounds: LayoutBounds,
): TablePosition {
  const size = getVisualTableSize(table, seatCount);
  const maxX = Math.max(bounds.left, bounds.left + bounds.width - size.width - 24);
  const maxY = Math.max(bounds.top, bounds.top + bounds.height - size.height - 24);
  return {
    positionX: clamp(snapToGrid(rawX), bounds.left, maxX),
    positionY: clamp(snapToGrid(rawY), bounds.top, maxY),
  };
}

function getLayoutBounds(element: HTMLElement): LayoutBounds {
  const preview = element.closest('.table-layout-preview') as HTMLElement | null;
  const stage = element.closest('.table-layout-stage') as HTMLElement | null;
  return {
    left: preview?.scrollLeft ?? 0,
    top: 0,
    width: stage?.clientWidth || preview?.clientWidth || DEFAULT_ROOM_WIDTH,
    height: stage?.clientHeight || DEFAULT_ROOM_HEIGHT,
  };
}

function getSeatCountLabel(seatCount: number) {
  if (seatCount === 2 || seatCount === 3 || seatCount === 4) {
    return `${seatCount}人桌`;
  }
  if (seatCount > 4) {
    return `${seatCount}座桌`;
  }
  if (seatCount === 1) {
    return '单人桌';
  }
  return '未配置座位';
}

function getSeatCountClass(seatCount: number) {
  if (seatCount <= 0) {
    return 'unknown';
  }
  if (seatCount >= 4) {
    return 'four';
  }
  if (seatCount === 3) {
    return 'three';
  }
  if (seatCount === 2) {
    return 'two';
  }
  return 'single';
}

function getMarkerCount(seatCount: number) {
  if (seatCount <= 0) {
    return 0;
  }
  return Math.min(seatCount, 6);
}

export default function TableLayoutPreview({
  tables,
  seatCounts = {},
  selectedTableId,
  onSelectTable,
  editable = false,
  onMoveTable,
}: TableLayoutPreviewProps) {
  const [dragState, setDragState] = useState<DragState | null>(null);
  const activeTables = tables
    .filter((table) => table.status === 'ACTIVE' && isManagedTable(table))
    .sort(byTablePosition);
  const roomMetrics = getRoomMetrics(activeTables, seatCounts);

  if (activeTables.length === 0) {
    return (
      <div className="empty-panel">
        <Empty description="当前区域暂无启用桌子" />
      </div>
    );
  }

  function startDrag(table: StudyTable, event: PointerEvent<HTMLButtonElement>) {
    if (!editable || event.button !== 0) {
      return;
    }
    event.preventDefault();
    event.currentTarget.setPointerCapture?.(event.pointerId);
    setDragState({
      tableId: table.id,
      pointerId: event.pointerId,
      startClientX: event.clientX,
      startClientY: event.clientY,
      startPositionX: table.positionX ?? 80,
      startPositionY: table.positionY ?? 80,
      bounds: getLayoutBounds(event.currentTarget),
      moved: false,
    });
  }

  function moveDrag(table: StudyTable, event: PointerEvent<HTMLButtonElement>) {
    if (!editable || dragState?.tableId !== table.id || dragState.pointerId !== event.pointerId) {
      return;
    }
    const deltaX = event.clientX - dragState.startClientX;
    const deltaY = event.clientY - dragState.startClientY;
    const moved = dragState.moved || Math.abs(deltaX) + Math.abs(deltaY) > 3;
    if (!moved) {
      return;
    }
    const nextPosition = getNextPosition(
      table,
      seatCounts[table.id] ?? 0,
      dragState.startPositionX + deltaX,
      dragState.startPositionY + deltaY,
      dragState.bounds,
    );
    onMoveTable?.(table, nextPosition);
    if (!dragState.moved) {
      setDragState({ ...dragState, moved: true });
    }
  }

  function endDrag(table: StudyTable, event: PointerEvent<HTMLButtonElement>) {
    if (!editable || dragState?.tableId !== table.id || dragState.pointerId !== event.pointerId) {
      return;
    }
    event.currentTarget.releasePointerCapture?.(event.pointerId);
    if (!dragState.moved) {
      onSelectTable?.(table);
    }
    setDragState(null);
  }

  function cancelDrag(table: StudyTable, event: PointerEvent<HTMLButtonElement>) {
    if (dragState?.tableId === table.id && dragState.pointerId === event.pointerId) {
      setDragState(null);
    }
  }

  function handleKeyDown(table: StudyTable, event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onSelectTable?.(table);
      return;
    }
    if (!editable || !onMoveTable) {
      return;
    }
    const deltaByKey: Record<string, TablePosition> = {
      ArrowUp: { positionX: 0, positionY: -GRID_SIZE },
      ArrowDown: { positionX: 0, positionY: GRID_SIZE },
      ArrowLeft: { positionX: -GRID_SIZE, positionY: 0 },
      ArrowRight: { positionX: GRID_SIZE, positionY: 0 },
    };
    const delta = deltaByKey[event.key];
    if (!delta) {
      return;
    }
    event.preventDefault();
    onMoveTable(
      table,
      getNextPosition(
        table,
        seatCounts[table.id] ?? 0,
        (table.positionX ?? 80) + delta.positionX,
        (table.positionY ?? 80) + delta.positionY,
        getLayoutBounds(event.currentTarget),
      ),
    );
  }

  return (
    <div className={`table-layout-preview ${editable ? 'table-layout-preview-editable' : ''}`}>
      <div
        className="table-layout-stage"
        style={{ height: Math.min(Math.max(roomMetrics.height, MIN_STAGE_HEIGHT), MAX_STAGE_HEIGHT) }}
      >
        {activeTables.map((table) => {
          const seatCount = seatCounts[table.id] ?? 0;
          const markerCount = getMarkerCount(seatCount);
          return (
            <button
              type="button"
              className={[
                'table-layout-item',
                `table-layout-item-${getSeatCountClass(seatCount)}`,
                table.id === selectedTableId ? 'table-layout-item-selected' : '',
                dragState?.tableId === table.id ? 'table-layout-item-dragging' : '',
              ].join(' ')}
              style={getTableStyle(table, seatCount)}
              key={table.id}
              onClick={() => {
                if (!editable) {
                  onSelectTable?.(table);
                }
              }}
              onPointerDown={(event) => startDrag(table, event)}
              onPointerMove={(event) => moveDrag(table, event)}
              onPointerUp={(event) => endDrag(table, event)}
              onPointerCancel={(event) => cancelDrag(table, event)}
              onKeyDown={(event) => handleKeyDown(table, event)}
              aria-label={`编辑 ${table.tableNo}`}
              title={editable ? '拖动调整桌位' : undefined}
            >
              {Array.from({ length: markerCount }).map((_, index) => (
                <i
                  key={`${table.id}-seat-marker-${index + 1}`}
                  className={`table-seat-marker table-seat-marker-${getSeatCountClass(seatCount)}-${index + 1}`}
                  aria-hidden="true"
                />
              ))}
              <span>{table.tableNo}</span>
              <small>{getSeatCountLabel(seatCount)}</small>
            </button>
          );
        })}
      </div>
    </div>
  );
}
