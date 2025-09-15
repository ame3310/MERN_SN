import { Navigate } from 'react-router-dom';
import { useAppSelector } from '@/app/hooks';
import type { JSX } from 'react';

export default function RequireGuest({ children }: { children: JSX.Element }) {
  const token = useAppSelector((s) => s.auth.accessToken);
  return token ? <Navigate to="/home" replace /> : children;
}
