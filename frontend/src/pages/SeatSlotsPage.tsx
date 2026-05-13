import { useEffect, useMemo, useState } from 'react';
import { Button, DatePicker, Form, Input, InputNumber, message, Space, Table, Tag } from 'antd';
import type { TableColumnsType } from 'antd';
import dayjs from 'dayjs';
import {
  cancelReservation,
  checkInReservation,
  checkOutReservation,
  createReservation,
  listSeatSlots,
  type ReservationResult,
  type SeatSlot,
} from '../api/seatSlots';

const statusText: Record<SeatSlot['status'], string> = {
  AVAILABLE: '空闲',
  RESERVED: '已预约',
  USING: '使用中',
  ABNORMAL: '异常占用',
};

const statusColor: Record<SeatSlot['status'], string> = {
  AVAILABLE: 'green',
  RESERVED: 'blue',
  USING: 'orange',
  ABNORMAL: 'red',
};

export default function SeatSlotsPage() {
  const [areaId, setAreaId] = useState(1);
  const [userId, setUserId] = useState(1);
  const [date, setDate] = useState(dayjs());
  const [slots, setSlots] = useState<SeatSlot[]>([]);
  const [activeReservation, setActiveReservation] = useState<ReservationResult | null>(null);
  const [checkinCode, setCheckinCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [reservingId, setReservingId] = useState<number | null>(null);
  const [reservationAction, setReservationAction] = useState<string | null>(null);
  const [messageApi, contextHolder] = message.useMessage();

  const dateText = useMemo(() => date.format('YYYY-MM-DD'), [date]);

  async function loadSlots() {
    setLoading(true);
    try {
      setSlots(await listSeatSlots(areaId, dateText));
    } catch (error) {
      messageApi.error(error instanceof Error ? error.message : '加载座位失败');
    } finally {
      setLoading(false);
    }
  }

  async function reserve(slotId: number) {
    setReservingId(slotId);
    try {
      const reservation = await createReservation(slotId, userId);
      setActiveReservation(reservation);
      setCheckinCode(reservation.checkinCode);
      messageApi.success('预约成功');
      await loadSlots();
    } catch (error) {
      messageApi.error(error instanceof Error ? error.message : '预约失败');
    } finally {
      setReservingId(null);
    }
  }

  async function runReservationAction(action: 'check-in' | 'check-out' | 'cancel') {
    if (!activeReservation) {
      messageApi.warning('请先完成预约');
      return;
    }

    setReservationAction(action);
    try {
      const reservation =
        action === 'check-in'
          ? await checkInReservation(activeReservation.reservationId, { userId, checkinCode })
          : action === 'check-out'
            ? await checkOutReservation(activeReservation.reservationId, userId)
            : await cancelReservation(activeReservation.reservationId, userId);

      setActiveReservation(reservation);
      messageApi.success('操作成功');
      await loadSlots();
    } catch (error) {
      messageApi.error(error instanceof Error ? error.message : '操作失败');
    } finally {
      setReservationAction(null);
    }
  }

  useEffect(() => {
    void loadSlots();
  }, []);

  const columns: TableColumnsType<SeatSlot> = [
    { title: '座位', dataIndex: 'seatId', width: 120 },
    { title: '日期', dataIndex: 'slotDate', width: 140 },
    {
      title: '时间段',
      width: 180,
      render: (_, record) => `${record.startTime.slice(0, 5)}-${record.endTime.slice(0, 5)}`,
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 140,
      render: (status: SeatSlot['status']) => (
        <Tag color={statusColor[status]}>{statusText[status]}</Tag>
      ),
    },
    { title: '预约人', dataIndex: 'reservedBy', width: 120, render: (value) => value ?? '-' },
    {
      title: '操作',
      width: 160,
      render: (_, record) => (
        <Space>
          <Button
            size="small"
            type="primary"
            disabled={record.status !== 'AVAILABLE'}
            loading={reservingId === record.id}
            onClick={() => reserve(record.id)}
          >
            预约
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="page">
      {contextHolder}
      <div className="toolbar">
        <Form layout="inline">
          <Form.Item label="区域">
            <InputNumber min={1} value={areaId} onChange={(value) => setAreaId(value ?? 1)} />
          </Form.Item>
          <Form.Item label="用户">
            <InputNumber min={1} value={userId} onChange={(value) => setUserId(value ?? 1)} />
          </Form.Item>
          <Form.Item label="日期">
            <DatePicker value={date} onChange={(value) => setDate(value ?? dayjs())} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" onClick={loadSlots} loading={loading}>
              查询
            </Button>
          </Form.Item>
        </Form>
      </div>

      <div className="reservation-panel">
        <div className="reservation-fields">
          <Input
            className="reservation-input"
            addonBefore="预约"
            value={activeReservation?.reservationId ?? ''}
            readOnly
          />
          <Input
            className="reservation-code"
            addonBefore="签到码"
            value={checkinCode}
            onChange={(event) => setCheckinCode(event.target.value)}
          />
        </div>
        <Space>
          <Button
            disabled={!activeReservation}
            loading={reservationAction === 'check-in'}
            onClick={() => runReservationAction('check-in')}
          >
            签到
          </Button>
          <Button
            disabled={!activeReservation}
            loading={reservationAction === 'check-out'}
            onClick={() => runReservationAction('check-out')}
          >
            签退
          </Button>
          <Button
            danger
            disabled={!activeReservation}
            loading={reservationAction === 'cancel'}
            onClick={() => runReservationAction('cancel')}
          >
            取消
          </Button>
        </Space>
      </div>

      <Table
        rowKey="id"
        loading={loading}
        dataSource={slots}
        pagination={false}
        columns={columns}
      />
    </div>
  );
}
