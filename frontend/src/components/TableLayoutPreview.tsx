import { Empty } from 'antd';
import type { CSSProperties, KeyboardEvent, PointerEvent } from 'react';
import { useState } from 'react';
import type { StudyTable } from '../types/seat';

type TableLayoutPreviewProps = {
  tables: StudyTable[];
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
  moved: boolean;
};

const GRID_SIZE = 10;

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

function getRoomStyle(tables: StudyTable[]): CSSProperties {
  const activeTables = tables.filter((table) => table.status === 'ACTIVE' && isManagedTable(table));
  if (activeTables.length === 0) {
    return {};
  }
  const maxRight = Math.max(...activeTables.map((table) => (table.positionX ?? 0) + (table.widthPx ?? 220)));
  const maxBottom = Math.max(...activeTables.map((table) => (table.positionY ?? 0) + (table.heightPx ?? 96)));
  return {
    minWidth: Math.max(maxRight + 120, 860),
    minHeight: Math.max(maxBottom + 120, 420),
  };
}

function getTableStyle(table: StudyTable): CSSProperties {
  return {
    left: table.positionX ?? 80,
    top: table.positionY ?? 80,
    width: table.widthPx ?? 220,
    height: table.heightPx ?? 96,
    transform: table.rotationDeg ? `rotate(${table.rotationDeg}deg)` : undefined,
  };
}

function toPixelNumber(value: CSSProperties['minWidth'], fallback: number) {
  if (typeof value === 'number') {
    return value;
  }
  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value);
    return Number.isNaN(parsed) ? fallback : parsed;
  }
  return fallback;
}

function snapToGrid(value: number) {
  return Math.round(value / GRID_SIZE) * GRID_SIZE;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function getNextPosition(table: StudyTable, rawX: number, rawY: number, roomStyle: CSSProperties): TablePosition {
  const roomWidth = toPixelNumber(roomStyle.minWidth, 860);
  const roomHeight = toPixelNumber(roomStyle.minHeight, 420);
  const tableWidth = table.widthPx ?? 220;
  const tableHeight = table.heightPx ?? 96;
  const maxX = Math.max(0, roomWidth - tableWidth - 24);
  const maxY = Math.max(0, roomHeight - tableHeight - 24);
  return {
    positionX: clamp(snapToGrid(rawX), 0, maxX),
    positionY: clamp(snapToGrid(rawY), 0, maxY),
  };
}

export default function TableLayoutPreview({
  tables,
  selectedTableId,
  onSelectTable,
  editable = false,
  onMoveTable,
}: TableLayoutPreviewProps) {
  const [dragState, setDragState] = useState<DragState | null>(null);
  const activeTables = tables
    .filter((table) => table.status === 'ACTIVE' && isManagedTable(table))
    .sort(byTablePosition);
  const roomStyle = getRoomStyle(activeTables);

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
      dragState.startPositionX + deltaX,
      dragState.startPositionY + deltaY,
      roomStyle,
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
        (table.positionX ?? 80) + delta.positionX,
        (table.positionY ?? 80) + delta.positionY,
        roomStyle,
      ),
    );
  }

  return (
    <div className={`table-layout-preview ${editable ? 'table-layout-preview-editable' : ''}`}>
      <div className="table-layout-room" style={roomStyle}>
        <div className="seat-room-feature seat-room-door">入口</div>
        <div className="seat-room-feature seat-room-window">采光窗</div>
        {activeTables.map((table) => (
          <button
            type="button"
            className={[
              'table-layout-item',
              table.id === selectedTableId ? 'table-layout-item-selected' : '',
              dragState?.tableId === table.id ? 'table-layout-item-dragging' : '',
            ].join(' ')}
            style={getTableStyle(table)}
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
            <span>{table.tableNo}</span>
            {table.name ? <small>{table.name}</small> : null}
          </button>
        ))}
        <div className="seat-room-feature seat-room-desk">服务台</div>
      </div>
    </div>
  );
}
