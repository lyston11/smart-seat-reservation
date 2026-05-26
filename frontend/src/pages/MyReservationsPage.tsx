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
  lockReservationSeat,
  reactivateSeatLock,
  releaseSeatLock,
} from '../api/reservations';
import type { ReservationResult } from '../types/reservation';
import {
  canCancelReservation,
  canCheckInReservation,
  canCheckOutReservation,
  canLockReservation,
  canReactivateSeatLock,
  canReleaseSeatLock,
  filterReservations,
  formatDate,
  formatDateTime,
  formatReservationLocation,
  formatReservationTime,
  formatTime,
  getCheckinCountdown,
  getSeatLockHelpText,
  getSeatLockStatusText,
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

  async function runAction(
    reservation: ReservationResult,
    action: 'check-in' | 'check-out' | 'cancel' | 'lock' | 'reactivate-lock' | 'release-lock',
  ) {
    setActionId(reservation.reservationId);
    try {
      if (action === 'check-in') {
        await checkInReservation(reservation.reservationId, {
          checkinCode: checkinCodes[reservation.reservationId] ?? reservation.checkinCode,
        });
      } else if (action === 'check-out') {
        await checkOutReservation(reservation.reservationId);
      } else if (action === 'cancel') {
        await cancelReservation(reservation.reservationId);
      } else if (action === 'lock') {
        await lockReservationSeat(reservation.reservationId);
      } else if (action === 'reactivate-lock') {
        await reactivateSeatLock(reservation.reservationId, {
          checkinCode: checkinCodes[reservation.reservationId] ?? reservation.checkinCode,
        });
      } else {
        await releaseSeatLock(reservation.reservationId);
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
  const lockedCount = reservations.filter((reservation) => reservation.status === 'LOCKED').length;
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
          开发测试签到
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
        <Button
          disabled={!canLockReservation(reservation)}
          loading={actionId === reservation.reservationId}
          onClick={() => runAction(reservation, 'lock')}
        >
          锁位
        </Button>
        <Button
          type="primary"
          disabled={!canReactivateSeatLock(reservation)}
          loading={actionId === reservation.reservationId}
          onClick={() => runAction(reservation, 'reactivate-lock')}
        >
          开发测试恢复
        </Button>
        <Popconfirm
          title="释放锁位"
          description="释放后该座位会开放给其他同学。"
          okText="释放座位"
          cancelText="返回"
          onConfirm={() => runAction(reservation, 'release-lock')}
        >
          <Button
            danger
            disabled={!canReleaseSeatLock(reservation)}
            loading={actionId === reservation.reservationId}
          >
            释放锁位
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
      title: '锁位',
      width: 220,
      render: (_, record) => {
        const quota = record.seatLockQuota ?? 0;
        const usedCount = record.seatLockUsedCount ?? 0;
        return (
          <Space orientation="vertical" size={4}>
            <Space wrap size={6}>
              <Tag color={canLockReservation(record) ? 'green' : record.status === 'LOCKED' ? 'gold' : 'default'}>
                {getSeatLockStatusText(record)}
              </Tag>
              <Typography.Text>{usedCount}/{quota}</Typography.Text>
            </Space>
            <Typography.Text type="secondary">{getSeatLockHelpText(record)}</Typography.Text>
            {record.lockedUntilAt ? (
              <Typography.Text type="secondary">{formatDateTime(record.lockedUntilAt)}</Typography.Text>
            ) : null}
          </Space>
        );
      },
    },
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
    <div className="page student-reservations-page">
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
        <Card>
          <Statistic title="锁位中" value={lockedCount} suffix="个" />
        </Card>
      </div>

      <div className="student-section">
        <div className="seat-map-section-header">
          <strong>当前可操作预约</strong>
          <span>扫码签到 / 开发测试 / 签退 / 锁位</span>
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
                      WiFi 在线检测 {formatDateTime(reservation.lastWifiSeenAt)}
                    </Typography.Text>
                  ) : null}
                  {reservation.status === 'LOCKED' ? (
                    <Typography.Text type="secondary">
                      已锁位至 {formatDateTime(reservation.lockedUntilAt)}，可扫码座位码恢复使用。
                    </Typography.Text>
                  ) : null}
                  {reservation.status === 'RESERVED' || reservation.status === 'LOCKED' ? (
                    <Typography.Text type="secondary" className="reservation-qr-checkin-hint">
                      正式流程请扫描桌面/座位二维码；下方入口仅用于开发测试，仍会校验校园网 IP 和签到时间窗。
                    </Typography.Text>
                  ) : null}
                  <div className="seat-lock-status-box">
                    <Space wrap>
                      <Tag color={canLockReservation(reservation) ? 'green' : reservation.status === 'LOCKED' ? 'gold' : 'default'}>
                        {getSeatLockStatusText(reservation)}
                      </Tag>
                      <Typography.Text type="secondary">
                        锁位次数 {reservation.seatLockUsedCount ?? 0}/{reservation.seatLockQuota ?? 0}
                      </Typography.Text>
                    </Space>
                    <Typography.Text type="secondary">{getSeatLockHelpText(reservation)}</Typography.Text>
                  </div>
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
              <Descriptions.Item label="锁位次数">
                {detailReservation.seatLockUsedCount ?? 0}/{detailReservation.seatLockQuota ?? 0}
              </Descriptions.Item>
              <Descriptions.Item label="锁位状态">
                <Space orientation="vertical" size={4}>
                  <Tag
                    color={
                      canLockReservation(detailReservation)
                        ? 'green'
                        : detailReservation.status === 'LOCKED'
                          ? 'gold'
                          : 'default'
                    }
                  >
                    {getSeatLockStatusText(detailReservation)}
                  </Tag>
                  <Typography.Text type="secondary">{getSeatLockHelpText(detailReservation)}</Typography.Text>
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="锁位截止">
                {formatDateTime(detailReservation.lockedUntilAt)}
              </Descriptions.Item>
              <Descriptions.Item label="校园网检测">
                {detailReservation.status === 'CHECKED_IN'
                  ? `最近在线 ${formatDateTime(detailReservation.lastWifiSeenAt)}`
                  : detailReservation.status === 'LOCKED'
                    ? '锁位期间暂停 WiFi 离线释放，超时或预约结束会自动释放'
                  : '签到和使用中需要保持连接区域校园网'}
              </Descriptions.Item>
            </Descriptions>
          </Space>
        ) : null}
      </Modal>
    </div>
  );
}
