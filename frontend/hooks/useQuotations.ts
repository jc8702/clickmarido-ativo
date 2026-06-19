import { useState, useEffect } from 'react';

// Mock functions simulating API calls
export function useQuotations(status?: string) {
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    setTimeout(() => {
      setData([
        { id: '1', number: 'ORC-1001', customer_name: 'João Silva', total: 250, status: 'draft', valid_until: '2026-07-20T00:00:00Z' },
        { id: '2', number: 'ORC-1002', customer_name: 'Maria Oliveira', total: 1200, status: 'sent', valid_until: '2026-07-15T00:00:00Z' },
        { id: '3', number: 'ORC-1003', customer_name: 'Carlos Souza', total: 80, status: 'approved', valid_until: '2026-07-10T00:00:00Z' }
      ].filter(q => !status || q.status === status));
      setIsLoading(false);
    }, 500);
  }, [status]);

  return { data, isLoading };
}

export function useQuotation(id: string) {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!id || id === 'new') return;
    setIsLoading(true);
    setTimeout(() => {
      setData({
        id,
        number: 'ORC-1001',
        customer_id: 'cust-123',
        customer_name: 'João Silva',
        items: [{ name: 'Instalação Ar', quantity: 1, unit_price: 300 }],
        subtotal: 300,
        discount: 50,
        total: 250,
        status: 'draft',
        valid_until: '2026-07-20T00:00:00Z',
        approval_link: 'token12345'
      });
      setIsLoading(false);
    }, 500);
  }, [id]);

  return { data, isLoading };
}

export function useCreateQuotation() {
  const [isPending, setIsPending] = useState(false);
  const mutateAsync = async (data: any) => {
    setIsPending(true);
    await new Promise(r => setTimeout(r, 600));
    setIsPending(false);
    return { id: 'new-id', ...data };
  };
  return { mutateAsync, isPending };
}

export function useSendQuotation() {
  const [isPending, setIsPending] = useState(false);
  const mutateAsync = async (id: string, method: string) => {
    setIsPending(true);
    await new Promise(r => setTimeout(r, 600));
    setIsPending(false);
    return { success: true };
  };
  return { mutateAsync, isPending };
}

export function usePublicQuotation(token: string) {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    setIsLoading(true);
    setTimeout(() => {
      if (token === 'expired') {
        setError('Este orçamento já expirou');
      } else {
        setData({
          id: 'q1',
          number: 'ORC-1002',
          items: [{ name: 'Limpeza de calha', quantity: 1, unit_price: 150 }],
          subtotal: 150,
          discount: 0,
          total: 150,
          valid_until: '2026-08-01T00:00:00Z',
          status: 'sent',
          customer_name: 'Maria Oliveira'
        });
      }
      setIsLoading(false);
    }, 800);
  }, [token]);

  return { data, isLoading, error };
}

export function useApproveQuotation() {
  const [isPending, setIsPending] = useState(false);
  const mutateAsync = async (token: string) => {
    setIsPending(true);
    await new Promise(r => setTimeout(r, 800));
    setIsPending(false);
    return { success: true };
  };
  return { mutateAsync, isPending };
}
