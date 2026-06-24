'use client';

import React, { useState, useEffect } from 'react';
import useSWR from 'swr';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Table, TableHead, TableHeader, TableRow, TableCell } from '@/components/Table';
import { Badge } from '@/components/Badge';
import { useAuth } from '@/hooks/useAuth';
import { TableShimmer } from '@/components/Shimmer';
import { useEscapeToClose } from '@/hooks/useEscapeToClose';
import { toast } from 'react-hot-toast';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  active: boolean;
  createdAt: string;
}

const fetcher = (url: string) =>
  fetch(url, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem('token')}`,
    },
  }).then((res) => {
    if (!res.ok) throw new Error('Falha ao buscar dados');
    return res.json();
  });

export default function UsersPage() {
  const { user: authUser } = useAuth() as any;
  const { data: users, error, isLoading, mutate } = useSWR<User[]>('/api/users', fetcher);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Estados do Modal/Drawer
  const [isOpen, setIsOpen] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('technician');
  const [active, setActive] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEscapeToClose(isOpen, () => handleCloseModal());

  const handleCloseModal = () => {
    setIsOpen(false);
    setUserId(null);
    setName('');
    setEmail('');
    setPassword('');
    setRole('technician');
    setActive(true);
  };

  const handleOpenEdit = (user: User) => {
    setUserId(user.id);
    setName(user.name);
    setEmail(user.email);
    setPassword(''); // Deixar em branco se não for alterar
    setRole(user.role);
    setActive(user.active);
    setIsOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || (!userId && !password)) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    setSubmitting(true);
    try {
      const url = userId ? `/api/users/${userId}` : '/api/users';
      const method = userId ? 'PUT' : 'POST';
      const body = {
        name,
        email,
        role,
        active,
        ...(password ? { password } : {}),
      };

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(body),
      });

      const resData = await response.json();
      if (!response.ok) {
        throw new Error(resData.error || 'Erro ao processar');
      }

      toast.success(userId ? 'Usuário atualizado!' : 'Usuário criado!');
      mutate();
      handleCloseModal();
    } catch (err: any) {
      toast.error(err.message || 'Ocorreu um erro');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (id === authUser?.id) {
      toast.error('Você não pode excluir sua própria conta.');
      return;
    }

    if (!confirm('Deseja realmente excluir este usuário?')) return;

    try {
      const response = await fetch(`/api/users/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        const resData = await response.json();
        throw new Error(resData.error || 'Erro ao excluir');
      }

      toast.success('Usuário removido!');
      mutate();
    } catch (err: any) {
      toast.error(err.message || 'Erro ao excluir usuário');
    }
  };

  // Bloqueio para técnicos
  if (authUser && authUser.role !== 'admin' && authUser.role !== 'manager') {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-6">
        <Card className="max-w-md w-full p-8 text-center space-y-4 border-red-100 dark:border-red-950/30">
          <div className="w-16 h-16 bg-red-50 dark:bg-red-950/20 text-red-500 rounded-full flex items-center justify-center mx-auto">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-black text-neutral-900 dark:text-neutral-100">Acesso Negado</h2>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            Você não possui permissões administrativas para gerenciar usuários no CRM.
          </p>
        </Card>
      </div>
    );
  }

  const filteredUsers = (users || []).filter(
    (u) =>
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 relative min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-neutral-200/50 dark:border-neutral-800/50 pb-6">
        <div>
          <h1 className="text-3xl font-black text-neutral-900 dark:text-neutral-100">
            Usuários & Técnicos
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            Gerencie as credenciais e níveis de acesso dos colaboradores no CRM.
          </p>
        </div>
        <Button
          onClick={() => setIsOpen(true)}
          className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-2xl shadow-lg shadow-purple-500/10 font-bold text-sm px-5 py-2.5 flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Novo Usuário
        </Button>
      </div>

      {/* Busca */}
      <div className="max-w-md">
        <Input
          placeholder="Buscar por nome ou e-mail..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 rounded-2xl pl-10 text-sm"
        />
      </div>

      {/* Tabela */}
      <Card className="border-neutral-200/50 dark:border-neutral-800/50 shadow-sm overflow-hidden rounded-2xl bg-white dark:bg-neutral-900">
        {isLoading ? (
          <TableShimmer rows={5} cols={5} />
        ) : error ? (
          <div className="p-8 text-center text-red-500">Erro ao carregar usuários.</div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-12 text-center text-neutral-500">Nenhum usuário cadastrado ou encontrado.</div>
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableHeader>Nome</TableHeader>
                <TableHeader>E-mail</TableHeader>
                <TableHeader>Cargo / Role</TableHeader>
                <TableHeader>Status</TableHeader>
                <TableHeader className="text-right">Ações</TableHeader>
              </TableRow>
            </TableHead>
            <tbody>
              {filteredUsers.map((userItem) => (
                <TableRow key={userItem.id} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/20">
                  <TableCell className="font-bold text-neutral-800 dark:text-neutral-200">
                    {userItem.name} {userItem.id === authUser?.id && <span className="text-xs font-normal text-purple-500">(Você)</span>}
                  </TableCell>
                  <TableCell>{userItem.email}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        userItem.role === 'admin'
                          ? 'success'
                          : userItem.role === 'manager'
                          ? 'warning'
                          : 'neutral'
                      }
                      className="uppercase font-bold tracking-wider text-[9px]"
                    >
                      {userItem.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${userItem.active ? 'text-green-600' : 'text-neutral-400'}`}>
                      <span className={`w-2 h-2 rounded-full ${userItem.active ? 'bg-green-500' : 'bg-neutral-300'}`}></span>
                      {userItem.active ? 'Ativo' : 'Inativo'}
                    </span>
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <button
                      onClick={() => handleOpenEdit(userItem)}
                      className="px-3 py-1.5 text-xs font-semibold text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/20 rounded-xl transition-all"
                    >
                      Editar
                    </button>
                    {userItem.id !== authUser?.id && (
                      <button
                        onClick={() => handleDelete(userItem.id)}
                        className="px-3 py-1.5 text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl transition-all"
                      >
                        Excluir
                      </button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </tbody>
          </Table>
        )}
      </Card>

      {/* Drawer / Modal lateral */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-neutral-900 h-full p-6 shadow-2xl overflow-y-auto flex flex-col justify-between animate-slide-in">
            <div className="space-y-6">
              <div className="flex justify-between items-center border-b border-neutral-100 dark:border-neutral-800 pb-4">
                <h3 className="text-lg font-black text-neutral-900 dark:text-neutral-100">
                  {userId ? 'Editar Usuário' : 'Novo Usuário'}
                </h3>
                <button
                  onClick={handleCloseModal}
                  className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full text-neutral-400"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-neutral-400 uppercase">Nome Completo</label>
                  <Input
                    required
                    placeholder="Ex: Millena Marido"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-neutral-400 uppercase">E-mail</label>
                  <Input
                    required
                    type="email"
                    placeholder="email@exemplo.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-neutral-400 uppercase">
                    Senha {userId && <span className="text-[10px] lowercase text-neutral-400">(deixe em branco se não quiser alterar)</span>}
                  </label>
                  <Input
                    type="password"
                    required={!userId}
                    placeholder={userId ? '••••••••' : 'Sua senha segura'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-neutral-400 uppercase">Cargo / Nível de Acesso</label>
                  <select
                    className="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-3 text-sm focus:outline-hidden focus:ring-2 focus:ring-purple-500"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                  >
                    <option value="admin">Administrador</option>
                    <option value="manager">Gerente / Manager</option>
                    <option value="technician">Técnico (Acesso Mobile Restrito)</option>
                  </select>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="active-chk"
                    checked={active}
                    onChange={(e) => setActive(e.target.checked)}
                    className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 border-neutral-300"
                  />
                  <label htmlFor="active-chk" className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                    Usuário Ativo (Permite Login)
                  </label>
                </div>
              </form>
            </div>

            <div className="border-t border-neutral-100 dark:border-neutral-800 pt-4 flex gap-3">
              <Button
                variant="outline"
                className="w-1/2 rounded-2xl text-sm"
                onClick={handleCloseModal}
              >
                Cancelar
              </Button>
              <Button
                className="w-1/2 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl text-sm font-bold shadow-md shadow-purple-500/10"
                onClick={handleSubmit}
                disabled={submitting}
              >
                {submitting ? 'Salvando...' : 'Salvar'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
