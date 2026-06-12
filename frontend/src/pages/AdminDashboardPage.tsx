import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button, Card, DatePicker, message, Progress, Space, Statistic, Tag, Typography } from 'antd';
import {
  Activity,
  AlertTriangle,
  Armchair,
  CalendarDays,
  CircleCheck,
  Clock3,
  Gauge,
  ListChecks,
  MapPinned,
  RotateCw,
  ShieldAlert,
  TrendingUp,
  Users,
} from 'lucide-react';
import dayjs from 'dayjs';
import { releaseExpiredSeatLocks } from '../api/adminReservations';
import { getDashboard } from '../api/dashboard';
import { getReservationRules } from '../api/reservationRules';
import type { DashboardData } from '../types/dashboard';
import { formatConnectorAreaNameText } from '../utils/campusConnectors';
import { normalizeReservationRules, type NormalizedReservationRule } from '../utils/reservationRules';

function getUsageLevel(rate: number) {
  if (rate >= 0.8) {
    return { label: '高', className: 'admin-usage-level-high', color: 'red' };
  }
  if (rate >= 0.5) {
    return { label: '中', className: 'admin-usage-level-medium', color: 'orange' };
  }
  return { label: '低', className: 'admin-usage-level-low', color: 'green' };
}

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
  const anomalyCount = summary?.abnormalSlots ?? 0;
  const reservedCount = summary?.reservedSlots ?? 0;
  const usingCount = summary?.usingSlots ?? 0;
  const availableCount = summary?.availableSlots ?? 0;
  const sortedAreaUsage = useMemo(
    () => [...(data?.areaUsage ?? [])].sort((left, right) => right.usageRate - left.usageRate),
    [data?.areaUsage],
  );
  const topArea = sortedAreaUsage[0] ?? null;
  const topAreaRate = topArea ? Math.round(topArea.usageRate * 100) : 0;
  const commandRecommendation = (() => {
    if (anomalyCount > 0) {
      return {
        tone: 'danger',
        title: '优先核验异常占用',
        description: `当前有 ${anomalyCount} 个异常座位，建议先到座位图定位桌座，再按现场情况释放。`,
      };
    }
    if (occupiedRate >= 80) {
      return {
        tone: 'warning',
        title: '关注高峰分流',
        description: '整体占用率偏高，建议检查热门连廊是否需要开放更多时段或引导学生选择低占用区域。',
      };
    }
    if (reservedCount > usingCount) {
      return {
        tone: 'notice',
        title: '关注待签到释放',
        description: '待签到数量高于使用中数量，可在签到宽限时间后刷新看板并释放超时未到座预约。',
      };
    }
    return {
      tone: 'stable',
      title: '运行平稳',
      description: '当前状态流正常，保持定时巡检异常占用和过期锁位即可。',
    };
  })();
  const statusFlow = [
    { label: '空闲', value: availableCount, description: '可继续预约', tone: 'green' },
    { label: '待签到', value: reservedCount, description: '等待学生到场', tone: 'blue' },
    { label: '使用中', value: usingCount, description: '已扫码签到', tone: 'cyan' },
    { label: '异常', value: anomalyCount, description: '需人工核验', tone: 'red' },
  ];

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
    <div className="page admin-dashboard-page">
      {contextHolder}
      <div className="admin-workbench-hero">
        <div>
          <span className="student-workbench-eyebrow">管理员运营工作台</span>
          <Typography.Title level={3}>管理员运营工作台</Typography.Title>
          <Typography.Paragraph>按日期查看公共区域座位使用、异常占用和锁位释放。</Typography.Paragraph>
        </div>
        <div className="admin-workbench-controls">
          <DatePicker
            value={date}
            onChange={(value) => {
              const nextDate = value ?? dayjs();
              setDate(nextDate);
              void loadDashboard(nextDate.format('YYYY-MM-DD'));
            }}
          />
          <Button loading={loading} icon={<RotateCw size={16} />} onClick={() => loadDashboard()}>
            刷新看板
          </Button>
        </div>
      </div>

      <section className="admin-command-panel" aria-label="运营指挥">
        <div className="admin-command-header">
          <div>
            <span className="admin-command-kicker">
              <Activity size={15} />
              运营指挥
            </span>
            <Typography.Title level={4}>今日座位运行态势</Typography.Title>
          </div>
          <Tag color={commandRecommendation.tone === 'danger' ? 'red' : commandRecommendation.tone === 'warning' ? 'orange' : 'blue'}>
            {data?.date ?? dateText}
          </Tag>
        </div>

        <div className="admin-command-grid">
          <div className="admin-command-meter">
            <Gauge size={18} />
            <div>
              <span>实时占用</span>
              <strong>{occupiedRate}%</strong>
              <Typography.Text type="secondary">{occupiedSlots}/{totalSlots} 个时段已被占用</Typography.Text>
            </div>
          </div>

          <div className="admin-command-meter admin-command-meter-area">
            <MapPinned size={18} />
            <div>
              <span>高利用区域</span>
              <strong>{topArea ? formatConnectorAreaNameText(topArea.areaName) : '暂无区域数据'}</strong>
              <Typography.Text type="secondary">
                {topArea ? `当前利用率 ${topAreaRate}%` : '发布开放时段后会显示重点区域'}
              </Typography.Text>
            </div>
          </div>

          <div className={`admin-command-advice admin-command-advice-${commandRecommendation.tone}`}>
            <ListChecks size={18} />
            <div>
              <span>处理建议</span>
              <strong>{commandRecommendation.title}</strong>
              <Typography.Text>{commandRecommendation.description}</Typography.Text>
            </div>
          </div>
        </div>
      </section>

      <div className="admin-workbench-stats" aria-label="运行概览">
        <Card loading={loading} className="admin-workbench-stat-card">
          <Statistic title="总时段" value={summary?.totalSlots ?? 0} prefix={<Clock3 size={16} />} />
        </Card>
        <Card loading={loading} className="admin-workbench-stat-card admin-workbench-stat-card-green">
          <Statistic title="空闲座位" value={summary?.availableSlots ?? 0} prefix={<Armchair size={16} />} />
        </Card>
        <Card loading={loading} className="admin-workbench-stat-card admin-workbench-stat-card-blue">
          <Statistic title="活跃预约" value={summary?.activeReservations ?? 0} prefix={<Users size={16} />} />
        </Card>
        <Card loading={loading} className="admin-workbench-stat-card admin-workbench-stat-card-cyan">
          <Statistic title="已签到人数" value={summary?.checkedInReservations ?? 0} prefix={<CircleCheck size={16} />} />
        </Card>
        <Card loading={loading} className="admin-workbench-stat-card admin-workbench-stat-card-red">
          <Statistic title="异常占用" value={anomalyCount} prefix={<ShieldAlert size={16} />} />
        </Card>
        <Card loading={loading} className="admin-workbench-stat-card">
          <Statistic title="待签到" value={reservedCount} prefix={<CalendarDays size={16} />} />
        </Card>
        <Card loading={loading} className="admin-workbench-stat-card">
          <Statistic title="使用中" value={usingCount} prefix={<Users size={16} />} />
        </Card>
        <Card loading={loading} className="admin-workbench-stat-card admin-workbench-stat-card-strong">
          <Statistic title="整体占用率" value={occupiedRate} suffix="%" prefix={<Armchair size={16} />} />
        </Card>
      </div>

      <div className="admin-workbench-layout">
        <main className="admin-workbench-main">
          <section className="admin-status-flow" aria-label="状态流">
            <div className="admin-section-heading">
              <div>
                <span className="admin-section-kicker">
                  <TrendingUp size={15} />
                  状态流
                </span>
                <Typography.Title level={4}>预约到使用的实时分布</Typography.Title>
              </div>
              <Typography.Text type="secondary">按座位时段汇总，帮助判断需要释放、巡检或补充开放的位置。</Typography.Text>
            </div>
            <div className="admin-status-flow-grid">
              {statusFlow.map((item) => (
                <div className={`admin-status-flow-item admin-status-flow-item-${item.tone}`} key={item.label}>
                  <span>{item.label}</span>
                  <strong>{item.value}</strong>
                  <small>{item.description}</small>
                </div>
              ))}
            </div>
          </section>

          <Card title="区域利用率" loading={loading} className="admin-workbench-card">
            {sortedAreaUsage.length > 0 ? (
              <div className="admin-usage-list">
                {sortedAreaUsage.map((item) => {
                  const usagePercent = Math.round(item.usageRate * 100);
                  const usageLevel = getUsageLevel(item.usageRate);
                  return (
                    <div className={`usage-row admin-usage-row ${usageLevel.className}`} key={item.areaId}>
                      <div>
                        <div className="admin-usage-row-title">
                          <strong>{formatConnectorAreaNameText(item.areaName)}</strong>
                          <Tag color={usageLevel.color}>{usageLevel.label}利用</Tag>
                        </div>
                        <span>{item.reservedSlots + item.usingSlots}/{item.totalSlots} 使用中或已预约</span>
                        <div className="usage-tags">
                          <Tag color="blue">预约 {item.reservedSlots}</Tag>
                          <Tag color="orange">签到 {item.usingSlots}</Tag>
                          <Tag color="red">异常 {item.abnormalSlots}</Tag>
                        </div>
                      </div>
                      <Progress percent={usagePercent} status={usagePercent >= 80 ? 'exception' : 'normal'} />
                    </div>
                  );
                })}
              </div>
            ) : (
              <Typography.Text type="secondary">暂无区域利用率数据</Typography.Text>
            )}
          </Card>
        </main>

        <aside className="admin-workbench-aside">
          <div className="admin-anomaly-panel" aria-label="异常处理">
            <div className="admin-panel-title">
              <AlertTriangle size={17} />
              <strong>异常处理</strong>
            </div>
            <div className="admin-anomaly-number">{anomalyCount}</div>
            <Typography.Text type="secondary">
              异常占用需要管理员结合现场反馈和座位图确认后处理。
            </Typography.Text>
            <div className="admin-anomaly-grid">
              <div>
                <span>待签到</span>
                <strong>{reservedCount}</strong>
              </div>
              <div>
                <span>使用中</span>
                <strong>{usingCount}</strong>
              </div>
            </div>
          </div>

          <Card
            title="锁位运维"
            loading={loading}
            className="admin-seat-lock-card admin-workbench-card"
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
        </aside>
      </div>
    </div>
  );
}
