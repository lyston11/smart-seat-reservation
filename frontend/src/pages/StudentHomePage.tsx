import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button, Card, Empty, message, Space, Statistic, Tag, Typography } from 'antd';
import { Link } from 'react-router-dom';
import { getStoredUser } from '../api/http';
import { getReservationRules, listUserReservations } from '../api/seatSlots';
import type { ReservationResult, ReservationRule } from '../types/reservation';
import {
  formatDateTime,
  formatReservationLocation,
  formatReservationTime,
  isActiveReservation,
  reservationStatusColor,
  reservationStatusText,
} from '../utils/reservationDisplay';

export default function StudentHomePage() {
  const [reservations, setReservations] = useState<ReservationResult[]>([]);
  const [rules, setRules] = useState<ReservationRule | null>(null);
  const [loading, setLoading] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();
  const user = getStoredUser();

  const loadHomeData = useCallback(async () => {
    setLoading(true);
    try {
      const [nextReservations, nextRules] = await Promise.all([listUserReservations(20), getReservationRules()]);
      setReservations(nextReservations);
      setRules(nextRules);
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

  return (
    <div className="page">
      {contextHolder}
      <div className="student-home-hero">
        <div>
          <Typography.Title level={2}>你好，{user?.name ?? '同学'}</Typography.Title>
          <Typography.Paragraph>
            今天也给自己留一段安静的自习时间。
          </Typography.Paragraph>
        </div>
        <Space wrap>
          <Button type="primary">
            <Link to="/student/seats">去选座</Link>
          </Button>
          <Button>
            <Link to="/student/reservations">管理预约</Link>
          </Button>
        </Space>
      </div>

      <div className="student-summary-grid">
        <Card loading={loading}>
          <Statistic title="活跃预约" value={activeReservations.length} suffix="个" />
        </Card>
        <Card loading={loading}>
          <Statistic
            title="签到宽限"
            value={rules?.checkinGraceMinutes ?? 0}
            suffix="分钟"
          />
        </Card>
        <Card loading={loading}>
          <Statistic title="最多提前" value={rules?.maxAdvanceDays ?? 0} suffix="天" />
        </Card>
      </div>

      <div className="student-section">
        <div className="seat-map-section-header">
          <strong>当前预约</strong>
          <span>待签到 / 使用中</span>
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
                    <Typography.Text strong>{formatReservationTime(reservation)}</Typography.Text>
                  </Space>
                  <Typography.Text>{formatReservationLocation(reservation)}</Typography.Text>
                  <Typography.Text type="secondary">
                    签到码 {reservation.checkinCode} · 截止 {formatDateTime(reservation.expiresAt)}
                  </Typography.Text>
                  <Button>
                    <Link to="/student/reservations">处理预约</Link>
                  </Button>
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
    </div>
  );
}
