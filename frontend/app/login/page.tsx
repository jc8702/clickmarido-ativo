'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/Card';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(email, password);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Erro ao fazer login');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-hero dark:from-neutral-900 dark:to-neutral-800 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-animated opacity-10" />

      <div className="w-full max-w-md animate-fade-in">
        <div className="text-center mb-8 animate-slide-down flex flex-col items-center">
          <img
            src="/logo.jpg"
            alt="Click Marido Logo"
            className="w-24 h-24 rounded-full object-cover border-4 border-white/20 shadow-lg mb-4"
          />
          <h1 className="text-4xl font-bold text-white tracking-tight">
            Click<span className="text-warning-400">Marido</span>
          </h1>
          <p className="text-white/80 mt-2">
            Sistema de Gestão de Serviços Residenciais
          </p>
        </div>

        <Card gradient="none" shadow="lg" className="animate-scale-in">
          <div className="p-8">
            <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mb-6 text-center">
              Entrar
            </h2>

            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="p-3 bg-warning-50 dark:bg-warning-900/30 border-l-4 border-warning-600 text-warning-900 dark:text-warning-200 rounded-md text-sm animate-slide-down">
                  {error}
                </div>
              )}

              <Input
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                disabled={isLoading}
                required
              />

              <Input
                label="Senha"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Sua senha"
                disabled={isLoading}
                required
              />

              <Button fullWidth isLoading={isLoading} type="submit">
                {isLoading ? 'Autenticando...' : 'Entrar'}
              </Button>
            </form>
          </div>
        </Card>
      </div>
    </div>
  );
}
