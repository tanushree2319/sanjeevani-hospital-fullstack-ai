import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from './useAuth';

export default function ProtectedRoute({ role }: { role: 'patient' | 'admin' }) {
  const { session } = useAuth();
  const location = useLocation();

  if (!session) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (session.user.role !== role) return <Navigate to={session.user.role === 'admin' ? '/admin-dashboard' : '/patient-dashboard'} replace />;
  return <Outlet />;
}