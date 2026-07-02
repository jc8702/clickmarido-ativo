'use client';

import React, { useState, useMemo } from 'react';
import {
  useTechnicians,
  useTechnicianDetail,
  useTechnicianPerformance,
  useTechnicianActions,
  TechnicianFormData,
  TechnicianListItem,
} from '@/hooks/useTechnicians';
import { useEscapeToClose } from '@/hooks/useEscapeToClose';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/Card';
import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Modal } from '@/components/Modal';
import { TableShimmer } from '@/components/Shimmer';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, PieChart, Pie, Cell, Legend,
} from 'recharts';

// ─── Constantes ─────────────────────────────────────────────
const STATUS_COLORS: Record<string, string> = {
  concluida: '#10b981',
  em_execucao: '#3b82f6',
  agendada: '#f59e0b',
  cancelada: '#ef4444',
};

const STATUS_LABELS: Record<string, string> = {
  concluida: 'Concluída',
  em_execucao: 'Em Execução',
  agendada: 'Agendada',
  cancelada: 'Cancelada',
};

const INITIAL_FORM: TechnicianFormData = {
  name: '', email: '', phone: '', specialty: '',
  document: '', address: '', bio: '', hourlyRate: null, hireDate: null,
};

// ─── Componentes Auxiliares ──────────────────────────────────

function StarRating({ rating, size = 'md' }: { rating: number | null; size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = { sm: 'w-3.5 h-3.5', md: 'w-5 h-5', lg: 'w-6 h-6' };
  if (rating === null) {
    return <span className="text-xs text-neutral-400 italic">Sem avaliações</span>;
  }
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          className={`${sizeClasses[size]} ${
            star <= Math.round(rating) ? 'text-amber-400' : 'text-neutral-300 dark:text-neutral-600'
          }`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
      <span className="ml-1 text-sm font-bold text-neutral-700 dark:text-neutral-300">{rating.toFixed(1)}</span>
    </div>
  );
}

function StatCard({ label, value, icon, color = 'primary' }: { label: string; value: string | number; icon: React.ReactNode; color?: string }) {
  const colorMap: Record<string, string> = {
    primary: 'from-primary-500 to-primary-700',
    emerald: 'from-emerald-500 to-teal-600',
    amber: 'from-amber-500 to-orange-600',
    sky: 'from-sky-500 to-blue-600',
    rose: 'from-rose-500 to-red-600',
    violet: 'from-violet-500 to-purple-600',
  };
  return (
    <Card className="border-0 shadow-md overflow-hidden relative group hover:shadow-lg transition-shadow">
      <div className={`absolute top-0 left-0 w-1 h-full bg-gradient-to-b ${colorMap[color] || colorMap.primary}`} />
      <CardContent className="p-5 flex items-center gap-4">
        <div className={`p-3 rounded-xl bg-gradient-to-br ${colorMap[color] || colorMap.primary} text-white shadow-lg`}>
          {icon}
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">{label}</p>
          <p className="text-2xl font-black text-neutral-900 dark:text-neutral-100 tracking-tight">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function AvatarPlaceholder({ name, size = 48 }: { name: string; size?: number }) {
  const initials = name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
  const colors = [
    'from-primary-500 to-primary-700',
    'from-emerald-500 to-teal-600',
    'from-amber-500 to-orange-600',
    'from-sky-500 to-blue-600',
    'from-rose-500 to-red-600',
    'from-violet-500 to-purple-600',
    'from-cyan-500 to-blue-600',
  ];
  const colorIndex = name.charCodeAt(0) % colors.length;
  return (
    <div
      className={`rounded-full bg-gradient-to-br ${colors[colorIndex]} flex items-center justify-center text-white font-bold shadow-md`}
      style={{ width: size, height: size, fontSize: size * 0.36 }}
    >
      {initials}
    </div>
  );
}

// ─── Icons ───────────────────────────────────────────────────

const IconOS = (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const IconMoney = (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const IconStar = (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
  </svg>
);

const IconClock = (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const IconCalendar = (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const IconTrophy = (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
  </svg>
);

// ─── Página Principal ────────────────────────────────────────

export default function TechniciansPage() {
  const [search, setSearch] = useState('');
  const [showInactive, setShowInactive] = useState(false);
  const [activeTab, setActiveTab] = useState<'team' | 'performance' | 'profile'>('team');
  const [selectedTechId, setSelectedTechId] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<TechnicianFormData>({ ...INITIAL_FORM });
  const [saving, setSaving] = useState(false);

  // Modal de Exclusão
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [techToDelete, setTechToDelete] = useState<TechnicianListItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEscapeToClose(showModal, () => setShowModal(false));
  useEscapeToClose(showDeleteModal, () => setShowDeleteModal(false));

  const { technicians, isLoading, mutate } = useTechnicians({
    search,
    active: showInactive ? 'all' : undefined,
  });
  const { technician: selectedTech, isLoading: detailLoading } = useTechnicianDetail(selectedTechId);
  const { performance, isLoading: perfLoading } = useTechnicianPerformance(selectedTechId);
  const { create, update, toggleActive, remove } = useTechnicianActions();

  // ─── Handlers ───────────────────────────────────

  const openCreate = () => {
    setForm({ ...INITIAL_FORM });
    setEditingId(null);
    setShowModal(true);
  };

  const openEdit = (tech: TechnicianListItem) => {
    setForm({
      name: tech.name,
      email: tech.email,
      phone: tech.phone,
      specialty: tech.specialty,
      document: tech.document || '',
      address: tech.address || '',
      bio: tech.bio || '',
      hourlyRate: tech.hourlyRate,
      hireDate: tech.hireDate ? tech.hireDate.split('T')[0] : null,
    });
    setEditingId(tech.id);
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      if (editingId) {
        await update(editingId, form);
      } else {
        await create(form);
      }
      setShowModal(false);
      mutate();
    } catch (e: any) {
      alert(e.message || 'Erro ao salvar');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (tech: TechnicianListItem) => {
    try {
      await toggleActive(tech.id, !tech.active);
      mutate();
    } catch (e: any) {
      alert(e.message || 'Erro');
    }
  };

  const confirmDelete = (tech: TechnicianListItem) => {
    setTechToDelete(tech);
    setShowDeleteModal(true);
  };

  const handleDelete = async () => {
    if (!techToDelete) return;
    setDeleting(true);
    try {
      await remove(techToDelete.id);
      setShowDeleteModal(false);
      setTechToDelete(null);
      if (selectedTechId === techToDelete.id) {
        setSelectedTechId(null);
        setActiveTab('team');
      }
      mutate();
    } catch (e: any) {
      alert(e.message || 'Erro ao remover');
    } finally {
      setDeleting(false);
    }
  };

  const openProfile = (id: string) => {
    setSelectedTechId(id);
    setActiveTab('profile');
  };

  // ─── Dados para Performance ─────────────────────

  const rankingByRating = useMemo(() => {
    return [...technicians]
      .filter((t) => t.avgRating !== null)
      .sort((a, b) => (b.avgRating || 0) - (a.avgRating || 0));
  }, [technicians]);

  const rankingByOrders = useMemo(() => {
    return [...technicians]
      .sort((a, b) => b._count.serviceOrders - a._count.serviceOrders);
  }, [technicians]);

  const bestRated = rankingByRating[0] || null;
  const mostProductive = rankingByOrders[0] || null;

  // ─── Chart Data ─────────────────────────────────

  const teamChartData = useMemo(() => {
    return technicians.slice(0, 10).map((t) => ({
      name: t.name.split(' ')[0],
      OS: t._count.serviceOrders,
      rating: t.avgRating || 0,
    }));
  }, [technicians]);

  // ─── Rating Distribution Chart ──────────────────

  const ratingDistChartData = useMemo(() => {
    if (!selectedTech?.stats?.ratingDistribution) return [];
    return Object.entries(selectedTech.stats.ratingDistribution).map(([star, count]) => ({
      name: `${star}★`,
      value: count as number,
      color: Number(star) >= 4 ? '#10b981' : Number(star) >= 3 ? '#f59e0b' : '#ef4444',
    }));
  }, [selectedTech]);

  // ─── Status Pie ─────────────────────────────────

  const statusPieData = useMemo(() => {
    if (!performance?.statusBreakdown) return [];
    return Object.entries(performance.statusBreakdown).map(([status, count]) => ({
      name: STATUS_LABELS[status] || status,
      value: count,
      color: STATUS_COLORS[status] || '#6b7280',
    }));
  }, [performance]);

  // ─── Render ─────────────────────────────────────

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-neutral-900 dark:text-neutral-100">
            Equipe Técnica
          </h1>
          <p className="text-lg text-neutral-500 dark:text-neutral-400 mt-2">
            Cadastro, performance e avaliações dos técnicos.
          </p>
        </div>
        <div className="flex bg-neutral-100 dark:bg-neutral-800 p-1 rounded-lg">
          {(['team', 'performance', 'profile'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => {
                if (tab === 'profile' && !selectedTechId) return;
                setActiveTab(tab);
              }}
              disabled={tab === 'profile' && !selectedTechId}
              className={`px-4 py-2 text-sm font-semibold rounded-md transition-all ${
                activeTab === tab
                  ? 'bg-white dark:bg-neutral-700 shadow-sm text-primary-600 dark:text-primary-400'
                  : tab === 'profile' && !selectedTechId
                  ? 'text-neutral-300 dark:text-neutral-600 cursor-not-allowed'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
              }`}
            >
              {tab === 'team' ? 'Equipe' : tab === 'performance' ? 'Performance' : 'Perfil'}
            </button>
          ))}
        </div>
      </div>

      {/* ═══ ABA: EQUIPE ═══ */}
      {activeTab === 'team' && (
        <div className="space-y-6">
          {/* Barra de busca + ações */}
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
            <div className="flex gap-3 items-center flex-1 w-full sm:w-auto">
              <div className="relative flex-1 max-w-md">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Buscar por nome, especialidade..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
                />
              </div>
              <label className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400 cursor-pointer select-none whitespace-nowrap">
                <input
                  type="checkbox"
                  checked={showInactive}
                  onChange={(e) => setShowInactive(e.target.checked)}
                  className="rounded border-neutral-300 dark:border-neutral-600 text-primary-600 focus:ring-primary-500"
                />
                Inativos
              </label>
            </div>
            <Button onClick={openCreate} className="shrink-0">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Novo Técnico
            </Button>
          </div>

          {/* Grid de Cards */}
          {isLoading ? (
            <TableShimmer />
          ) : technicians.length === 0 ? (
            <Card className="border-0 shadow-md">
              <CardContent className="py-16 text-center">
                <div className="mx-auto w-16 h-16 bg-neutral-100 dark:bg-neutral-800 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-neutral-400" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                  </svg>
                </div>
                <p className="text-neutral-500 dark:text-neutral-400 text-lg font-medium">Nenhum técnico encontrado</p>
                <p className="text-neutral-400 dark:text-neutral-500 text-sm mt-1">Cadastre o primeiro técnico da equipe.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {technicians.map((tech) => (
                <Card
                  key={tech.id}
                  className={`border-0 shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer group ${
                    !tech.active ? 'opacity-60' : ''
                  }`}
                  onClick={() => openProfile(tech.id)}
                >
                  <CardContent className="p-5">
                    <div className="flex items-start gap-4">
                      <AvatarPlaceholder name={tech.name} size={56} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100 truncate group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                            {tech.name}
                          </h3>
                          {!tech.active && (
                            <Badge variant="danger">Inativo</Badge>
                          )}
                        </div>
                        {tech.specialty && (
                          <p className="text-sm text-primary-600 dark:text-primary-400 font-medium mb-1">{tech.specialty}</p>
                        )}
                        <StarRating rating={tech.avgRating} size="sm" />
                      </div>
                    </div>

                    {/* Métricas rápidas */}
                    <div className="mt-4 grid grid-cols-3 gap-3">
                      <div className="text-center py-2 px-1 bg-neutral-50 dark:bg-neutral-800/50 rounded-lg">
                        <p className="text-lg font-bold text-neutral-900 dark:text-neutral-100">{tech._count.serviceOrders}</p>
                        <p className="text-[10px] uppercase tracking-wider text-neutral-500 dark:text-neutral-400 font-semibold">OS</p>
                      </div>
                      <div className="text-center py-2 px-1 bg-neutral-50 dark:bg-neutral-800/50 rounded-lg">
                        <p className="text-lg font-bold text-neutral-900 dark:text-neutral-100">{tech._count.reviews}</p>
                        <p className="text-[10px] uppercase tracking-wider text-neutral-500 dark:text-neutral-400 font-semibold">Avaliações</p>
                      </div>
                      <div className="text-center py-2 px-1 bg-neutral-50 dark:bg-neutral-800/50 rounded-lg">
                        <p className="text-lg font-bold text-neutral-900 dark:text-neutral-100">{tech._count.appointments}</p>
                        <p className="text-[10px] uppercase tracking-wider text-neutral-500 dark:text-neutral-400 font-semibold">Agenda</p>
                      </div>
                    </div>

                    {/* Contato */}
                    <div className="mt-3 flex items-center gap-4 text-xs text-neutral-500 dark:text-neutral-400">
                      {tech.phone && (
                        <span className="flex items-center gap-1">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
                          {tech.phone}
                        </span>
                      )}
                      {tech.email && (
                        <span className="flex items-center gap-1 truncate">
                          <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                          {tech.email}
                        </span>
                      )}
                    </div>

                    {/* Ações */}
                    <div className="mt-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => { e.stopPropagation(); openEdit(tech); }}
                        className="flex-1 py-1.5 text-xs font-semibold text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-950/30 rounded-lg hover:bg-primary-100 dark:hover:bg-primary-900/40 transition-colors"
                      >
                        Editar
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleToggle(tech); }}
                        className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                          tech.active
                            ? 'text-rose-600 bg-rose-50 dark:bg-rose-950/30 hover:bg-rose-100 dark:hover:bg-rose-900/40'
                            : 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 hover:bg-emerald-100 dark:hover:bg-emerald-900/40'
                        }`}
                      >
                        {tech.active ? 'Desativar' : 'Reativar'}
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); confirmDelete(tech); }}
                        className="flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors text-red-600 bg-red-50 dark:bg-red-950/30 hover:bg-red-100 dark:hover:bg-red-900/40"
                      >
                        Excluir
                      </button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ═══ ABA: PERFORMANCE ═══ */}
      {activeTab === 'performance' && (
        <div className="space-y-6">
          {/* Destaques */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {bestRated && (
              <Card className="border-0 shadow-lg overflow-hidden relative">
                <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-orange-500/5" />
                <CardContent className="p-6 relative z-10 text-center">
                  <div className="mx-auto mb-3">
                    <AvatarPlaceholder name={bestRated.name} size={64} />
                  </div>
                  <p className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 mb-1">⭐ Melhor Avaliado</p>
                  <p className="text-lg font-bold text-neutral-900 dark:text-neutral-100">{bestRated.name}</p>
                  <StarRating rating={bestRated.avgRating} size="md" />
                  <p className="text-xs text-neutral-500 mt-1">{bestRated._count.reviews} avaliações</p>
                </CardContent>
              </Card>
            )}
            {mostProductive && (
              <Card className="border-0 shadow-lg overflow-hidden relative">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-teal-500/5" />
                <CardContent className="p-6 relative z-10 text-center">
                  <div className="mx-auto mb-3">
                    <AvatarPlaceholder name={mostProductive.name} size={64} />
                  </div>
                  <p className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-1">🏆 Mais Produtivo</p>
                  <p className="text-lg font-bold text-neutral-900 dark:text-neutral-100">{mostProductive.name}</p>
                  <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{mostProductive._count.serviceOrders}</p>
                  <p className="text-xs text-neutral-500 mt-1">ordens de serviço</p>
                </CardContent>
              </Card>
            )}
            <Card className="border-0 shadow-lg overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-br from-sky-500/5 to-blue-500/5" />
              <CardContent className="p-6 relative z-10 text-center">
                <p className="text-xs font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400 mb-2">Visão Geral</p>
                <div className="grid grid-cols-2 gap-4 mt-3">
                  <div>
                    <p className="text-3xl font-black text-neutral-900 dark:text-neutral-100">{technicians.filter((t) => t.active).length}</p>
                    <p className="text-xs text-neutral-500">Técnicos ativos</p>
                  </div>
                  <div>
                    <p className="text-3xl font-black text-neutral-900 dark:text-neutral-100">
                      {technicians.reduce((sum, t) => sum + t._count.serviceOrders, 0)}
                    </p>
                    <p className="text-xs text-neutral-500">Total de OS</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Gráfico comparativo */}
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle>Comparativo de OS por Técnico</CardTitle>
              <CardDescription>Total de ordens de serviço atribuídas a cada técnico</CardDescription>
            </CardHeader>
            <CardContent>
              {teamChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={teamChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgba(255,255,255,0.95)',
                        border: 'none',
                        borderRadius: '12px',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                      }}
                    />
                    <Bar dataKey="OS" fill="#6366f1" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-center text-neutral-400 py-12">Sem dados para exibir</p>
              )}
            </CardContent>
          </Card>

          {/* Ranking */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle>Ranking por Avaliação</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {rankingByRating.slice(0, 5).map((tech, i) => (
                  <div
                    key={tech.id}
                    className="flex items-center gap-3 p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer transition-colors"
                    onClick={() => openProfile(tech.id)}
                  >
                    <span className={`text-lg font-black w-8 text-center ${i === 0 ? 'text-amber-500' : i === 1 ? 'text-neutral-400' : i === 2 ? 'text-orange-600' : 'text-neutral-300'}`}>
                      {i + 1}º
                    </span>
                    <AvatarPlaceholder name={tech.name} size={36} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 truncate">{tech.name}</p>
                      <StarRating rating={tech.avgRating} size="sm" />
                    </div>
                    <span className="text-xs text-neutral-500">{tech._count.reviews} av.</span>
                  </div>
                ))}
                {rankingByRating.length === 0 && (
                  <p className="text-center text-sm text-neutral-400 py-6">Nenhuma avaliação registrada</p>
                )}
              </CardContent>
            </Card>

            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle>Ranking por OS Realizadas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {rankingByOrders.slice(0, 5).map((tech, i) => (
                  <div
                    key={tech.id}
                    className="flex items-center gap-3 p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer transition-colors"
                    onClick={() => openProfile(tech.id)}
                  >
                    <span className={`text-lg font-black w-8 text-center ${i === 0 ? 'text-emerald-500' : i === 1 ? 'text-neutral-400' : i === 2 ? 'text-orange-600' : 'text-neutral-300'}`}>
                      {i + 1}º
                    </span>
                    <AvatarPlaceholder name={tech.name} size={36} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 truncate">{tech.name}</p>
                      <p className="text-xs text-neutral-500">{tech.specialty || 'Geral'}</p>
                    </div>
                    <span className="text-xl font-bold text-neutral-900 dark:text-neutral-100">{tech._count.serviceOrders}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* ═══ ABA: PERFIL INDIVIDUAL ═══ */}
      {activeTab === 'profile' && selectedTechId && (
        <div className="space-y-6">
          {detailLoading ? (
            <TableShimmer />
          ) : selectedTech ? (
            <>
              {/* Cabeçalho do perfil */}
              <Card className="border-0 shadow-lg overflow-hidden">
                <div className="h-2 bg-gradient-to-r from-primary-500 via-violet-500 to-emerald-500" />
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row items-start md:items-center gap-5">
                    <AvatarPlaceholder name={selectedTech.name} size={80} />
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <h2 className="text-2xl font-extrabold text-neutral-900 dark:text-neutral-100">{selectedTech.name}</h2>
                        <Badge variant={selectedTech.active ? 'success' : 'danger'}>
                          {selectedTech.active ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </div>
                      {selectedTech.specialty && (
                        <p className="text-primary-600 dark:text-primary-400 font-medium">{selectedTech.specialty}</p>
                      )}
                      <div className="flex flex-wrap gap-4 mt-2 text-sm text-neutral-500 dark:text-neutral-400">
                        {selectedTech.phone && <span>📱 {selectedTech.phone}</span>}
                        {selectedTech.email && <span>✉️ {selectedTech.email}</span>}
                        {selectedTech.document && <span>🪪 {selectedTech.document}</span>}
                        {selectedTech.hireDate && (
                          <span>📅 Desde {new Date(selectedTech.hireDate).toLocaleDateString('pt-BR')}</span>
                        )}
                      </div>
                      {selectedTech.bio && (
                        <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400 italic">{selectedTech.bio}</p>
                      )}
                    </div>
                    <StarRating rating={selectedTech.stats.avgRating} size="lg" />
                  </div>
                </CardContent>
              </Card>

              {/* KPIs */}
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
                <StatCard label="Total OS" value={selectedTech.stats.totalOrders} icon={IconOS} color="primary" />
                <StatCard label="Concluídas" value={selectedTech.stats.completedOrders} icon={IconOS} color="emerald" />
                <StatCard label="Em Execução" value={selectedTech.stats.inProgressOrders} icon={IconOS} color="sky" />
                <StatCard
                  label="Receita Total"
                  value={`R$ ${selectedTech.stats.totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}`}
                  icon={IconMoney}
                  color="emerald"
                />
                <StatCard
                  label="Ticket Médio"
                  value={`R$ ${selectedTech.stats.avgTicket.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}`}
                  icon={IconMoney}
                  color="amber"
                />
                <StatCard
                  label="Tempo Médio"
                  value={selectedTech.stats.avgCompletionDays !== null ? `${selectedTech.stats.avgCompletionDays}d` : '-'}
                  icon={IconClock}
                  color="violet"
                />
              </div>

              {/* Gráficos */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Timeline mensal */}
                <Card className="border-0 shadow-md">
                  <CardHeader>
                    <CardTitle>OS Concluídas — Últimos 6 Meses</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {performance?.monthlyTimeline && performance.monthlyTimeline.length > 0 ? (
                      <ResponsiveContainer width="100%" height={260}>
                        <AreaChart data={performance.monthlyTimeline}>
                          <defs>
                            <linearGradient id="gradConcluidas" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#10b981" stopOpacity={0.3} />
                              <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                          <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                          <YAxis tick={{ fontSize: 11 }} />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: 'rgba(255,255,255,0.95)',
                              border: 'none',
                              borderRadius: '12px',
                              boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                            }}
                            formatter={(v: number, name: string) => [
                              name === 'receita' ? `R$ ${v.toLocaleString('pt-BR')}` : v,
                              name === 'receita' ? 'Receita' : 'Concluídas',
                            ]}
                          />
                          <Area type="monotone" dataKey="concluidas" stroke="#10b981" fill="url(#gradConcluidas)" strokeWidth={2} />
                        </AreaChart>
                      </ResponsiveContainer>
                    ) : (
                      <p className="text-center text-neutral-400 py-12">Sem dados</p>
                    )}
                  </CardContent>
                </Card>

                {/* Distribuição de status */}
                <Card className="border-0 shadow-md">
                  <CardHeader>
                    <CardTitle>Distribuição de Status</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {statusPieData.length > 0 ? (
                      <ResponsiveContainer width="100%" height={260}>
                        <PieChart>
                          <Pie
                            data={statusPieData}
                            cx="50%"
                            cy="50%"
                            innerRadius={55}
                            outerRadius={90}
                            paddingAngle={4}
                            dataKey="value"
                          >
                            {statusPieData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <p className="text-center text-neutral-400 py-12">Sem dados</p>
                    )}
                  </CardContent>
                </Card>

                {/* Distribuição de avaliações */}
                <Card className="border-0 shadow-md">
                  <CardHeader>
                    <CardTitle>Avaliações por Estrela</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {ratingDistChartData.some((d) => d.value > 0) ? (
                      <ResponsiveContainer width="100%" height={260}>
                        <BarChart data={ratingDistChartData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                          <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                          <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                          <Tooltip />
                          <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                            {ratingDistChartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <p className="text-center text-neutral-400 py-12">Sem avaliações</p>
                    )}
                  </CardContent>
                </Card>

                {/* Top Clientes */}
                <Card className="border-0 shadow-md">
                  <CardHeader>
                    <CardTitle>Principais Clientes Atendidos</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {performance?.topCustomers && performance.topCustomers.length > 0 ? (
                      performance.topCustomers.map((c, i) => (
                        <div key={c.id} className="flex items-center gap-3 p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/50">
                          <span className="text-lg font-black text-neutral-300 w-6 text-center">{i + 1}</span>
                          <AvatarPlaceholder name={c.name} size={32} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 truncate">{c.name}</p>
                            <p className="text-xs text-neutral-500">{c.count} atendimentos</p>
                          </div>
                          <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                            R$ {c.total.toLocaleString('pt-BR')}
                          </span>
                        </div>
                      ))
                    ) : (
                      <p className="text-center text-sm text-neutral-400 py-6">Sem atendimentos concluídos</p>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Últimas avaliações */}
              <Card className="border-0 shadow-md">
                <CardHeader>
                  <CardTitle>Últimas Avaliações</CardTitle>
                  <CardDescription>{selectedTech.stats.totalReviews} avaliação(ões) no total</CardDescription>
                </CardHeader>
                <CardContent>
                  {selectedTech.reviews.length > 0 ? (
                    <div className="space-y-4">
                      {selectedTech.reviews.slice(0, 10).map((review) => (
                        <div key={review.id} className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-100 dark:border-neutral-700/50">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <AvatarPlaceholder name={review.customer.name} size={28} />
                              <div>
                                <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">{review.customer.name}</p>
                                <p className="text-xs text-neutral-500">OS #{review.serviceOrder.number}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <StarRating rating={review.rating} size="sm" />
                              <span className="text-xs text-neutral-400">
                                {new Date(review.createdAt).toLocaleDateString('pt-BR')}
                              </span>
                            </div>
                          </div>
                          {review.comment && (
                            <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1 italic">"{review.comment}"</p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-neutral-400 py-8">Nenhuma avaliação ainda</p>
                  )}
                </CardContent>
              </Card>

              {/* Próximos agendamentos */}
              {selectedTech.appointments.length > 0 && (
                <Card className="border-0 shadow-md">
                  <CardHeader>
                    <CardTitle>Próximos Agendamentos</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {selectedTech.appointments.map((apt) => (
                        <div key={apt.id} className="flex items-center gap-4 p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/50">
                          <div className="p-2 bg-primary-50 dark:bg-primary-950/30 rounded-lg text-primary-600 dark:text-primary-400">
                            {IconCalendar}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                              OS #{apt.serviceOrder.number} — {apt.customer.name}
                            </p>
                            <p className="text-xs text-neutral-500">{apt.location}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                              {new Date(apt.date).toLocaleDateString('pt-BR')}
                            </p>
                            <p className="text-xs text-neutral-500">
                              {new Date(apt.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} • {apt.duration}min
                            </p>
                          </div>
                          <Badge variant={apt.status === 'confirmada' ? 'success' : apt.status === 'cancelada' ? 'danger' : 'warning'}>
                            {apt.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          ) : (
            <p className="text-center text-neutral-400 py-12">Técnico não encontrado</p>
          )}
        </div>
      )}

      {/* ═══ MODAL DE CADASTRO/EDIÇÃO ═══ */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingId ? 'Editar Técnico' : 'Novo Técnico'}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Nome *</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                placeholder="Nome completo"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Especialidade</label>
              <input
                type="text"
                value={form.specialty || ''}
                onChange={(e) => setForm({ ...form, specialty: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                placeholder="Ex: Elétrica, Hidráulica..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Telefone</label>
              <input
                type="text"
                value={form.phone || ''}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                placeholder="(xx) xxxxx-xxxx"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">E-mail</label>
              <input
                type="email"
                value={form.email || ''}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                placeholder="email@exemplo.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">CPF</label>
              <input
                type="text"
                value={form.document || ''}
                onChange={(e) => setForm({ ...form, document: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                placeholder="000.000.000-00"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Valor/Hora (R$)</label>
              <input
                type="number"
                step="0.01"
                value={form.hourlyRate ?? ''}
                onChange={(e) => setForm({ ...form, hourlyRate: e.target.value || null })}
                className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Data de Contratação</label>
              <input
                type="date"
                value={form.hireDate || ''}
                onChange={(e) => setForm({ ...form, hireDate: e.target.value || null })}
                className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 text-sm focus:ring-2 focus:ring-primary-500 outline-none"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Endereço</label>
            <input
              type="text"
              value={form.address || ''}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 text-sm focus:ring-2 focus:ring-primary-500 outline-none"
              placeholder="Endereço completo"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Biografia / Observações</label>
            <textarea
              value={form.bio || ''}
              onChange={(e) => setForm({ ...form, bio: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 text-sm focus:ring-2 focus:ring-primary-500 outline-none resize-none"
              placeholder="Experiência, certificações, observações..."
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving || !form.name.trim()}>
              {saving ? 'Salvando...' : editingId ? 'Salvar Alterações' : 'Cadastrar Técnico'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* MODAL DE EXCLUSÃO */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Excluir Técnico"
      >
        <div className="space-y-4">
          <p className="text-sm text-neutral-700 dark:text-neutral-300">
            Tem certeza que deseja excluir o técnico <strong>{techToDelete?.name}</strong>?
          </p>
          <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
            <p className="text-xs text-amber-700 dark:text-amber-400 font-semibold">
              Atenção: A exclusão é irreversível.
            </p>
            <p className="text-xs text-amber-600 dark:text-amber-500 mt-1">
              Caso o técnico possua Ordens de Serviço associadas, a exclusão poderá ser bloqueada para manter a integridade dos dados (considere Desativar).
            </p>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setShowDeleteModal(false)}>
              Cancelar
            </Button>
            <Button variant="danger" onClick={handleDelete} isLoading={deleting}>
              Sim, Excluir
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
