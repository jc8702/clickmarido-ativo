import axios from 'axios';

// Resolve a baseURL dinamicamente em tempo de execução para evitar que valores embutidos
// no build (.env no git com localhost:3000) quebrem as chamadas de produção na Vercel.
let API_URL = '/api';

if (typeof window !== 'undefined') {
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    API_URL = process.env.NEXT_PUBLIC_API_URL || '/api';
  } else {
    API_URL = '/api';
  }
} else {
  API_URL = process.env.NEXT_PUBLIC_API_URL || '/api';
}

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' }
});

// Interceptor: adicionar token JWT
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Flag para evitar múltiplos redirects simultâneos
let isRedirecting = false;

// Interceptor: 401 redireciona para login (apenas em casos claros de token expirado)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined' && !isRedirecting) {
      // Verificar se o token realmente existe antes de redirecionar
      const token = localStorage.getItem('token');
      if (!token) {
        // Sem token, redirecionar para login
        isRedirecting = true;
        window.location.href = '/login';
      } else {
        // Token existe mas é inválido/expirado - remover e redirecionar
        localStorage.removeItem('token');
        isRedirecting = true;
        // Usar setTimeout para evitar redirect imediato em caso de race condition
        setTimeout(() => {
          window.location.href = '/login';
        }, 100);
      }
    }
    return Promise.reject(error);
  }
);

export default api;
