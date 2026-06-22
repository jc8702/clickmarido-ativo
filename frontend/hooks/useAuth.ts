import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface AuthUser {
  token: string;
  name?: string;
  email: string;
  role: string;
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const verifyAuth = async () => {
      try {
        const token = localStorage.getItem('token');

        if (!token) {
          setUser(null);
          setLoading(false);
          return;
        }

        const response = await fetch('/api/auth/verify', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setUser({
            token,
            name: data.user?.name || data.name,
            email: data.user?.email || data.email,
            role: data.user?.role || data.role,
          });
        } else {
          localStorage.removeItem('token');
          setUser(null);
        }
      } catch (error) {
        console.error('Auth verification failed:', error);
        localStorage.removeItem('token');
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    verifyAuth();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Falha no login');
      }

      const data = await response.json();

      localStorage.setItem('token', data.token);
      setUser({
        token: data.token,
        name: data.user?.name,
        email: data.user.email,
        role: data.user.role,
      });

      router.push('/dashboard');

      return data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }, [router]);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    setUser(null);
    router.push('/login');
  }, [router]);

  const getToken = useCallback(() => localStorage.getItem('token'), []);

  return {
    user,
    loading,
    login,
    logout,
    getToken,
    isAuthenticated: !!user,
  };
}
