import { Layout, Menu, Typography } from 'antd';
import type { MenuProps } from 'antd';
import {
  CalendarCheck,
  ClipboardList,
  LayoutDashboard,
  MapPinned,
} from 'lucide-react';
import { Link, Outlet, useLocation } from 'react-router-dom';

const { Header, Sider, Content } = Layout;

const menuItems: MenuProps['items'] = [
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
  {
    key: '/admin/seats',
    icon: <ClipboardList size={18} />,
    label: <Link to="/admin/seats">座位管理</Link>,
  },
  {
    key: '/admin/dashboard',
    icon: <LayoutDashboard size={18} />,
    label: <Link to="/admin/dashboard">占用看板</Link>,
  },
];

const pageTitles: Record<string, string> = {
  '/student/seats': '学生选座',
  '/student/reservations': '我的预约',
  '/admin/seats': '座位管理',
  '/admin/dashboard': '占用看板',
};

export default function AppLayout() {
  const location = useLocation();
  const selectedKey = pageTitles[location.pathname] ? location.pathname : '/student/seats';

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
        </Header>
        <Content className="app-content">
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
