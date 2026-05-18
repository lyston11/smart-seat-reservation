import { useState } from 'react';
import { Alert, Button, Form, Input, Result, Space, Typography, message } from 'antd';
import { Link, useSearchParams } from 'react-router-dom';
import { tableCheckInReservation } from '../api/seatSlots';
import type { ReservationResult } from '../types/reservation';

type CheckinForm = {
  checkinCode: string;
};

export default function TableCheckinPage() {
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
      messageApi.warning('桌码链接缺少 token，请重新扫码');
      return;
    }

    setSubmitting(true);
    try {
      const reservation = await tableCheckInReservation({
        tableQrToken: token,
        checkinCode: values.checkinCode.trim(),
      });
      setCheckedInResult({ token, reservation });
      messageApi.success('签到成功');
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
          title="签到成功"
          subTitle={`预约 ${checkedInReservation.reservationId} 已完成签到，座位进入使用中状态。`}
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
        <Space direction="vertical" size={16} className="table-checkin-stack">
          <div>
            <Typography.Title level={4} className="table-checkin-title">
              桌码签到
            </Typography.Title>
            <Typography.Text type="secondary">
              扫描桌面二维码后，输入预约记录中的签到码完成到场确认。
            </Typography.Text>
          </div>

          {!token ? (
            <Alert
              type="warning"
              showIcon
              message="缺少桌码 token"
              description="当前链接无法识别桌位，请重新扫描桌面固定二维码。"
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
                确认签到
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
