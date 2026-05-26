import { useState } from 'react';
import { Button, Form, Input, Typography, message } from 'antd';
import { useLocation, useNavigate } from 'react-router-dom';
import { login } from '../api/auth';
import { setAuthSession } from '../api/http';

type LoginFormValues = {
  studentNo: string;
  password: string;
};

const demoAccounts = [
  {
    label: '学生演示账号',
    value: '20260001',
    password: '123456',
    description: '查看座位实况，选择桌座并提交预约。',
  },
  {
    label: '管理员演示账号',
    value: 'admin',
    password: 'admin',
    description: '维护区域桌椅，查看占用并处理异常。',
  },
];

const loginFeatures = [
  { title: '实时座位', description: '在线查看空闲、已预约、使用中和锁位状态。' },
  { title: '预约与扫码签到', description: '选定桌座和时段，到场扫码完成签到闭环。' },
  { title: '管理员一屏调度', description: '区域、桌椅、开放时段和异常占用统一管理。' },
];

export default function LoginPage() {
  const [form] = Form.useForm<LoginFormValues>();
  const [loading, setLoading] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();
  const location = useLocation();
  const navigate = useNavigate();

  const returnPath =
    typeof location.state === 'object' && location.state !== null && 'from' in location.state
      ? location.state.from
      : null;

  async function submit() {
    const values = await form.validateFields();
    setLoading(true);
    try {
      const session = await login(values.studentNo, values.password);
      setAuthSession(session);
      messageApi.success('登录成功');
      const defaultPath = session.user.role === 'ADMIN' ? '/admin/dashboard' : '/student/home';
      navigate(typeof returnPath === 'string' && returnPath.startsWith('/') ? returnPath : defaultPath, {
        replace: true,
      });
    } catch (error) {
      messageApi.error(error instanceof Error ? error.message : '登录失败');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      {contextHolder}
      <div className="login-shell">
        <section className="login-identity" aria-label="系统简介">
          <div className="login-kicker">学院公共区域学习座位预约系统</div>
          <Typography.Title level={1}>Smart Seat</Typography.Title>
          <Typography.Paragraph>
            让学生提前看见可用座位，到座扫码签到；让管理员实时掌握公共学习空间的使用状态。
          </Typography.Paragraph>
          <div className="login-feature-list">
            {loginFeatures.map((feature) => (
              <div className="login-feature-item" key={feature.title}>
                <span>{feature.title}</span>
                <strong>{feature.description}</strong>
              </div>
            ))}
          </div>
        </section>

        <section className="login-panel" aria-label="登录表单">
          <div className="login-panel-heading">
            <Typography.Title level={2}>登录系统</Typography.Title>
            <Typography.Text type="secondary">选择演示身份或输入账号继续。</Typography.Text>
          </div>
        <Form
          form={form}
          layout="vertical"
          className="login-form"
          initialValues={{ studentNo: '20260001', password: '123456' }}
        >
          <Form.Item label="演示账号">
            <div className="login-account-grid">
              {demoAccounts.map((account) => (
                <button
                  className="login-account-card"
                  key={account.value}
                  type="button"
                  onClick={() => form.setFieldsValue({ studentNo: account.value, password: account.password })}
                >
                  <span>{account.label}</span>
                  <strong>{account.value}</strong>
                  <small>{account.description}</small>
                </button>
              ))}
            </div>
          </Form.Item>
          <Form.Item
            label="学号/账号"
            name="studentNo"
            rules={[{ required: true, message: '请输入学号或账号' }]}
          >
            <Input placeholder="学生 20260001 / 管理员 admin" />
          </Form.Item>
          <Form.Item
            label="密码"
            name="password"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password placeholder="学生 123456 / 管理员 admin" />
          </Form.Item>
          <Button type="primary" block loading={loading} onClick={submit}>
            登录
          </Button>
        </Form>
        </section>
      </div>
    </div>
  );
}
