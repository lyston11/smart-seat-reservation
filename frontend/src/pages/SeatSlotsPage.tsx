import { useEffect, useMemo, useState } from 'react';
import { Button, DatePicker, Form, InputNumber, message, Space, Table, Tag } from 'antd';
import type { TableColumnsType } from 'antd';
import dayjs from 'dayjs';
import { createReservation, listSeatSlots, type SeatSlot } from '../api/seatSlots';

const statusText: Record<SeatSlot['status'], string> = {
  AVAILABLE: '空闲',
  RESERVED: '已预约',
  USING: '使用中',
  RELEASED: '已释放',
  CANCELLED: '已取消',
  EXPIRED: '已过期',
  ABNORMAL: '异常占用',
};

const statusColor: Record<SeatSlot['status'], string> = {
  AVAILABLE: 'green',
  RESERVED: 'blue',
  USING: 'orange',
  RELEASED: 'default',
  CANCELLED: 'default',
  EXPIRED: 'red',
  ABNORMAL: 'red',
};

export default function SeatSlotsPage() {
  const [areaId, setAreaId] = useState(1);
  const [userId, setUserId] = useState(1);
  const [date, setDate] = useState(dayjs());
  const [slots, setSlots] = useState<SeatSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [reservingId, setReservingId] = useState<number | null>(null);
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
      await createReservation(slotId, userId);
      messageApi.success('预约成功');
      await loadSlots();
    } catch (error) {
      messageApi.error(error instanceof Error ? error.message : '预约失败');
    } finally {
      setReservingId(null);
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
