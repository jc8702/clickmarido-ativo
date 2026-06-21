import { useState, useCallback, useEffect } from 'react';
import { useAuth } from './useAuth';

export function useQuotations(customerId?: string, page = 1) {
  const [data, setData] = useState({ data: [], meta: { total: 0 } });
  const [isLoading, setIsLoading] = useState(false);
  const { getToken } = useAuth();

  const mutate = useCallback(async () => {
    setIsLoading(true);

    try {
      const token = getToken();
      const query = customerId ? `?customerId=${customerId}` : '';
      const response = await fetch(`/api/quotations${query}&page=${page}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Erro ao carregar orçamentos');
      setData(await response.json());
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [customerId, page, getToken]);

  useEffect(() => {
    mutate();
  }, [mutate]);

  return { data, isLoading, mutate };
}

export function useCreateQuotation() {
  const [isPending, setIsPending] = useState(false);
  const { getToken } = useAuth();

  const mutateAsync = async (formData: any) => {
    setIsPending(true);

    try {
      const token = getToken();
      const response = await fetch('/api/quotations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error('Erro ao criar orçamento');
      return await response.json();
    } finally {
      setIsPending(false);
    }
  };

  return { mutateAsync, isPending };
}

export function useUpdateQuotation(id: string) {
  const [isPending, setIsPending] = useState(false);
  const { getToken } = useAuth();

  const mutateAsync = async (formData: any) => {
    setIsPending(true);

    try {
      const token = getToken();
      const response = await fetch(`/api/quotations/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error('Erro ao atualizar orçamento');
      return await response.json();
    } finally {
      setIsPending(false);
    }
  };

  return { mutateAsync, isPending };
}
