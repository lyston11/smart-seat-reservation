import { Button, Popconfirm, Space } from 'antd';
import type { SeatSlot } from '../types/seat';

export type AdminSeatSlotActionType = 'release' | 'mark-abnormal' | 'restore';

type AdminSeatSlotActionsProps = {
  slot: SeatSlot;
  cancelling: boolean;
  actionLoading: boolean;
  onCancel: (slotId: number) => void;
  onReasonAction: (type: AdminSeatSlotActionType, slotId: number) => void;
};

export default function AdminSeatSlotActions({
  slot,
  cancelling,
  actionLoading,
  onCancel,
  onReasonAction,
}: AdminSeatSlotActionsProps) {
  const canCancel = slot.status === 'AVAILABLE';
  const canMarkAbnormal = slot.status === 'AVAILABLE' && !slot.reservedBy && !slot.reservationId;
  const canRestore = slot.status === 'ABNORMAL' && !slot.reservedBy && !slot.reservationId;
  const canRelease =
    slot.status === 'RESERVED'
    || slot.status === 'USING'
    || (slot.status === 'ABNORMAL' && Boolean(slot.reservationId));

  return (
    <Space wrap>
      {canMarkAbnormal ? (
        <Button
          size="small"
          loading={actionLoading}
          onClick={() => onReasonAction('mark-abnormal', slot.id)}
        >
          标异常
        </Button>
      ) : null}
      {canCancel ? (
        <Popconfirm
          title="撤销开放时段"
          description="只能撤销尚未被预约的空闲时段。"
          okText="撤销"
          cancelText="取消"
          onConfirm={() => onCancel(slot.id)}
        >
          <Button size="small" danger loading={cancelling}>
            撤销
          </Button>
        </Popconfirm>
      ) : null}
      {canRelease ? (
        <Button
          size="small"
          danger
          loading={actionLoading}
          onClick={() => onReasonAction('release', slot.id)}
        >
          释放
        </Button>
      ) : null}
      {canRestore ? (
        <Button
          size="small"
          type="primary"
          loading={actionLoading}
          onClick={() => onReasonAction('restore', slot.id)}
        >
          恢复
        </Button>
      ) : null}
    </Space>
  );
}
