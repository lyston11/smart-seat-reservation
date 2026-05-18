import { Navigate, Outlet } from 'react-router-dom';
import { getStoredUser } from '../api/http';
import type { UserRole } from '../types/auth';

type RoleRouteProps = {
  allowedRoles?: UserRole[];
  redirectTo?: string;
};

export default function RoleRoute({ allowedRoles, redirectTo }: RoleRouteProps) {
  const user = getStoredUser();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    const fallbackPath = user.role === 'ADMIN' ? '/admin/dashboard' : '/student/home';
    return <Navigate to={redirectTo ?? fallbackPath} replace />;
  }

  return <Outlet />;
}
