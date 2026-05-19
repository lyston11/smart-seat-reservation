import { useCallback, useEffect, useState } from 'react';
import { Button, Card, Form, InputNumber, message, Space, Statistic, Typography } from 'antd';
import { getReservationRules, updateReservationRules } from '../api/seatSlots';
import {
  normalizeReservationRules,
  type NormalizedReservationRule,
  type ReservationRuleValues,
} from '../utils/reservationRules';

type ReservationRuleFormValues = ReservationRuleValues;

export default function AdminReservationRulesPage() {
  const [form] = Form.useForm<ReservationRuleFormValues>();
  const [rules, setRules] = useState<NormalizedReservationRule | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();

  const loadRules = useCallback(async () => {
    setLoading(true);
    try {
      const nextRules = normalizeReservationRules(await getReservationRules());
      setRules(nextRules);
      form.setFieldsValue({
        checkinGraceMinutes: nextRules.checkinGraceMinutes,
        checkinLeadMinutes: nextRules.checkinLeadMinutes,
        maxAdvanceDays: nextRules.maxAdvanceDays,
        reservationOpenHour: nextRules.reservationOpenHour,
        dailyActiveReservationLimit: nextRules.dailyActiveReservationLimit,
        wifiOfflineReleaseMinutes: nextRules.wifiOfflineReleaseMinutes,
        seatLockMinutes: nextRules.seatLockMinutes,
      });
    } catch (error) {
      messageApi.error(error instanceof Error ? error.message : '加载预约规则失败');
    } finally {
      setLoading(false);
    }
  }, [form, messageApi]);

  async function saveRules() {
    const values = await form.validateFields();
    setSaving(true);
    try {
      const nextRules = normalizeReservationRules(await updateReservationRules(values));
      setRules(nextRules);
      form.setFieldsValue(nextRules);
      messageApi.success('预约规则已更新');
    } catch (error) {
      messageApi.error(error instanceof Error ? error.message : '保存预约规则失败');
    } finally {
      setSaving(false);
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadRules();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadRules]);

  return (
    <div className="page">
      {contextHolder}
      <div className="reservation-rule-stats-grid">
        <Card loading={loading} className="reservation-rule-stat-card">
          <Statistic title="提前签到" value={rules?.checkinLeadMinutes ?? 0} suffix="分钟" />
        </Card>
        <Card loading={loading} className="reservation-rule-stat-card">
          <Statistic title="签到宽限" value={rules?.checkinGraceMinutes ?? 0} suffix="分钟" />
        </Card>
        <Card loading={loading} className="reservation-rule-stat-card">
          <Statistic title="WiFi 离线释放" value={rules?.wifiOfflineReleaseMinutes ?? 0} suffix="分钟" />
        </Card>
        <Card loading={loading} className="reservation-rule-stat-card">
          <Statistic title="开放明日预约" value={rules?.reservationOpenHour ?? 0} suffix="点" />
        </Card>
        <Card loading={loading} className="reservation-rule-stat-card">
          <Statistic title="单次锁位" value={rules?.seatLockMinutes ?? 0} suffix="分钟" />
        </Card>
        <Card loading={loading} className="reservation-rule-stat-card">
          <Statistic title="每日活跃预约" value={rules?.dailyActiveReservationLimit ?? 0} suffix="个" />
        </Card>
        <Card loading={loading} className="reservation-rule-stat-card">
          <Statistic title="最后更新人" value={rules?.updatedBy ?? '-'} />
        </Card>
      </div>

      <Card
        title="预约规则"
        loading={loading}
        extra={
          <Typography.Text type="secondary">
            {rules?.updatedAt ? `更新时间 ${rules.updatedAt.replace('T', ' ').slice(0, 19)}` : '使用默认规则'}
          </Typography.Text>
        }
      >
        <Form form={form} layout="vertical" className="rule-form">
          <div className="rule-form-grid">
            <Form.Item
              label="可提前签到时间（分钟）"
              name="checkinLeadMinutes"
              rules={[{ required: true, message: '请输入可提前签到时间' }]}
            >
              <InputNumber min={0} max={120} precision={0} />
            </Form.Item>
            <Form.Item
              label="开始后可签到时间（分钟）"
              name="checkinGraceMinutes"
              rules={[{ required: true, message: '请输入签到宽限时间' }]}
            >
              <InputNumber min={1} max={120} precision={0} />
            </Form.Item>
            <Form.Item
              label="最大提前预约天数"
              name="maxAdvanceDays"
              rules={[{ required: true, message: '请输入最大提前预约天数' }]}
            >
              <InputNumber min={0} max={30} precision={0} />
            </Form.Item>
            <Form.Item
              label="每日开放明日预约时间（点）"
              name="reservationOpenHour"
              rules={[{ required: true, message: '请输入开放预约时间' }]}
            >
              <InputNumber min={0} max={23} precision={0} />
            </Form.Item>
            <Form.Item
              label="每日活跃预约上限"
              name="dailyActiveReservationLimit"
              rules={[{ required: true, message: '请输入每日活跃预约上限' }]}
            >
              <InputNumber min={1} max={12} precision={0} />
            </Form.Item>
            <Form.Item
              label="WiFi 离线自动释放（分钟）"
              name="wifiOfflineReleaseMinutes"
              rules={[{ required: true, message: '请输入 WiFi 离线自动释放时间' }]}
            >
              <InputNumber min={1} max={120} precision={0} />
            </Form.Item>
            <Form.Item
              label="单次锁位时长（分钟）"
              name="seatLockMinutes"
              rules={[{ required: true, message: '请输入单次锁位时长' }]}
            >
              <InputNumber min={1} max={180} precision={0} />
            </Form.Item>
          </div>
          <Space>
            <Button type="primary" loading={saving} onClick={saveRules}>
              保存规则
            </Button>
            <Button loading={loading} onClick={loadRules}>
              刷新
            </Button>
          </Space>
        </Form>
      </Card>
    </div>
  );
}
