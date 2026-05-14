import { App as AntApp } from 'antd';
import { Navigate, Route, Routes } from 'react-router-dom';
import { getStoredUser } from './api/http';
import AppLayout from './layout/AppLayout';
import AdminAreasPage from './pages/AdminAreasPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import AdminSeatSlotsPage from './pages/AdminSeatSlotsPage';
import AdminSeatsPage from './pages/AdminSeatsPage';
import LoginPage from './pages/LoginPage';
import MyReservationsPage from './pages/MyReservationsPage';
import SeatSlotsPage from './pages/SeatSlotsPage';

function ProtectedRoute() {
  const user = getStoredUser();
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return <AppLayout />;
}

export default function App() {
  return (
    <AntApp>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<ProtectedRoute />}>
          <Route index element={<Navigate to="/student/seats" replace />} />
          <Route path="/student/seats" element={<SeatSlotsPage />} />
          <Route path="/student/reservations" element={<MyReservationsPage />} />
          <Route path="/admin/areas" element={<AdminAreasPage />} />
          <Route path="/admin/seats" element={<AdminSeatsPage />} />
          <Route path="/admin/seat-slots" element={<AdminSeatSlotsPage />} />
          <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/student/seats" replace />} />
      </Routes>
    </AntApp>
  );
}
