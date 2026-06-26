import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';

interface AuthUser {
  token: string;
  name?: string;
  email: string;
  role: string;
}

// Singleton para evitar múltiplas verificações de auth simultâneas
let authPromise: Promise<AuthUser | null> | null = null;
let cachedUser: AuthUser | null = null;
let lastVerifyTime = 0;
const VERIFY_CACHE_MS = 30000; // 30 segundos de cache

async function verifyToken(token: string): Promise<AuthUser | null> {
  const now = Date.now();
  
  // Se temos cache válido, retornar
  if (cachedUser && (now - lastVerifyTime) < VERIFY_CACHE_MS) {
    return cachedUser;
  }

  // Se já existe uma verificação em andamento, aguardar
  if (authPromise) {
    return authPromise;
  }

  authPromise = (async () => {
    try {
      const response = await fetch('/api/auth/verify', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        const user: AuthUser = {
          token,
          name: data.user?.name || data.name,
          email: data.user?.email || data.email,
          role: data.user?.role || data.role,
        };
        cachedUser = user;
        lastVerifyTime = Date.now();
        return user;
      }
      
      // Token inválido - limpar cache
      cachedUser = null;
      lastVerifyTime = 0;
      return null;
    } catch (error) {
      // Em caso de erro de rede, NÃO limpar o cache imediatamente
      // Apenas retorna null para esta tentativa, mas mantém o cache anterior
      console.error('Auth verification failed (network error):', error);
      
      // Se temos cache anterior, usar ele (tolerância a erros de rede)
      if (cachedUser) {
        return cachedUser;
      }
      
      return null;
    } finally {
      authPromise = null;
    }
  })();

  return authPromise;
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    const verifyAuth = async () => {
      try {
        const token = localStorage.getItem('token');

        if (!token) {
          if (mountedRef.current) {
            setUser(null);
            setLoading(false);
          }
          return;
        }

        const verifiedUser = await verifyToken(token);
        
        if (mountedRef.current) {
          if (verifiedUser) {
            setUser(verifiedUser);
          } else {
            // Token inválido - só remove se não há cache
            localStorage.removeItem('token');
            setUser(null);
          }
          setLoading(false);
        }
      } catch (error) {
        console.error('Auth verification failed:', error);
        if (mountedRef.current) {
          // Em caso de erro inesperado, NÃO remove o token imediatamente
          // Apenas marca como não autenticado para esta sessão
          setUser(null);
          setLoading(false);
        }
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
      
      // Limpar cache de verificação anterior
      cachedUser = null;
      lastVerifyTime = 0;
      
      const newUser: AuthUser = {
        token: data.token,
        name: data.user?.name,
        email: data.user.email,
        role: data.user.role,
      };
      
      setUser(newUser);
      cachedUser = newUser;
      lastVerifyTime = Date.now();

      router.push('/dashboard');

      return data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }, [router]);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    cachedUser = null;
    lastVerifyTime = 0;
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
