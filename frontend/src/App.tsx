import { App as AntApp } from 'antd';
import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { getStoredUser } from './api/http';
import AppLayout from './layout/AppLayout';
import RoleRoute from './router/RoleRoute';

const AdminAreasPage = lazy(() => import('./pages/AdminAreasPage'));
const AdminAuditLogsPage = lazy(() => import('./pages/AdminAuditLogsPage'));
const AdminDashboardPage = lazy(() => import('./pages/AdminDashboardPage'));
const AdminReservationRulesPage = lazy(() => import('./pages/AdminReservationRulesPage'));
const AdminSeatSlotsPage = lazy(() => import('./pages/AdminSeatSlotsPage'));
const AdminSeatsPage = lazy(() => import('./pages/AdminSeatsPage'));
const AdminTablesPage = lazy(() => import('./pages/AdminTablesPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const MyReservationsPage = lazy(() => import('./pages/MyReservationsPage'));
const SeatSlotsPage = lazy(() => import('./pages/SeatSlotsPage'));
const StudentHomePage = lazy(() => import('./pages/StudentHomePage'));
const TableCheckinPage = lazy(() => import('./pages/TableCheckinPage'));

function ProtectedRoute() {
  const location = useLocation();
  const user = getStoredUser();
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
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
            <Route index element={<Navigate to="/student/home" replace />} />
            <Route element={<RoleRoute allowedRoles={['STUDENT']} />}>
              <Route path="/student/home" element={<StudentHomePage />} />
              <Route path="/student/seats" element={<SeatSlotsPage />} />
              <Route path="/student/reservations" element={<MyReservationsPage />} />
              <Route path="/student/table-checkin" element={<TableCheckinPage />} />
            </Route>
            <Route element={<RoleRoute allowedRoles={['ADMIN']} />}>
              <Route path="/admin/areas" element={<AdminAreasPage />} />
              <Route path="/admin/tables" element={<AdminTablesPage />} />
              <Route path="/admin/seats" element={<AdminSeatsPage />} />
              <Route path="/admin/seat-slots" element={<AdminSeatSlotsPage />} />
              <Route path="/admin/reservation-rules" element={<AdminReservationRulesPage />} />
              <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
              <Route path="/admin/audit-logs" element={<AdminAuditLogsPage />} />
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/student/home" replace />} />
        </Routes>
      </Suspense>
    </AntApp>
  );
}
