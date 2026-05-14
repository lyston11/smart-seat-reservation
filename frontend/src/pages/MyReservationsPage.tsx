import { useCallback, useEffect, useState } from 'react';
import { Button, Form, message, Table, Tag } from 'antd';
import type { TableColumnsType } from 'antd';
import { listUserReservations } from '../api/seatSlots';
import type { ReservationResult } from '../types/reservation';

const statusColor: Record<string, string> = {
  RESERVED: 'blue',
  CHECKED_IN: 'orange',
  CHECKED_OUT: 'green',
  CANCELLED: 'default',
  EXPIRED: 'red',
  ADMIN_RELEASED: 'purple',
};

const statusText: Record<string, string> = {
  RESERVED: '待签到',
  CHECKED_IN: '使用中',
  CHECKED_OUT: '已签退',
  CANCELLED: '已取消',
  EXPIRED: '已过期',
  ADMIN_RELEASED: '管理员释放',
};

export default function MyReservationsPage() {
  const [reservations, setReservations] = useState<ReservationResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();

  const loadReservations = useCallback(async () => {
    setLoading(true);
    try {
      setReservations(await listUserReservations());
    } catch (error) {
      messageApi.error(error instanceof Error ? error.message : '加载预约记录失败');
    } finally {
      setLoading(false);
    }
  }, [messageApi]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadReservations();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadReservations]);

  const columns: TableColumnsType<ReservationResult> = [
    { title: '预约 ID', dataIndex: 'reservationId', width: 120 },
    { title: '座位 ID', dataIndex: 'seatId', width: 120 },
    { title: '时段 ID', dataIndex: 'seatSlotId', width: 120 },
    {
      title: '状态',
      dataIndex: 'status',
      width: 140,
      render: (status: string) => (
        <Tag color={statusColor[status] ?? 'default'}>{statusText[status] ?? status}</Tag>
      ),
    },
    { title: '签到码', dataIndex: 'checkinCode', ellipsis: true },
    { title: '过期时间', dataIndex: 'expiresAt', width: 220 },
  ];

  return (
    <div className="page">
      {contextHolder}
      <div className="toolbar">
        <Form layout="inline">
          <Form.Item>
            <Button type="primary" loading={loading} onClick={loadReservations}>
              查询预约
            </Button>
          </Form.Item>
        </Form>
      </div>
      <Table
        rowKey="reservationId"
        loading={loading}
        dataSource={reservations}
        columns={columns}
        pagination={false}
      />
    </div>
  );
}
