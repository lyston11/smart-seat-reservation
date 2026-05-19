import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Button,
  Card,
  DatePicker,
  Descriptions,
  Empty,
  Form,
  Input,
  message,
  Modal,
  Popconfirm,
  Select,
  Space,
  Statistic,
  Table,
  Tag,
  Typography,
} from 'antd';
import type { TableColumnsType } from 'antd';
import dayjs from 'dayjs';
import {
  cancelReservation,
  checkInReservation,
  checkOutReservation,
  listUserReservations,
  markReservationWifiPresence,
} from '../api/seatSlots';
import type { ReservationResult } from '../types/reservation';
import {
  canCancelReservation,
  canCheckInReservation,
  canCheckOutReservation,
  filterReservations,
  formatDate,
  formatDateTime,
  formatReservationLocation,
  formatReservationTime,
  formatTime,
  getCheckinCountdown,
  isActiveReservation,
  reservationStatusColor,
  reservationStatusFilterOptions,
  reservationStatusText,
  type ReservationStatusFilter,
} from '../utils/reservationDisplay';

export default function MyReservationsPage() {
  const [reservations, setReservations] = useState<ReservationResult[]>([]);
  const [checkinCodes, setCheckinCodes] = useState<Record<number, string>>({});
  const [statusFilter, setStatusFilter] = useState<ReservationStatusFilter>('ALL');
  const [dateFilter, setDateFilter] = useState<string | null>(null);
  const [detailReservation, setDetailReservation] = useState<ReservationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionId, setActionId] = useState<number | null>(null);
  const [wifiHeartbeatAt, setWifiHeartbeatAt] = useState<Record<number, string>>({});
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

  useEffect(() => {
    const usingReservations = reservations.filter((reservation) => reservation.status === 'CHECKED_IN');
    if (usingReservations.length === 0) {
      return undefined;
    }

    let stopped = false;
    async function sendHeartbeat() {
      await Promise.all(
        usingReservations.map(async (reservation) => {
          try {
            const result = await markReservationWifiPresence(reservation.reservationId);
            if (!stopped) {
              setWifiHeartbeatAt((previous) => ({
                ...previous,
                [reservation.reservationId]: result.lastWifiSeenAt ?? new Date().toISOString(),
              }));
            }
          } catch (error) {
            if (!stopped) {
              messageApi.warning(error instanceof Error ? error.message : 'WiFi 在线检测失败');
            }
          }
        }),
      );
    }

    void sendHeartbeat();
    const timer = window.setInterval(() => {
      void sendHeartbeat();
    }, 60000);
    return () => {
      stopped = true;
      window.clearInterval(timer);
    };
  }, [messageApi, reservations]);

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
      if (detailReservation?.reservationId === reservation.reservationId) {
        setDetailReservation(null);
      }
    } catch (error) {
      messageApi.error(error instanceof Error ? error.message : '操作失败');
    } finally {
      setActionId(null);
    }
  }

  const activeReservations = reservations.filter(isActiveReservation);
  const reservedCount = reservations.filter((reservation) => reservation.status === 'RESERVED').length;
  const checkedInCount = reservations.filter((reservation) => reservation.status === 'CHECKED_IN').length;
  const filteredReservations = useMemo(
    () => filterReservations(reservations, statusFilter, dateFilter),
    [dateFilter, reservations, statusFilter],
  );

  function renderCountdown(reservation: ReservationResult) {
    const countdown = getCheckinCountdown(reservation);
    if (!countdown) {
      return <Typography.Text type="secondary">-</Typography.Text>;
    }
    return (
      <Tag color={countdown.urgent ? 'red' : 'blue'} className="reservation-countdown-tag">
        {countdown.text}
      </Tag>
    );
  }

  function renderReservationActions(reservation: ReservationResult) {
    return (
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
    );
  }

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
    {
      title: '倒计时',
      width: 150,
      render: (_, record) => renderCountdown(record),
    },
    {
      title: '详情',
      width: 120,
      render: (_, record) => (
        <Button size="small" onClick={() => setDetailReservation(record)}>
          查看详情
        </Button>
      ),
    },
  ];

  return (
    <div className="page">
      {contextHolder}
      <div className="toolbar">
        <Form layout="inline">
          <Form.Item label="状态">
            <Select
              aria-label="状态筛选"
              className="reservation-filter-select"
              value={statusFilter}
              options={reservationStatusFilterOptions}
              onChange={setStatusFilter}
            />
          </Form.Item>
          <Form.Item label="日期">
            <DatePicker
              allowClear
              value={dateFilter ? dayjs(dateFilter) : null}
              onChange={(value) => setDateFilter(value ? value.format('YYYY-MM-DD') : null)}
            />
          </Form.Item>
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
                  <div className="reservation-countdown-row">{renderCountdown(reservation)}</div>
                  {reservation.status === 'CHECKED_IN' ? (
                    <Typography.Text type="secondary">
                      WiFi 在线检测 {formatDateTime(wifiHeartbeatAt[reservation.reservationId] ?? reservation.lastWifiSeenAt)}
                    </Typography.Text>
                  ) : null}
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
                  {renderReservationActions(reservation)}
                  <Typography.Text type="secondary">
                    签到截止 {formatDateTime(reservation.expiresAt)}
                  </Typography.Text>
                  <Button onClick={() => setDetailReservation(reservation)}>查看详情</Button>
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
        dataSource={filteredReservations}
        columns={columns}
        pagination={false}
      />

      <Modal
        title={detailReservation ? `预约 #${detailReservation.reservationId}` : '预约详情'}
        open={Boolean(detailReservation)}
        footer={detailReservation ? renderReservationActions(detailReservation) : null}
        onCancel={() => setDetailReservation(null)}
      >
        {detailReservation ? (
          <Space orientation="vertical" size={16} className="reservation-detail-stack">
            <Descriptions column={1} size="small" bordered>
              <Descriptions.Item label="状态">
                <Tag color={reservationStatusColor[detailReservation.status] ?? 'default'}>
                  {reservationStatusText[detailReservation.status] ?? detailReservation.status}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="区域">
                {detailReservation.areaName ?? '-'}{detailReservation.floor ? ` · ${detailReservation.floor}` : ''}
              </Descriptions.Item>
              <Descriptions.Item label="桌号">{detailReservation.tableNo ?? '-'}</Descriptions.Item>
              <Descriptions.Item label="座位">
                {detailReservation.seatNo ?? `座位 ${detailReservation.seatId}`}
                {detailReservation.seatLabel ? ` (${detailReservation.seatLabel})` : ''}
              </Descriptions.Item>
              <Descriptions.Item label="预约日期">{formatDate(detailReservation.slotDate)}</Descriptions.Item>
              <Descriptions.Item label="预约时段">
                {formatTime(detailReservation.startTime)}-{formatTime(detailReservation.endTime)}
              </Descriptions.Item>
              <Descriptions.Item label="签到码">{detailReservation.checkinCode}</Descriptions.Item>
              <Descriptions.Item label="签到截止">{formatDateTime(detailReservation.expiresAt)}</Descriptions.Item>
              <Descriptions.Item label="签到倒计时">{renderCountdown(detailReservation)}</Descriptions.Item>
              <Descriptions.Item label="校园网检测">
                {detailReservation.status === 'CHECKED_IN'
                  ? `最近在线 ${formatDateTime(wifiHeartbeatAt[detailReservation.reservationId] ?? detailReservation.lastWifiSeenAt)}`
                  : '签到和使用中需要保持连接区域校园网'}
              </Descriptions.Item>
            </Descriptions>
          </Space>
        ) : null}
      </Modal>
    </div>
  );
}
