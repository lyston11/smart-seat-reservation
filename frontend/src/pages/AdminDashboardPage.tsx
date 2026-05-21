import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button, Card, DatePicker, List, message, Progress, Space, Statistic, Tag, Typography } from 'antd';
import dayjs from 'dayjs';
import { releaseExpiredSeatLocks } from '../api/adminReservations';
import { getDashboard } from '../api/dashboard';
import { getReservationRules } from '../api/reservationRules';
import type { DashboardData } from '../types/dashboard';
import { normalizeReservationRules, type NormalizedReservationRule } from '../utils/reservationRules';

export default function AdminDashboardPage() {
  const [date, setDate] = useState(dayjs());
  const [data, setData] = useState<DashboardData | null>(null);
  const [rules, setRules] = useState<NormalizedReservationRule | null>(null);
  const [loading, setLoading] = useState(false);
  const [releasingLocks, setReleasingLocks] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();

  const dateText = useMemo(() => date.format('YYYY-MM-DD'), [date]);

  const loadDashboard = useCallback(async (nextDate = dateText) => {
    setLoading(true);
    try {
      const [nextDashboard, nextRules] = await Promise.all([getDashboard(nextDate), getReservationRules()]);
      setData(nextDashboard);
      setRules(normalizeReservationRules(nextRules));
    } catch (error) {
      messageApi.error(error instanceof Error ? error.message : '加载看板失败');
    } finally {
      setLoading(false);
    }
  }, [dateText, messageApi]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadDashboard();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadDashboard]);

  const summary = data?.summary;
  const occupiedSlots = (summary?.reservedSlots ?? 0) + (summary?.usingSlots ?? 0);
  const totalSlots = summary?.totalSlots ?? 0;
  const occupiedRate = totalSlots > 0 ? Math.round((occupiedSlots / totalSlots) * 100) : 0;

  async function handleReleaseExpiredSeatLocks() {
    setReleasingLocks(true);
    try {
      const releasedCount = await releaseExpiredSeatLocks();
      messageApi.success(`已释放 ${releasedCount} 个过期锁位`);
      await loadDashboard();
    } catch (error) {
      messageApi.error(error instanceof Error ? error.message : '释放过期锁位失败');
    } finally {
      setReleasingLocks(false);
    }
  }

  return (
    <div className="page">
      {contextHolder}
      <div className="toolbar">
        <Space wrap>
          <DatePicker
            value={date}
            onChange={(value) => {
              const nextDate = value ?? dayjs();
              setDate(nextDate);
              void loadDashboard(nextDate.format('YYYY-MM-DD'));
            }}
          />
          <Button loading={loading} onClick={() => loadDashboard()}>
            刷新看板
          </Button>
        </Space>
      </div>

      <div className="stats-grid">
        <Card loading={loading}>
          <Statistic title="总时段" value={summary?.totalSlots ?? 0} />
        </Card>
        <Card loading={loading}>
          <Statistic title="空闲座位" value={summary?.availableSlots ?? 0} />
        </Card>
        <Card loading={loading}>
          <Statistic title="活跃预约" value={summary?.activeReservations ?? 0} />
        </Card>
        <Card loading={loading}>
          <Statistic title="已签到人数" value={summary?.checkedInReservations ?? 0} />
        </Card>
        <Card loading={loading}>
          <Statistic title="异常占用" value={summary?.abnormalSlots ?? 0} valueStyle={{ color: '#b91c1c' }} />
        </Card>
        <Card loading={loading}>
          <Statistic title="待签到" value={summary?.reservedSlots ?? 0} />
        </Card>
        <Card loading={loading}>
          <Statistic title="使用中" value={summary?.usingSlots ?? 0} />
        </Card>
        <Card loading={loading}>
          <Statistic title="整体占用率" value={occupiedRate} suffix="%" />
        </Card>
      </div>

      <Card
        title="锁位运维"
        loading={loading}
        className="admin-seat-lock-card"
        extra={
          <Button
            type="primary"
            loading={releasingLocks}
            onClick={handleReleaseExpiredSeatLocks}
          >
            释放过期锁位
          </Button>
        }
      >
        <div className="admin-seat-lock-content">
          <div>
            <Typography.Text strong>锁位规则</Typography.Text>
            <Typography.Text type="secondary">
              只有使用中的连续跨时段预约能锁位；跨 12:00 获得 1 次，跨 18:00 再获得 1 次，分开预约不合并计算。
            </Typography.Text>
          </div>
          <Space wrap>
            <Tag color="blue">单次 {rules?.seatLockMinutes ?? 0} 分钟</Tag>
            <Tag color="orange">锁位中暂停 WiFi 离线释放</Tag>
            <Tag color="red">到期或预约结束强制释放</Tag>
          </Space>
        </div>
      </Card>

      <Card title="区域利用率排行榜" loading={loading}>
        <List
          dataSource={data?.areaUsage ?? []}
          renderItem={(item) => (
            <List.Item>
              <div className="usage-row">
                <div>
                  <strong>{item.areaName}</strong>
                  <span>{item.reservedSlots + item.usingSlots}/{item.totalSlots} 使用中或已预约</span>
                  <div className="usage-tags">
                    <Tag color="blue">预约 {item.reservedSlots}</Tag>
                    <Tag color="orange">签到 {item.usingSlots}</Tag>
                    <Tag color="red">异常 {item.abnormalSlots}</Tag>
                  </div>
                </div>
                <Progress percent={Math.round(item.usageRate * 100)} />
              </div>
            </List.Item>
          )}
        />
      </Card>
    </div>
  );
}
