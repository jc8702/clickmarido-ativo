import { useState, useCallback, useEffect } from 'react';
import { useAuth } from './useAuth';

export interface Payment {
  id: string;
  quotationId: string;
  customerId: string;
  amount: number;
  method: string;
  status: string;
  pixCode: string;
  description: string;
  paidAt: string | null;
  createdAt: string;
  quotation?: any;
  customer?: any;
}

export function usePayments(page = 1, status?: string) {
  const [data, setData] = useState<{ data: Payment[]; meta: any }>({ data: [], meta: { total: 0 } });
  const [isLoading, setIsLoading] = useState(false);
  const { getToken } = useAuth();

  const mutate = useCallback(async () => {
    setIsLoading(true);
    try {
      const token = getToken();
      const params = new URLSearchParams({ page: String(page) });
      if (status) params.set('status', status);

      const response = await fetch(`/api/payments?${params.toString()}`, {
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
  }, [page, status, getToken]);

  useEffect(() => {
    mutate();
  }, [mutate]);

  return { data, isLoading, mutate };
}

export function useCreatePayment() {
  const [isPending, setIsPending] = useState(false);
  const { getToken } = useAuth();

  const mutateAsync = async (formData: any) => {
    setIsPending(true);
    try {
      const token = getToken();
      const response = await fetch('/api/payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error('Erro ao criar pagamento');
      return await response.json();
    } finally {
      setIsPending(false);
    }
  };

  return { mutateAsync, isPending };
}

export function useApprovePayment() {
  const [isPending, setIsPending] = useState(false);
  const { getToken } = useAuth();

  const mutateAsync = async (id: string) => {
    setIsPending(true);
    try {
      const token = getToken();
      const response = await fetch(`/api/payments/${id}/approve`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Erro ao aprovar pagamento');
      return await response.json();
    } finally {
      setIsPending(false);
    }
  };

  return { mutateAsync, isPending };
}

export function useGeneratePix() {
  const [isPending, setIsPending] = useState(false);
  const { getToken } = useAuth();

  const mutateAsync = async (quotationId: string) => {
    setIsPending(true);
    try {
      const token = getToken();
      const response = await fetch(`/api/payments/${quotationId}/generate-pix`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Erro ao gerar PIX');
      return await response.json();
    } finally {
      setIsPending(false);
    }
  };

  return { mutateAsync, isPending };
}
