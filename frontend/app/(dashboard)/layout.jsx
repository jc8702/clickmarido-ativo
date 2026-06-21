'use client';

import { useAuth } from '../../hooks/useAuth';

export default function DashboardLayout({ children }) {
  const { user, loading } = useAuth();

  if (!loading && !user) {
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
    return null;
  }

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Carregando...</div>;
  }

  return <>{children}</>;
}
