import useSWR from 'swr';

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to fetch');
  }
  return res.json();
};

export interface MessageLog {
  id: string;
  phone: string;
  template: string;
  status: string;
  error: string | null;
  variables: any;
  createdAt: string;
}

export function useMessages(params: { page?: number; limit?: number; search?: string; status?: string } = {}) {
  const query = new URLSearchParams();
  if (params.page) query.set('page', params.page.toString());
  if (params.limit) query.set('limit', params.limit.toString());
  if (params.search) query.set('search', params.search);
  if (params.status) query.set('status', params.status);

  const { data, error, mutate, isLoading } = useSWR<{
    messages: MessageLog[];
    total: number;
    page: number;
    totalPages: number;
  }>(`/api/messages?${query.toString()}`, fetcher);

  return {
    messages: data?.messages || [],
    total: data?.total || 0,
    page: data?.page || 1,
    totalPages: data?.totalPages || 0,
    isLoading,
    isError: error,
    mutate,
  };
}
