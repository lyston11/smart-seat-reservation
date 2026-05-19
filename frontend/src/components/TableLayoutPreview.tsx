import { Empty } from 'antd';
import type { CSSProperties } from 'react';
import type { StudyTable } from '../types/seat';

type TableLayoutPreviewProps = {
  tables: StudyTable[];
  selectedTableId?: number | null;
  onSelectTable?: (table: StudyTable) => void;
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

function getRoomStyle(tables: StudyTable[]): CSSProperties {
  const activeTables = tables.filter((table) => table.status === 'ACTIVE' && isManagedTable(table));
  if (activeTables.length === 0) {
    return {};
  }
  const maxRight = Math.max(...activeTables.map((table) => (table.positionX ?? 0) + (table.widthPx ?? 220)));
  const maxBottom = Math.max(...activeTables.map((table) => (table.positionY ?? 0) + (table.heightPx ?? 96)));
  return {
    minWidth: Math.max(maxRight + 96, 640),
    minHeight: Math.max(maxBottom + 96, 360),
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

export default function TableLayoutPreview({ tables, selectedTableId, onSelectTable }: TableLayoutPreviewProps) {
  const activeTables = tables
    .filter((table) => table.status === 'ACTIVE' && isManagedTable(table))
    .sort(byTablePosition);

  if (activeTables.length === 0) {
    return (
      <div className="empty-panel">
        <Empty description="当前区域暂无启用桌子" />
      </div>
    );
  }

  return (
    <div className="table-layout-preview">
      <div className="table-layout-room" style={getRoomStyle(activeTables)}>
        <div className="seat-room-feature seat-room-door">入口</div>
        <div className="seat-room-feature seat-room-window">采光窗</div>
        {activeTables.map((table) => (
          <button
            type="button"
            className={`table-layout-item ${table.id === selectedTableId ? 'table-layout-item-selected' : ''}`}
            style={getTableStyle(table)}
            key={table.id}
            onClick={() => onSelectTable?.(table)}
            aria-label={`编辑 ${table.tableNo}`}
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
