import { Button, Empty, Spin, Tag, Tooltip } from 'antd';
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
  return left.seatId - right.seatId;
}

function groupSlots(slots: SeatSlot[]) {
  const groups = new Map<string, SeatSlot[]>();

  [...slots].sort(byTimeAndSeat).forEach((slot) => {
    const key = `${slot.startTime.slice(0, 5)}-${slot.endTime.slice(0, 5)}`;
    groups.set(key, [...(groups.get(key) ?? []), slot]);
  });

  return Array.from(groups.entries()).map(([timeRange, items]) => ({ timeRange, items }));
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
          <div className="seat-map-grid">
            {group.items.map((slot) => {
              const disabled = slot.status !== 'AVAILABLE';
              const label = `座位 ${slot.seatId}`;
              const title = `${label} · ${seatSlotStatusText[slot.status]}`;

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
        </section>
      ))}
    </div>
  );
}
