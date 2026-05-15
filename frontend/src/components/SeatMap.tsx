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

function byTimeAndSeat(left: SeatSlot, right: SeatSlot) {
  const timeCompare = `${left.startTime}-${left.endTime}`.localeCompare(`${right.startTime}-${right.endTime}`);
  if (timeCompare !== 0) {
    return timeCompare;
  }
  const rowCompare = (left.rowNo ?? Number.MAX_SAFE_INTEGER) - (right.rowNo ?? Number.MAX_SAFE_INTEGER);
  if (rowCompare !== 0) {
    return rowCompare;
  }
  const columnCompare = (left.columnNo ?? Number.MAX_SAFE_INTEGER) - (right.columnNo ?? Number.MAX_SAFE_INTEGER);
  if (columnCompare !== 0) {
    return columnCompare;
  }
  const displayCompare =
    (left.displayOrder ?? Number.MAX_SAFE_INTEGER) - (right.displayOrder ?? Number.MAX_SAFE_INTEGER);
  if (displayCompare !== 0) {
    return displayCompare;
  }
  return (left.seatNo ?? String(left.seatId)).localeCompare(right.seatNo ?? String(right.seatId));
}

function groupSlots(slots: SeatSlot[]) {
  const groups = new Map<string, SeatSlot[]>();

  [...slots].sort(byTimeAndSeat).forEach((slot) => {
    const key = `${slot.startTime.slice(0, 5)}-${slot.endTime.slice(0, 5)}`;
    groups.set(key, [...(groups.get(key) ?? []), slot]);
  });

  return Array.from(groups.entries()).map(([timeRange, items]) => ({ timeRange, items }));
}

function getLayoutStyle(items: SeatSlot[]): CSSProperties {
  const positionedItems = items.filter((slot) => slot.rowNo && slot.columnNo);
  if (positionedItems.length === 0) {
    return {};
  }
  const maxColumn = Math.max(...positionedItems.map((slot) => slot.columnNo ?? 1));
  return {
    gridTemplateColumns: `repeat(${maxColumn}, minmax(88px, 1fr))`,
  };
}

function getCellStyle(slot: SeatSlot): CSSProperties {
  if (!slot.rowNo || !slot.columnNo) {
    return {};
  }
  return {
    gridRow: slot.rowNo,
    gridColumn: slot.columnNo,
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
            <span>{group.items.length} 个开放座位</span>
          </div>
          <div className="seat-room-layout">
            <div className="seat-room-feature seat-room-door">入口</div>
            <div className="seat-room-feature seat-room-window">采光窗</div>
            <div className="seat-map-grid" style={getLayoutStyle(group.items)}>
              {group.items.map((slot) => {
                const disabled = slot.status !== 'AVAILABLE';
                const label = slot.seatNo ?? `座位 ${slot.seatId}`;
                const position =
                  slot.rowNo && slot.columnNo ? `第 ${slot.rowNo} 排 · 第 ${slot.columnNo} 列` : '未设置布局位置';
                const title = `${label} · ${position} · ${seatSlotStatusText[slot.status]}`;

                return (
                  <Tooltip title={title} key={slot.id}>
                    <Button
                      className={`seat-map-cell seat-map-cell-${slot.status.toLowerCase()}`}
                      disabled={disabled}
                      loading={loadingSlotId === slot.id}
                      style={getCellStyle(slot)}
                      onClick={() => onReserve(slot.id)}
                    >
                      <span>{label}</span>
                      <Tag color={seatSlotStatusColor[slot.status]}>{seatSlotStatusText[slot.status]}</Tag>
                    </Button>
                  </Tooltip>
                );
              })}
            </div>
            <div className="seat-room-feature seat-room-desk">服务台</div>
          </div>
        </section>
      ))}
    </div>
  );
}
