import { useState } from 'react';
import { Button, Form, Input, Typography, message } from 'antd';
import {
  Armchair,
  CalendarClock,
  Gauge,
  MapPinned,
  MonitorCheck,
  QrCode,
  Route,
  ScanLine,
  ShieldCheck,
} from 'lucide-react';
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
  { title: '实时选座', description: '空闲、预约中、使用中和锁位状态同步展示。', Icon: MapPinned },
  { title: '扫码签到', description: '固定桌码和预约码匹配，到场后完成签到闭环。', Icon: ScanLine },
  { title: '预约规则', description: '开放日期、最长时段和签到宽限由管理员配置。', Icon: CalendarClock },
  { title: '管理看板', description: '区域、桌椅、开放时段和异常占用统一管理。', Icon: MonitorCheck },
  { title: '防重复预约', description: '按学生与时段校验冲突，减少抢座和占座。', Icon: ShieldCheck },
];

const showcaseMetrics = [
  { label: '总座位', value: '328', tone: 'blue' },
  { label: '空闲', value: '124', tone: 'green' },
  { label: '占用', value: '180', tone: 'orange' },
  { label: '预约中', value: '24', tone: 'cyan' },
];

const seatPreviewCells = [
  'available',
  'available',
  'reserved',
  'occupied',
  'available',
  'occupied',
  'available',
  'available',
  'selected',
  'reserved',
  'available',
  'occupied',
  'available',
  'reserved',
  'available',
  'available',
  'occupied',
  'available',
  'available',
  'reserved',
  'available',
  'available',
  'selected',
  'occupied',
  'available',
  'reserved',
  'available',
  'available',
  'available',
  'occupied',
  'reserved',
  'available',
];

const seatLegend = [
  { label: '空闲', tone: 'available' },
  { label: '占用', tone: 'occupied' },
  { label: '预约中', tone: 'reserved' },
  { label: '当前座位', tone: 'selected' },
];

const workflowCards = [
  { title: '学生预约', description: '按楼栋、楼层、区域进入地图，选择具体桌座。', Icon: Armchair },
  { title: '到场签到', description: '扫描固定二维码，系统匹配桌码、座位和预约码。', Icon: QrCode },
  { title: '管理员调度', description: '查看座位占用、释放异常占用并调整开放规则。', Icon: Gauge },
  { title: '状态追踪', description: '从预约、签到到签退形成完整可追踪记录。', Icon: Route },
];

const studentFlowSteps = [
  { title: '选择空间', description: '按楼栋、楼层和公共区域进入座位图。' },
  { title: '确认桌座', description: '查看桌子布局，选择具体座位和时间。' },
  { title: '到场扫码', description: '扫描桌面固定二维码并提交预约码。' },
  { title: '开始使用', description: '系统匹配桌码、座位和预约记录后签到。' },
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
    <div className="login-page motion-page">
      {contextHolder}
      <div className="login-shell">
        <section className="login-identity" aria-label="系统简介">
          <div className="login-hero-copy">
            <div className="login-kicker">智慧座位预约系统</div>
            <Typography.Title level={1}>Smart Seat</Typography.Title>
            <Typography.Paragraph>
              让每一个公共学习座位，都可预约、可到场、可追踪。学生提前看见空闲桌座，管理员实时掌握空间状态。
            </Typography.Paragraph>
          </div>

          <div className="login-feature-list" aria-label="系统能力">
            {loginFeatures.map(({ Icon, ...feature }) => (
              <div className="login-feature-item" key={feature.title}>
                <Icon size={18} aria-hidden="true" />
                <span>{feature.title}</span>
                <strong>{feature.description}</strong>
              </div>
            ))}
          </div>

          <div className="login-showcase">
            <div className="login-seat-map-panel">
              <div className="login-showcase-header">
                <div>
                  <span>座位地图 / Seat Map</span>
                  <strong>A区 · 2F 自习空间</strong>
                </div>
                <span className="login-live-badge">实时同步</span>
              </div>

              <div className="login-metric-grid">
                {showcaseMetrics.map((metric) => (
                  <div className={`login-metric-card login-metric-card-${metric.tone}`} key={metric.label}>
                    <span>{metric.label}</span>
                    <strong>{metric.value}</strong>
                  </div>
                ))}
              </div>

              <div className="login-map-preview" aria-label="座位状态示意图">
                {seatPreviewCells.map((tone, index) => (
                  <span
                    className={`login-seat-cell login-seat-cell-${tone}`}
                    key={`${tone}-${index}`}
                    aria-hidden="true"
                  />
                ))}
              </div>

              <div className="login-seat-legend">
                {seatLegend.map((item) => (
                  <span key={item.label}>
                    <i className={`login-seat-dot login-seat-dot-${item.tone}`} />
                    {item.label}
                  </span>
                ))}
              </div>
            </div>

            <div className="login-student-flow-card">
              <div className="login-student-flow-label">登录后可操作</div>
              <span>学生预约流程</span>
              <strong>从查看座位到扫码签到</strong>
              <div className="login-student-flow-steps">
                {studentFlowSteps.map((step, index) => (
                  <div className="login-student-flow-step" key={step.title}>
                    <i>{index + 1}</i>
                    <div>
                      <b>{step.title}</b>
                      <small>{step.description}</small>
                    </div>
                  </div>
                ))}
              </div>
              <div className="login-table-code-preview">
                <QrCode size={42} aria-hidden="true" />
                <div>
                  <b>桌面固定二维码</b>
                  <small>到座后由系统匹配你的预约座位。</small>
                </div>
              </div>
            </div>
          </div>

          <div className="login-flow-list" aria-label="使用流程">
            {workflowCards.map(({ Icon, ...card }) => (
              <div className="login-flow-card" key={card.title}>
                <Icon size={19} aria-hidden="true" />
                <span>{card.title}</span>
                <strong>{card.description}</strong>
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
