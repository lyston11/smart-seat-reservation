import { App as AntApp } from 'antd';
import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { getStoredUser } from './api/http';
import AppLayout from './layout/AppLayout';
import RoleRoute from './router/RoleRoute';

const AdminAreasPage = lazy(() => import('./pages/AdminAreasPage'));
const AdminDashboardPage = lazy(() => import('./pages/AdminDashboardPage'));
const AdminSeatSlotsPage = lazy(() => import('./pages/AdminSeatSlotsPage'));
const AdminSeatsPage = lazy(() => import('./pages/AdminSeatsPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const MyReservationsPage = lazy(() => import('./pages/MyReservationsPage'));
const SeatSlotsPage = lazy(() => import('./pages/SeatSlotsPage'));

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
      <Suspense fallback={<div className="route-loading">加载中...</div>}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<ProtectedRoute />}>
            <Route index element={<Navigate to="/student/seats" replace />} />
            <Route path="/student/seats" element={<SeatSlotsPage />} />
            <Route path="/student/reservations" element={<MyReservationsPage />} />
            <Route element={<RoleRoute allowedRoles={['ADMIN']} />}>
              <Route path="/admin/areas" element={<AdminAreasPage />} />
              <Route path="/admin/seats" element={<AdminSeatsPage />} />
              <Route path="/admin/seat-slots" element={<AdminSeatSlotsPage />} />
              <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/student/seats" replace />} />
        </Routes>
      </Suspense>
    </AntApp>
  );
}
