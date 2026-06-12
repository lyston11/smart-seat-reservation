import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button, Card, Empty, message, Space, Statistic, Tag, Typography } from 'antd';
import { CalendarCheck, Clock3, LockKeyhole, MapPinned, RotateCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getStoredUser } from '../api/http';
import {
  checkInReservation,
  checkOutReservation,
  listUserReservations,
  lockReservationSeat,
  reactivateSeatLock,
  releaseSeatLock,
} from '../api/reservations';
import { getReservationRules } from '../api/reservationRules';
import type { ReservationResult } from '../types/reservation';
import {
  canCheckInReservation,
  canCheckOutReservation,
  canLockReservation,
  canReactivateSeatLock,
  canReleaseSeatLock,
  compareReservationsByStartTime,
  formatDateTime,
  formatReservationLocation,
  formatReservationTime,
  formatTime,
  getCheckinCountdown,
  getRemainingSeatLockCount,
  getSeatLockHelpText,
  getSeatLockStatusText,
  isActiveReservation,
  isTodayReservation,
  reservationStatusColor,
  reservationStatusText,
} from '../utils/reservationDisplay';
import { normalizeReservationRules, type NormalizedReservationRule } from '../utils/reservationRules';

export default function StudentHomePage() {
  const [reservations, setReservations] = useState<ReservationResult[]>([]);
  const [rules, setRules] = useState<NormalizedReservationRule | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionId, setActionId] = useState<number | null>(null);
  const [messageApi, contextHolder] = message.useMessage();
  const user = getStoredUser();

  const loadHomeData = useCallback(async () => {
    setLoading(true);
    try {
      const [nextReservations, nextRules] = await Promise.all([listUserReservations(20), getReservationRules()]);
      setReservations(nextReservations);
      setRules(normalizeReservationRules(nextRules));
    } catch (error) {
      messageApi.error(error instanceof Error ? error.message : '加载学生首页失败');
    } finally {
      setLoading(false);
    }
  }, [messageApi]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadHomeData();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadHomeData]);

  const activeReservations = useMemo(() => reservations.filter(isActiveReservation), [reservations]);
  const latestReservations = useMemo(() => reservations.slice(0, 5), [reservations]);
  const todayReservations = useMemo(
    () => reservations.filter((reservation) => isTodayReservation(reservation)).sort(compareReservationsByStartTime),
    [reservations],
  );
  const recentAreas = useMemo(() => {
    const areaCounts = new Map<string, number>();
    reservations.forEach((reservation) => {
      if (!reservation.areaName) {
        return;
      }
      const key = `${reservation.areaName}${reservation.floor ? ` · ${reservation.floor}` : ''}`;
      areaCounts.set(key, (areaCounts.get(key) ?? 0) + 1);
    });
    return Array.from(areaCounts.entries())
      .sort((left, right) => right[1] - left[1])
      .slice(0, 3);
  }, [reservations]);

  async function runQuickAction(
    reservation: ReservationResult,
    action: 'check-in' | 'check-out' | 'lock' | 'reactivate-lock' | 'release-lock',
  ) {
    setActionId(reservation.reservationId);
    try {
      if (action === 'check-in') {
        await checkInReservation(reservation.reservationId, { checkinCode: reservation.checkinCode });
      } else if (action === 'check-out') {
        await checkOutReservation(reservation.reservationId);
      } else if (action === 'lock') {
        await lockReservationSeat(reservation.reservationId);
      } else if (action === 'reactivate-lock') {
        await reactivateSeatLock(reservation.reservationId, { checkinCode: reservation.checkinCode });
      } else {
        await releaseSeatLock(reservation.reservationId);
      }
      messageApi.success('操作成功');
      await loadHomeData();
    } catch (error) {
      messageApi.error(error instanceof Error ? error.message : '操作失败');
    } finally {
      setActionId(null);
    }
  }

  function renderCountdown(reservation: ReservationResult) {
    const countdown = getCheckinCountdown(reservation);
    if (!countdown) {
      return null;
    }
    return (
      <Tag color={countdown.urgent ? 'red' : 'blue'} className="reservation-countdown-tag">
        {countdown.text}
      </Tag>
    );
  }

  function renderQuickActions(reservation: ReservationResult) {
    if (canCheckInReservation(reservation)) {
      return (
        <Button
          type="primary"
          loading={actionId === reservation.reservationId}
          onClick={() => runQuickAction(reservation, 'check-in')}
        >
          开发测试签到
        </Button>
      );
    }
    if (canCheckOutReservation(reservation)) {
      return (
        <>
          <Button
            type="primary"
            disabled={!canLockReservation(reservation)}
            loading={actionId === reservation.reservationId}
            onClick={() => runQuickAction(reservation, 'lock')}
          >
            锁位
          </Button>
          <Button
            loading={actionId === reservation.reservationId}
            onClick={() => runQuickAction(reservation, 'check-out')}
          >
            快速签退
          </Button>
        </>
      );
    }
    if (canReactivateSeatLock(reservation)) {
      return (
        <>
          <Button
            type="primary"
            loading={actionId === reservation.reservationId}
            onClick={() => runQuickAction(reservation, 'reactivate-lock')}
          >
            开发测试恢复
          </Button>
          <Button
            danger
            disabled={!canReleaseSeatLock(reservation)}
            loading={actionId === reservation.reservationId}
            onClick={() => runQuickAction(reservation, 'release-lock')}
          >
            释放锁位
          </Button>
        </>
      );
    }
    return null;
  }

  const seatLockQuotaTotal = activeReservations.reduce(
    (total, reservation) => total + (reservation.seatLockQuota ?? 0),
    0,
  );
  const remainingSeatLockTotal = activeReservations.reduce(
    (total, reservation) => total + getRemainingSeatLockCount(reservation),
    0,
  );
  const nextTodayReservation = todayReservations[0];

  return (
    <div className="page student-home-page">
      {contextHolder}
      <div className="student-home-hero">
        <div>
          <span className="student-workbench-eyebrow">学生预约工作台</span>
          <Typography.Title level={3}>学生预约工作台</Typography.Title>
          <Typography.Paragraph>
            先看今天状态，再选择座位或处理签到。
          </Typography.Paragraph>
          <Typography.Text type="secondary">你好，{user?.name ?? '同学'}，当前页面会聚合预约、签到和锁位状态。</Typography.Text>
        </div>
        <div className="student-quick-actions" aria-label="快捷入口">
          <Button type="primary" icon={<MapPinned size={16} />}>
            <Link to="/student/seats">去选座</Link>
          </Button>
          <Button icon={<CalendarCheck size={16} />}>
            <Link to="/student/reservations">管理预约</Link>
          </Button>
          <Button loading={loading} icon={<RotateCw size={16} />} onClick={() => loadHomeData()}>
            刷新状态
          </Button>
        </div>
      </div>

      <div className="student-summary-grid student-workbench-status-grid" aria-label="今日状态">
        <Card loading={loading}>
          <Statistic title="活跃预约" value={activeReservations.length} suffix="个" prefix={<CalendarCheck size={16} />} />
        </Card>
        <Card loading={loading}>
          <Statistic
            title="签到宽限"
            value={rules?.checkinGraceMinutes ?? 0}
            suffix="分钟"
            prefix={<Clock3 size={16} />}
          />
        </Card>
        <Card loading={loading}>
          <Statistic title="开放明日预约" value={rules?.reservationOpenHour ?? 0} suffix="点" prefix={<MapPinned size={16} />} />
        </Card>
        <Card loading={loading}>
          <Statistic title="可锁位次数" value={remainingSeatLockTotal} suffix={`/ ${seatLockQuotaTotal}`} prefix={<LockKeyhole size={16} />} />
        </Card>
      </div>

      <div className="student-workbench-layout" aria-label="学生首页主内容">
        <main className="student-workbench-main">
          <div className="student-section student-section-primary">
            <div className="seat-map-section-header">
              <strong>当前预约</strong>
              <span>{activeReservations.length > 0 ? '优先处理待签到 / 使用中预约' : '当前没有需要处理的预约'}</span>
            </div>
            {activeReservations.length > 0 ? (
              <div className="student-card-grid">
                {activeReservations.map((reservation) => (
                  <Card className="reservation-card student-reservation-card" key={reservation.reservationId}>
                    <Space orientation="vertical" size={10} className="reservation-card-stack">
                      <Space wrap>
                        <Tag color={reservationStatusColor[reservation.status] ?? 'default'}>
                          {reservationStatusText[reservation.status] ?? reservation.status}
                        </Tag>
                        {renderCountdown(reservation)}
                      </Space>
                      <Typography.Text strong>{formatReservationLocation(reservation)}</Typography.Text>
                      <Typography.Text type="secondary">{formatReservationTime(reservation)}</Typography.Text>
                      <Typography.Text type="secondary">
                        签到码 {reservation.checkinCode} · 截止 {formatDateTime(reservation.expiresAt)}
                      </Typography.Text>
                      {reservation.status === 'RESERVED' || reservation.status === 'LOCKED' ? (
                        <Typography.Text type="secondary" className="reservation-qr-checkin-hint">
                          正式签到请扫描桌面/座位二维码，测试按钮仍会校验校园网 IP。
                        </Typography.Text>
                      ) : null}
                      <div className="seat-lock-status-box">
                        <Space wrap>
                          <Tag color={canLockReservation(reservation) ? 'green' : reservation.status === 'LOCKED' ? 'gold' : 'default'}>
                            {getSeatLockStatusText(reservation)}
                          </Tag>
                          <Typography.Text type="secondary">
                            {reservation.seatLockUsedCount ?? 0}/{reservation.seatLockQuota ?? 0}
                          </Typography.Text>
                        </Space>
                        <Typography.Text type="secondary">{getSeatLockHelpText(reservation)}</Typography.Text>
                      </div>
                      <Space wrap>
                        {renderQuickActions(reservation)}
                        <Button>
                          <Link to="/student/reservations">处理预约</Link>
                        </Button>
                      </Space>
                    </Space>
                  </Card>
                ))}
              </div>
            ) : (
              <Empty description="暂无活跃预约，可以先去选座" />
            )}
          </div>

          <div className="student-section">
            <div className="seat-map-section-header">
              <strong>今日预约时间线</strong>
              <span>{nextTodayReservation ? `下一段 ${formatTime(nextTodayReservation.startTime)}` : '按开始时间排序'}</span>
            </div>
            {todayReservations.length > 0 ? (
              <div className="student-timeline">
                {todayReservations.map((reservation) => (
                  <div className="student-timeline-item" key={reservation.reservationId}>
                    <div className="student-timeline-time">
                      {formatTime(reservation.startTime)}
                      <span>{formatTime(reservation.endTime)}</span>
                    </div>
                    <div className="student-timeline-content">
                      <Space wrap>
                        <Tag color={reservationStatusColor[reservation.status] ?? 'default'}>
                          {reservationStatusText[reservation.status] ?? reservation.status}
                        </Tag>
                        {renderCountdown(reservation)}
                      </Space>
                      <Typography.Text strong>{formatReservationLocation(reservation)}</Typography.Text>
                      <Typography.Text type="secondary">{getSeatLockStatusText(reservation)}</Typography.Text>
                    </div>
                    <div className="student-timeline-action">
                      <Space wrap>{renderQuickActions(reservation)}</Space>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <Empty description="今天暂无预约" />
            )}
          </div>
        </main>

        <aside className="student-workbench-aside">
          <div className="student-seat-lock-panel student-workbench-side-panel">
            <div>
              <Typography.Text strong>锁位权益</Typography.Text>
              <Typography.Text type="secondary">
                单次 {rules?.seatLockMinutes ?? 0} 分钟，跨 12:00 生成 1 次，跨 18:00 再生成 1 次
              </Typography.Text>
            </div>
            <Tag color={remainingSeatLockTotal > 0 ? 'green' : 'default'}>
              当前剩余 {remainingSeatLockTotal} 次
            </Tag>
          </div>

          <div className="student-section student-side-section">
            <div className="seat-map-section-header">
              <strong>最近常用区域</strong>
              <span>按预约次数统计</span>
            </div>
            {recentAreas.length > 0 ? (
              <div className="student-area-list">
                {recentAreas.map(([area, count]) => (
                  <div className="student-area-item" key={area}>
                    <Typography.Text strong>{area}</Typography.Text>
                    <Tag>{count} 次</Tag>
                  </div>
                ))}
              </div>
            ) : (
              <Empty description="暂无常用区域" />
            )}
          </div>

          <div className="student-section student-side-section">
            <div className="seat-map-section-header">
              <strong>最近预约记录</strong>
              <span>最近 5 条</span>
            </div>
            {loading ? (
              <Typography.Text type="secondary">加载中...</Typography.Text>
            ) : latestReservations.length > 0 ? (
              <div className="student-record-list">
                {latestReservations.map((reservation) => (
                  <div className="student-record-item" key={reservation.reservationId}>
                    <div>
                      <Typography.Text strong>{formatReservationLocation(reservation)}</Typography.Text>
                      <Typography.Text type="secondary">{formatReservationTime(reservation)}</Typography.Text>
                    </div>
                    <Tag color={reservationStatusColor[reservation.status] ?? 'default'}>
                      {reservationStatusText[reservation.status] ?? reservation.status}
                    </Tag>
                  </div>
                ))}
              </div>
            ) : (
              <Empty description="暂无预约记录" />
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
