import { Button, Layout, Menu, Space, Tag, Typography } from 'antd';
import type { MenuProps } from 'antd';
import {
  CalendarCheck,
  ClipboardList,
  LayoutDashboard,
  Layers,
  MapPinned,
  ShieldCheck,
  Timer,
} from 'lucide-react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { logout } from '../api/auth';
import { getStoredUser } from '../api/http';

const { Header, Sider, Content } = Layout;

type MenuItem = Required<MenuProps>['items'][number];

const studentMenuItems: MenuItem[] = [
  {
    key: '/student/seats',
    icon: <MapPinned size={18} />,
    label: <Link to="/student/seats">学生选座</Link>,
  },
  {
    key: '/student/reservations',
    icon: <CalendarCheck size={18} />,
    label: <Link to="/student/reservations">我的预约</Link>,
  },
];

const adminMenuItems: MenuItem[] = [
  {
    key: '/admin/areas',
    icon: <Layers size={18} />,
    label: <Link to="/admin/areas">区域管理</Link>,
  },
  {
    key: '/admin/seats',
    icon: <ClipboardList size={18} />,
    label: <Link to="/admin/seats">座位管理</Link>,
  },
  {
    key: '/admin/seat-slots',
    icon: <Timer size={18} />,
    label: <Link to="/admin/seat-slots">开放时段</Link>,
  },
  {
    key: '/admin/dashboard',
    icon: <LayoutDashboard size={18} />,
    label: <Link to="/admin/dashboard">占用看板</Link>,
  },
  {
    key: '/admin/audit-logs',
    icon: <ShieldCheck size={18} />,
    label: <Link to="/admin/audit-logs">审计日志</Link>,
  },
];

const pageTitles: Record<string, string> = {
  '/student/seats': '学生选座',
  '/student/reservations': '我的预约',
  '/admin/areas': '区域管理',
  '/admin/seats': '座位管理',
  '/admin/seat-slots': '开放时段',
  '/admin/dashboard': '占用看板',
  '/admin/audit-logs': '审计日志',
};

export default function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const user = getStoredUser();
  const selectedKey = pageTitles[location.pathname] ? location.pathname : '/student/seats';
  const menuItems = user?.role === 'ADMIN' ? [...studentMenuItems, ...adminMenuItems] : studentMenuItems;

  async function signOut() {
    await logout();
    navigate('/login', { replace: true });
  }

  return (
    <Layout className="app-shell">
      <Sider width={232} theme="light" className="app-sider">
        <div className="brand">
          <div className="brand-title">Smart Seat</div>
          <div className="brand-subtitle">学院座位预约</div>
        </div>
        <Menu mode="inline" selectedKeys={[selectedKey]} items={menuItems} />
      </Sider>
      <Layout>
        <Header className="app-header">
          <Typography.Title level={3} className="page-title">
            {pageTitles[selectedKey]}
          </Typography.Title>
          <Space>
            <Tag color={user?.role === 'ADMIN' ? 'purple' : 'blue'}>
              {user?.role === 'ADMIN' ? '管理员' : '学生'}
            </Tag>
            <Typography.Text>{user?.name}</Typography.Text>
            <Button size="small" onClick={signOut}>
              退出
            </Button>
          </Space>
        </Header>
        <Content className="app-content">
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
