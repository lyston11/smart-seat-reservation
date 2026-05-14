import { Navigate, Outlet } from 'react-router-dom';
import { getStoredUser } from '../api/http';
import type { UserRole } from '../types/auth';

type RoleRouteProps = {
  allowedRoles?: UserRole[];
  redirectTo?: string;
};

export default function RoleRoute({ allowedRoles, redirectTo = '/student/seats' }: RoleRouteProps) {
  const user = getStoredUser();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={redirectTo} replace />;
  }

  return <Outlet />;
}
