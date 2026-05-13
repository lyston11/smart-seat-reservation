import { App as AntApp, Layout, Menu, Typography } from 'antd';
import {
  CalendarCheck,
  ClipboardList,
  LayoutDashboard,
  MapPinned,
} from 'lucide-react';
import SeatSlotsPage from './pages/SeatSlotsPage';

const { Header, Sider, Content } = Layout;

const menuItems = [
  { key: 'student-seats', icon: <MapPinned size={18} />, label: '学生选座' },
  { key: 'my-reservations', icon: <CalendarCheck size={18} />, label: '我的预约', disabled: true },
  { key: 'admin-seats', icon: <ClipboardList size={18} />, label: '座位管理', disabled: true },
  { key: 'admin-dashboard', icon: <LayoutDashboard size={18} />, label: '占用看板', disabled: true },
];

export default function App() {
  return (
    <AntApp>
      <Layout className="app-shell">
        <Sider width={232} theme="light" className="app-sider">
          <div className="brand">
            <div className="brand-title">Smart Seat</div>
            <div className="brand-subtitle">学院座位预约</div>
          </div>
          <Menu mode="inline" selectedKeys={['student-seats']} items={menuItems} />
        </Sider>
        <Layout>
          <Header className="app-header">
            <Typography.Title level={3} className="page-title">
              学生选座
            </Typography.Title>
          </Header>
          <Content className="app-content">
            <SeatSlotsPage />
          </Content>
        </Layout>
      </Layout>
    </AntApp>
  );
}
