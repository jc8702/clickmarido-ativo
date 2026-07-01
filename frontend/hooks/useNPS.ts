import useSWR from 'swr';

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to fetch');
  }
  return res.json();
};

export interface NPSResponse {
  id: string;
  clientId: string;
  score: number;
  feedback: string | null;
  createdAt: string;
  customer?: {
    name: string;
    phone: string;
  };
}

export interface NPSMetrics {
  npsScore: number;
  totalResponses: number;
  promoters: number;
  detractors: number;
  passives: number;
}

export function useNPS(params: { page?: number; limit?: number } = {}) {
  const query = new URLSearchParams();
  if (params.page) query.set('page', params.page.toString());
  if (params.limit) query.set('limit', params.limit.toString());

  const { data, error, mutate, isLoading } = useSWR<{
    metrics: NPSMetrics;
    history: NPSResponse[];
    total: number;
    page: number;
    totalPages: number;
  }>(`/api/nps?${query.toString()}`, fetcher);

  return {
    metrics: data?.metrics,
    history: data?.history || [],
    total: data?.total || 0,
    page: data?.page || 1,
    totalPages: data?.totalPages || 0,
    isLoading,
    isError: error,
    mutate,
  };
}

export interface NPSPending {
  paymentId: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  paymentAmount: number;
  paymentDate: string;
}

export function usePendingNPS() {
  const { data, error, mutate, isLoading } = useSWR<{
    success: boolean;
    data: NPSPending[];
  }>(`/api/nps/pending`, fetcher);

  return {
    pending: data?.data || [],
    isLoading,
    isError: error,
    mutate,
  };
}
