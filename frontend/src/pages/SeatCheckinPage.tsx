import { useState } from 'react';
import { Alert, Button, Form, Input, Result, Space, Tag, Typography, message } from 'antd';
import { Link, useSearchParams } from 'react-router-dom';
import { seatCheckInReservation } from '../api/reservations';
import type { ReservationResult } from '../types/reservation';

type CheckinForm = {
  checkinCode: string;
};

export default function SeatCheckinPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token')?.trim() ?? '';
  const [submitting, setSubmitting] = useState(false);
  const [checkedInResult, setCheckedInResult] = useState<{
    token: string;
    reservation: ReservationResult;
  } | null>(null);
  const [messageApi, contextHolder] = message.useMessage();
  const checkedInReservation = checkedInResult?.token === token ? checkedInResult.reservation : null;

  async function submit(values: CheckinForm) {
    if (!token) {
      messageApi.warning('座位码链接缺少 token，请重新扫码');
      return;
    }

    setSubmitting(true);
    try {
      const reservation = await seatCheckInReservation({
        seatQrToken: token,
        checkinCode: values.checkinCode.trim(),
      });
      setCheckedInResult({ token, reservation });
      messageApi.success(reservation.status === 'CHECKED_IN' ? '操作成功' : '签到成功');
    } catch (error) {
      messageApi.error(error instanceof Error ? error.message : '签到失败');
    } finally {
      setSubmitting(false);
    }
  }

  if (checkedInReservation) {
    return (
      <div className="page table-checkin-page">
        {contextHolder}
        <Result
          status="success"
          title="座位已进入使用中"
          subTitle={`预约 ${checkedInReservation.reservationId} 已通过座位码确认到场或恢复使用。`}
          extra={[
            <Button type="primary" key="reservations">
              <Link to="/student/reservations">查看我的预约</Link>
            </Button>,
            <Button key="seats">
              <Link to="/student/seats">返回学生选座</Link>
            </Button>,
          ]}
        />
      </div>
    );
  }

  return (
    <div className="page table-checkin-page">
      {contextHolder}
      <div className="table-checkin-panel">
        <Space orientation="vertical" size={16} className="table-checkin-stack">
          <div>
            <Space wrap>
              <Typography.Title level={4} className="table-checkin-title">
                座位码签到
              </Typography.Title>
              <Tag color="blue">固定座位二维码</Tag>
            </Space>
            <Typography.Text type="secondary">
              扫描座位上的固定二维码后，输入预约记录中的签到码完成签到；锁位后也可扫码恢复使用。
            </Typography.Text>
          </div>

          {!token ? (
            <Alert
              type="warning"
              showIcon
              message="缺少座位码 token"
              description="当前链接无法识别座位，请重新扫描座位上的固定二维码。"
            />
          ) : null}

          <Form layout="vertical" onFinish={submit}>
            <Form.Item
              label="签到码"
              name="checkinCode"
              rules={[
                { required: true, message: '请输入签到码' },
                {
                  validator: async (_, value: string | undefined) => {
                    if (value && !value.trim()) {
                      throw new Error('请输入签到码');
                    }
                  },
                },
              ]}
            >
              <Input
                autoComplete="one-time-code"
                disabled={!token || submitting}
                placeholder="请输入预约详情中的签到码"
                maxLength={32}
              />
            </Form.Item>

            <Space wrap>
              <Button type="primary" htmlType="submit" loading={submitting} disabled={!token}>
                确认签到/解锁
              </Button>
              <Button>
                <Link to="/student/reservations">我的预约</Link>
              </Button>
              <Button>
                <Link to="/student/seats">学生选座</Link>
              </Button>
            </Space>
          </Form>
        </Space>
      </div>
    </div>
  );
}
