import { useState } from 'react';
import { Button, Form, Input, Radio, Typography, message } from 'antd';
import { useNavigate } from 'react-router-dom';
import { login } from '../api/auth';
import { setAuthSession } from '../api/http';

type LoginFormValues = {
  studentNo: string;
  password: string;
};

const demoAccounts = [
  { label: '学生演示账号', value: '20260001', password: '123456' },
  { label: '管理员演示账号', value: 'admin', password: 'admin' },
];

export default function LoginPage() {
  const [form] = Form.useForm<LoginFormValues>();
  const [loading, setLoading] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();
  const navigate = useNavigate();

  async function submit() {
    const values = await form.validateFields();
    setLoading(true);
    try {
      const session = await login(values.studentNo, values.password);
      setAuthSession(session);
      messageApi.success('登录成功');
      navigate(session.user.role === 'ADMIN' ? '/admin/dashboard' : '/student/seats', { replace: true });
    } catch (error) {
      messageApi.error(error instanceof Error ? error.message : '登录失败');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      {contextHolder}
      <div className="login-panel">
        <Typography.Title level={2}>Smart Seat</Typography.Title>
        <Typography.Text type="secondary">学院公共区域学习座位预约系统</Typography.Text>
        <Form
          form={form}
          layout="vertical"
          className="login-form"
          initialValues={{ studentNo: '20260001', password: '123456' }}
        >
          <Form.Item label="演示账号">
            <Radio.Group
              optionType="button"
              buttonStyle="solid"
              options={demoAccounts}
              onChange={(event) => {
                const account = demoAccounts.find((item) => item.value === event.target.value);
                form.setFieldsValue({ studentNo: event.target.value, password: account?.password ?? '' });
              }}
              defaultValue="20260001"
            />
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
      </div>
    </div>
  );
}
