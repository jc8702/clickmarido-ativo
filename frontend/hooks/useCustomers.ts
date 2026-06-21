import { useState, useCallback, useEffect } from 'react';
import { useAuth } from './useAuth';

export function useCustomers(page = 1, search = '') {
  const [data, setData] = useState({ data: [], meta: { total: 0, page, limit: 10 } });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { getToken } = useAuth();

  const mutate = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const token = getToken();
      const response = await fetch(
        `/api/customers?page=${page}&limit=20&search=${search}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!response.ok) throw new Error('Erro ao carregar clientes');
      const result = await response.json();
      setData(result);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [page, search, getToken]);

  useEffect(() => {
    mutate();
  }, [mutate]);

  return { data, isLoading, error, mutate };
}

export function useCreateCustomer() {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { getToken } = useAuth();

  const mutateAsync = async (formData: any) => {
    setIsPending(true);
    setError(null);

    try {
      const token = getToken();
      const response = await fetch('/api/customers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Erro ao criar cliente');
      }

      return await response.json();
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setIsPending(false);
    }
  };

  return { mutateAsync, isPending, error };
}

export function useUpdateCustomer(id: string) {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { getToken } = useAuth();

  const mutateAsync = async (formData: any) => {
    setIsPending(true);
    setError(null);

    try {
      const token = getToken();
      const response = await fetch(`/api/customers/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error('Erro ao atualizar cliente');
      return await response.json();
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setIsPending(false);
    }
  };

  return { mutateAsync, isPending, error };
}

export function useDeleteCustomer(id: string) {
  const [isPending, setIsPending] = useState(false);
  const { getToken } = useAuth();

  const mutateAsync = async () => {
    setIsPending(true);

    try {
      const token = getToken();
      const response = await fetch(`/api/customers/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Erro ao deletar cliente');
      return await response.json();
    } finally {
      setIsPending(false);
    }
  };

  return { mutateAsync, isPending };
}
