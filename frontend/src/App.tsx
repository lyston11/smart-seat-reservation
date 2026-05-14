import { App as AntApp } from 'antd';
import { Navigate, Route, Routes } from 'react-router-dom';
import AppLayout from './layout/AppLayout';
import AdminDashboardPage from './pages/AdminDashboardPage';
import AdminSeatSlotsPage from './pages/AdminSeatSlotsPage';
import AdminSeatsPage from './pages/AdminSeatsPage';
import MyReservationsPage from './pages/MyReservationsPage';
import SeatSlotsPage from './pages/SeatSlotsPage';

export default function App() {
  return (
    <AntApp>
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<Navigate to="/student/seats" replace />} />
          <Route path="/student/seats" element={<SeatSlotsPage />} />
          <Route path="/student/reservations" element={<MyReservationsPage />} />
          <Route path="/admin/seats" element={<AdminSeatsPage />} />
          <Route path="/admin/seat-slots" element={<AdminSeatSlotsPage />} />
          <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/student/seats" replace />} />
      </Routes>
    </AntApp>
  );
}
