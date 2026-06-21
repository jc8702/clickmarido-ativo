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

export function useQuotation(id: string) {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { getToken } = useAuth();

  useEffect(() => {
    const fetchQuotation = async () => {
      try {
        const token = getToken();
        const response = await fetch(`/api/quotations/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.ok) setData(await response.json());
      } catch (err) {
        console.error('Error fetching quotation:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchQuotation();
  }, [id, getToken]);

  return { data, isLoading };
}

export function useSendQuotation() {
  const [isPending, setIsPending] = useState(false);
  const { getToken } = useAuth();

  const mutateAsync = async (id: string, _method?: string) => {
    setIsPending(true);
    try {
      const token = getToken();
      const response = await fetch(`/api/quotations/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: 'enviado' }),
      });
      if (!response.ok) throw new Error('Erro ao enviar orçamento');
      return await response.json();
    } finally {
      setIsPending(false);
    }
  };

  return { mutateAsync, isPending };
}

export function usePublicQuotation(token: string) {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPublicQuotation = async () => {
      try {
        const response = await fetch(`/api/quotations/public/${token}`);
        if (!response.ok) throw new Error('Orçamento não encontrado');
        setData(await response.json());
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    if (token) fetchPublicQuotation();
  }, [token]);

  return { data, isLoading, error };
}

export function useApproveQuotation() {
  const [isPending, setIsPending] = useState(false);
  const { getToken } = useAuth();

  const mutateAsync = async (id: string) => {
    setIsPending(true);
    try {
      const token = getToken();
      const response = await fetch(`/api/quotations/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: 'aceito' }),
      });
      if (!response.ok) throw new Error('Erro ao aprovar orçamento');
      return await response.json();
    } finally {
      setIsPending(false);
    }
  };

  return { mutateAsync, isPending };
}
