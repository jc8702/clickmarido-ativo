import { useState, useCallback, useEffect } from 'react';
import { useAuth } from './useAuth';

export interface ServiceOrder {
  id: string;
  number: string;
  quotationId: string;
  customerId: string;
  technicianId: string | null;
  scheduledTime: string | null;
  startedAt: string | null;
  completedAt: string | null;
  status: string;
  address: string;
  notes: string;
  finalTotal: number;
  createdAt: string;
  customer?: any;
  technician?: any;
  quotation?: any;
  photos?: any[];
  automationLog?: any;
  signature?: any;
  productUsages?: any[];
}

export function useServiceOrders(page = 1, status?: string, search?: string) {
  const [data, setData] = useState<{ data: ServiceOrder[]; meta: any }>({ data: [], meta: { total: 0 } });
  const [isLoading, setIsLoading] = useState(false);
  const { getToken } = useAuth();

  const mutate = useCallback(async () => {
    setIsLoading(true);
    try {
      const token = getToken();
      const params = new URLSearchParams({ page: String(page) });
      if (status) params.set('status', status);
      if (search) params.set('search', search);

      const response = await fetch(`/api/service-orders?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        setData(await response.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [page, status, search, getToken]);

  useEffect(() => {
    mutate();
  }, [mutate]);

  return { data, isLoading, mutate };
}

export function useServiceOrder(id: string) {
  const [data, setData] = useState<ServiceOrder | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { getToken } = useAuth();

  const fetchOrder = async () => {
    if (!id) return;
    try {
      const token = getToken();
      const response = await fetch(`/api/service-orders/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) setData(await response.json());
    } catch (err) {
      console.error('Error fetching service order:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
  }, [id, getToken]);

  return { data, isLoading, mutate: fetchOrder };
}

export function useCreateServiceOrder() {
  const [isPending, setIsPending] = useState(false);
  const { getToken } = useAuth();

  const mutateAsync = async (formData: any) => {
    setIsPending(true);
    try {
      const token = getToken();
      const response = await fetch('/api/service-orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error('Erro ao criar OS');
      return await response.json();
    } finally {
      setIsPending(false);
    }
  };

  return { mutateAsync, isPending };
}

export function useUpdateServiceOrder(id: string) {
  const [isPending, setIsPending] = useState(false);
  const { getToken } = useAuth();

  const mutateAsync = async (formData: any) => {
    setIsPending(true);
    try {
      const token = getToken();
      const response = await fetch(`/api/service-orders/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error('Erro ao atualizar OS');
      return await response.json();
    } finally {
      setIsPending(false);
    }
  };

  return { mutateAsync, isPending };
}

export function useStartServiceOrder() {
  const [isPending, setIsPending] = useState(false);
  const { getToken } = useAuth();

  const mutateAsync = async (id: string) => {
    setIsPending(true);
    try {
      const token = getToken();
      const response = await fetch(`/api/service-orders/${id}/start`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Erro ao iniciar OS');
      return await response.json();
    } finally {
      setIsPending(false);
    }
  };

  return { mutateAsync, isPending };
}

export function useCompleteServiceOrder() {
  const [isPending, setIsPending] = useState(false);
  const { getToken } = useAuth();

  const mutateAsync = async (id: string, finalTotal?: number) => {
    setIsPending(true);
    try {
      const token = getToken();
      const response = await fetch(`/api/service-orders/${id}/complete`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ final_total: finalTotal }),
      });

      if (!response.ok) throw new Error('Erro ao concluir OS');
      return await response.json();
    } finally {
      setIsPending(false);
    }
  };

  return { mutateAsync, isPending };
}
