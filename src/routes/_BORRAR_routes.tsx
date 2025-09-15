import { Navigate, useLocation } from 'react-router-dom';
import { useAppSelector } from '@/app/hooks';
import type { ReactElement } from 'react';

export default function RequireAuth({ children }: { children: ReactElement }) {
  const token = useAppSelector((s) => s.auth.accessToken);
  const loc = useLocation();
  if (!token) return <Navigate to="/login" state={{ from: loc }} replace />;
  return children;
}
