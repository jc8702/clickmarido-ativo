// Mock hooks to simulate data fetching (e.g., SWR / React Query)
import { useState, useEffect } from 'react';

// Simulated API calls for the MVP
export function useCustomers(page = 1, search = '') {
  const [data, setData] = useState({ data: [], meta: { total: 0, page, limit: 10 } });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    // Simulate fetch delay
    const timer = setTimeout(() => {
      setData({
        data: [
          { id: '1', name: 'João Silva', phone: '+5511999999999', email: 'joao@example.com', total_orders: 2, total_spent: 1500, average_rating: 5 }
        ],
        meta: { total: 1, page, limit: 10, totalPages: 1 }
      } as any);
      setIsLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, [page, search]);

  return { data, isLoading, mutate: () => {} };
}

export function useCustomer(id: string) {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!id || id === 'new') return;
    setIsLoading(true);
    // Simulate fetch delay
    const timer = setTimeout(() => {
      setData({
        id,
        name: 'João Silva',
        phone: '+5511999999999',
        addresses: [{ id: 'a1', street: 'Rua A', number: '123', neighborhood: 'Centro', city: 'São Paulo', state: 'SP', postal_code: '01000000' }]
      });
      setIsLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, [id]);

  return { data, isLoading };
}

export function useCreateCustomer() {
  const [isPending, setIsPending] = useState(false);

  const mutateAsync = async (data: any) => {
    setIsPending(true);
    await new Promise(r => setTimeout(r, 500));
    setIsPending(false);
    return { id: 'new-id', ...data };
  };

  return { mutateAsync, isPending };
}

export function useUpdateCustomer(id: string) {
  const [isPending, setIsPending] = useState(false);

  const mutateAsync = async (data: any) => {
    setIsPending(true);
    await new Promise(r => setTimeout(r, 500));
    setIsPending(false);
    return { id, ...data };
  };

  return { mutateAsync, isPending };
}
