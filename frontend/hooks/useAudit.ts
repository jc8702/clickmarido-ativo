import useSWR from 'swr';

const fetcher = async (url: string) => {
  const token = localStorage.getItem('token');
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to fetch audit logs');
  }
  return res.json();
};

export interface AuditLogItem {
  id: string;
  entity: string;
  entityId: string;
  action: string;
  oldValue: any;
  newValue: any;
  createdAt: string;
  createdBy: string | null;
}

export function useAudit(params: { page?: number; limit?: number; entity?: string } = {}) {
  const query = new URLSearchParams();
  if (params.page) query.set('page', params.page.toString());
  if (params.limit) query.set('limit', params.limit.toString());
  if (params.entity) query.set('entity', params.entity);

  const { data, error, mutate, isLoading } = useSWR<{
    logs: AuditLogItem[];
    total: number;
    page: number;
    totalPages: number;
  }>(`/api/audit?${query.toString()}`, fetcher);

  return {
    logs: data?.logs || [],
    total: data?.total || 0,
    page: data?.page || 1,
    totalPages: data?.totalPages || 0,
    isLoading,
    isError: error,
    mutate,
  };
}
