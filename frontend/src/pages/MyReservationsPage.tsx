import { useCallback, useEffect, useState } from 'react';
import { Button, Card, Empty, Form, Input, message, Popconfirm, Space, Statistic, Table, Tag, Typography } from 'antd';
import type { TableColumnsType } from 'antd';
import { cancelReservation, checkInReservation, checkOutReservation, listUserReservations } from '../api/seatSlots';
import type { ReservationResult } from '../types/reservation';
import {
  canCancelReservation,
  canCheckInReservation,
  canCheckOutReservation,
  formatDateTime,
  formatReservationLocation,
  formatReservationTime,
  isActiveReservation,
  reservationStatusColor,
  reservationStatusText,
} from '../utils/reservationDisplay';

export default function MyReservationsPage() {
  const [reservations, setReservations] = useState<ReservationResult[]>([]);
  const [checkinCodes, setCheckinCodes] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(false);
  const [actionId, setActionId] = useState<number | null>(null);
  const [messageApi, contextHolder] = message.useMessage();

  const loadReservations = useCallback(async () => {
    setLoading(true);
    try {
      const nextReservations = await listUserReservations();
      setReservations(nextReservations);
      setCheckinCodes((previous) => {
        const nextCodes: Record<number, string> = {};
        nextReservations.forEach((reservation) => {
          nextCodes[reservation.reservationId] = previous[reservation.reservationId] ?? reservation.checkinCode;
        });
        return nextCodes;
      });
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

  async function runAction(reservation: ReservationResult, action: 'check-in' | 'check-out' | 'cancel') {
    setActionId(reservation.reservationId);
    try {
      if (action === 'check-in') {
        await checkInReservation(reservation.reservationId, {
          checkinCode: checkinCodes[reservation.reservationId] ?? reservation.checkinCode,
        });
      } else if (action === 'check-out') {
        await checkOutReservation(reservation.reservationId);
      } else {
        await cancelReservation(reservation.reservationId);
      }
      messageApi.success('操作成功');
      await loadReservations();
    } catch (error) {
      messageApi.error(error instanceof Error ? error.message : '操作失败');
    } finally {
      setActionId(null);
    }
  }

  const activeReservations = reservations.filter(isActiveReservation);
  const reservedCount = reservations.filter((reservation) => reservation.status === 'RESERVED').length;
  const checkedInCount = reservations.filter((reservation) => reservation.status === 'CHECKED_IN').length;

  const columns: TableColumnsType<ReservationResult> = [
    { title: '预约 ID', dataIndex: 'reservationId', width: 110 },
    {
      title: '座位',
      width: 220,
      render: (_, record) => formatReservationLocation(record),
    },
    {
      title: '时间',
      width: 220,
      render: (_, record) => formatReservationTime(record),
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 140,
      render: (status: string) => (
        <Tag color={reservationStatusColor[status] ?? 'default'}>{reservationStatusText[status] ?? status}</Tag>
      ),
    },
    { title: '签到码', dataIndex: 'checkinCode', ellipsis: true },
    { title: '签到截止', dataIndex: 'expiresAt', width: 180, render: (value) => formatDateTime(value) },
  ];

  return (
    <div className="page">
      {contextHolder}
      <div className="toolbar">
        <Form layout="inline">
          <Form.Item>
            <Button type="primary" loading={loading} onClick={loadReservations}>
              刷新预约
            </Button>
          </Form.Item>
        </Form>
      </div>

      <div className="student-summary-grid">
        <Card>
          <Statistic title="活跃预约" value={activeReservations.length} suffix="个" />
        </Card>
        <Card>
          <Statistic title="待签到" value={reservedCount} suffix="个" />
        </Card>
        <Card>
          <Statistic title="使用中" value={checkedInCount} suffix="个" />
        </Card>
      </div>

      <div className="student-section">
        <div className="seat-map-section-header">
          <strong>当前可操作预约</strong>
          <span>签到 / 签退 / 取消</span>
        </div>
        {activeReservations.length > 0 ? (
          <div className="student-card-grid">
            {activeReservations.map((reservation) => (
              <Card className="reservation-card" key={reservation.reservationId}>
                <Space orientation="vertical" size={10} className="reservation-card-stack">
                  <Space wrap>
                    <Tag color={reservationStatusColor[reservation.status] ?? 'default'}>
                      {reservationStatusText[reservation.status] ?? reservation.status}
                    </Tag>
                    <Typography.Text strong>预约 #{reservation.reservationId}</Typography.Text>
                  </Space>
                  <Typography.Text>{formatReservationLocation(reservation)}</Typography.Text>
                  <Typography.Text type="secondary">{formatReservationTime(reservation)}</Typography.Text>
                  <div className="reservation-code-field">
                    <span>签到码</span>
                    <Input
                      value={checkinCodes[reservation.reservationId] ?? reservation.checkinCode}
                      disabled={!canCheckInReservation(reservation)}
                      onChange={(event) =>
                        setCheckinCodes((previous) => ({
                          ...previous,
                          [reservation.reservationId]: event.target.value,
                        }))
                      }
                    />
                  </div>
                  <Space wrap>
                    <Button
                      type="primary"
                      disabled={!canCheckInReservation(reservation)}
                      loading={actionId === reservation.reservationId}
                      onClick={() => runAction(reservation, 'check-in')}
                    >
                      签到
                    </Button>
                    <Button
                      disabled={!canCheckOutReservation(reservation)}
                      loading={actionId === reservation.reservationId}
                      onClick={() => runAction(reservation, 'check-out')}
                    >
                      签退
                    </Button>
                    <Popconfirm
                      title="取消预约"
                      description="取消后该座位会释放给其他同学。"
                      okText="取消预约"
                      cancelText="返回"
                      onConfirm={() => runAction(reservation, 'cancel')}
                    >
                      <Button
                        danger
                        disabled={!canCancelReservation(reservation)}
                        loading={actionId === reservation.reservationId}
                      >
                        取消
                      </Button>
                    </Popconfirm>
                  </Space>
                  <Typography.Text type="secondary">
                    签到截止 {formatDateTime(reservation.expiresAt)}
                  </Typography.Text>
                </Space>
              </Card>
            ))}
          </div>
        ) : (
          <Empty description="当前没有待处理预约" />
        )}
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
