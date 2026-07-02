import useSWR from 'swr';
import { useCallback } from 'react';

const fetcher = async (url: string) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const res = await fetch(url, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Erro de rede' }));
    throw new Error(error.error || 'Falha ao buscar dados');
  }
  return res.json();
};

// --- Tipos ---

export interface TechnicianListItem {
  id: string;
  name: string;
  email: string;
  phone: string;
  specialty: string;
  active: boolean;
  document: string;
  address: string;
  avatarUrl: string | null;
  bio: string;
  hourlyRate: number | null;
  hireDate: string | null;
  createdAt: string;
  updatedAt: string;
  avgRating: number | null;
  _count: {
    serviceOrders: number;
    appointments: number;
    reviews: number;
  };
}

export interface TechnicianDetail extends TechnicianListItem {
  reviews: {
    id: string;
    rating: number;
    comment: string | null;
    createdAt: string;
    customer: { id: string; name: string };
    serviceOrder: { id: string; number: string };
  }[];
  serviceOrders: {
    id: string;
    number: string;
    status: string;
    finalTotal: number;
    scheduledTime: string | null;
    startedAt: string | null;
    completedAt: string | null;
    createdAt: string;
    customer: { id: string; name: string };
  }[];
  appointments: {
    id: string;
    date: string;
    duration: number;
    status: string;
    location: string;
    customer: { id: string; name: string; phone: string };
    serviceOrder: { id: string; number: string };
  }[];
  stats: {
    avgRating: number | null;
    ratingDistribution: Record<number, number>;
    totalOrders: number;
    completedOrders: number;
    inProgressOrders: number;
    totalRevenue: number;
    avgTicket: number;
    avgCompletionDays: number | null;
    totalReviews: number;
    upcomingAppointments: number;
  };
}

export interface TechnicianPerformance {
  technicianId: string;
  technicianName: string;
  monthlyTimeline: { month: string; concluidas: number; receita: number }[];
  statusBreakdown: Record<string, number>;
  topCustomers: { id: string; name: string; count: number; total: number }[];
  summary: {
    totalOrders: number;
    completed: number;
    inProgress: number;
    scheduled: number;
  };
}

export interface TechnicianFormData {
  name: string;
  email?: string;
  phone?: string;
  specialty?: string;
  document?: string;
  address?: string;
  bio?: string;
  hourlyRate?: number | string | null;
  hireDate?: string | null;
  avatarUrl?: string | null;
  active?: boolean;
}

// --- Hooks ---

export function useTechnicians(params: { search?: string; active?: string; page?: number; limit?: number } = {}) {
  const query = new URLSearchParams();
  if (params.search) query.set('search', params.search);
  if (params.active) query.set('active', params.active);
  if (params.page) query.set('page', params.page.toString());
  if (params.limit) query.set('limit', params.limit.toString());

  const { data, error, mutate, isLoading } = useSWR<{
    data: TechnicianListItem[];
    total: number;
    page: number;
    totalPages: number;
  }>(`/api/technicians?${query.toString()}`, fetcher);

  return {
    technicians: data?.data || [],
    total: data?.total || 0,
    page: data?.page || 1,
    totalPages: data?.totalPages || 0,
    isLoading,
    isError: error,
    mutate,
  };
}

export function useTechnicianDetail(id: string | null) {
  const { data, error, mutate, isLoading } = useSWR<TechnicianDetail>(
    id ? `/api/technicians/${id}` : null,
    fetcher
  );

  return {
    technician: data || null,
    isLoading,
    isError: error,
    mutate,
  };
}

export function useTechnicianPerformance(id: string | null) {
  const { data, error, mutate, isLoading } = useSWR<TechnicianPerformance>(
    id ? `/api/technicians/${id}/performance` : null,
    fetcher
  );

  return {
    performance: data || null,
    isLoading,
    isError: error,
    mutate,
  };
}

// --- Ações ---

function getAuthHeaders(): HeadersInit {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export function useTechnicianActions() {
  const create = useCallback(async (data: TechnicianFormData) => {
    const res = await fetch('/api/technicians', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Erro ao criar' }));
      throw new Error(err.error);
    }
    return res.json();
  }, []);

  const update = useCallback(async (id: string, data: Partial<TechnicianFormData>) => {
    const res = await fetch(`/api/technicians/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Erro ao atualizar' }));
      throw new Error(err.error);
    }
    return res.json();
  }, []);

  const toggleActive = useCallback(async (id: string, active: boolean) => {
    const res = await fetch(`/api/technicians/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ active }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Erro ao atualizar status' }));
      throw new Error(err.error);
    }
    return res.json();
  }, []);

  const remove = useCallback(async (id: string) => {
    const res = await fetch(`/api/technicians/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Erro ao remover' }));
      throw new Error(err.error);
    }
    return res.json();
  }, []);

  return { create, update, toggleActive, remove };
}
