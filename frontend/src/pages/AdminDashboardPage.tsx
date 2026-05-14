import { useEffect, useMemo, useState } from 'react';
import { Card, DatePicker, List, message, Progress, Statistic } from 'antd';
import dayjs from 'dayjs';
import { getDashboard } from '../api/dashboard';
import type { DashboardData } from '../types/dashboard';

export default function AdminDashboardPage() {
  const [date, setDate] = useState(dayjs());
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();

  const dateText = useMemo(() => date.format('YYYY-MM-DD'), [date]);

  async function loadDashboard(nextDate = dateText) {
    setLoading(true);
    try {
      setData(await getDashboard(nextDate));
    } catch (error) {
      messageApi.error(error instanceof Error ? error.message : '加载看板失败');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadDashboard();
  }, []);

  const summary = data?.summary;

  return (
    <div className="page">
      {contextHolder}
      <div className="toolbar">
        <DatePicker
          value={date}
          onChange={(value) => {
            const nextDate = value ?? dayjs();
            setDate(nextDate);
            void loadDashboard(nextDate.format('YYYY-MM-DD'));
          }}
        />
      </div>

      <div className="stats-grid">
        <Card loading={loading}>
          <Statistic title="总时段" value={summary?.totalSlots ?? 0} />
        </Card>
        <Card loading={loading}>
          <Statistic title="空闲" value={summary?.availableSlots ?? 0} />
        </Card>
        <Card loading={loading}>
          <Statistic title="已预约" value={summary?.reservedSlots ?? 0} />
        </Card>
        <Card loading={loading}>
          <Statistic title="使用中" value={summary?.usingSlots ?? 0} />
        </Card>
      </div>

      <Card title="区域利用率" loading={loading}>
        <List
          dataSource={data?.areaUsage ?? []}
          renderItem={(item) => (
            <List.Item>
              <div className="usage-row">
                <div>
                  <strong>{item.areaName}</strong>
                  <span>{item.reservedSlots + item.usingSlots}/{item.totalSlots} 使用中或已预约</span>
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
