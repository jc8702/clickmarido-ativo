import { useState, useCallback } from 'react';
import { useAuth } from './useAuth';

interface Product {
  id: string;
  name: string;
  sku: string;
  type: string;
  description: string;
  price: number;
  unit: string;
  category: string;
  active: boolean;
}

interface QuotationItem {
  id: string;
  quotationId: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  notes: string;
  createdAt: string;
  updatedAt: string;
  product: Product;
}

export function useAvailableProducts(search = '', type = '', category = '') {
  const [data, setData] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { getToken } = useAuth();

  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const token = getToken();
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (type) params.set('type', type);
      if (category) params.set('category', category);
      params.set('limit', '50');

      const response = await fetch(`/api/products/available?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error('Erro ao carregar produtos');
      }

      const result = await response.json();
      setData(result.data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [search, type, category, getToken]);

  return { data, isLoading, error, mutate: fetchProducts };
}

export function useAddQuotationItem() {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { getToken } = useAuth();

  const mutateAsync = useCallback(
    async (quotationId: string, productId: string, quantity: number, notes = '') => {
      setIsPending(true);
      setError(null);

      try {
        const token = getToken();
        const response = await fetch('/api/quotation-items', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            quotationId,
            productId,
            quantity,
            notes,
          }),
        });

        if (!response.ok) {
          const err = await response.json();
          throw new Error(err.error || 'Erro ao adicionar item');
        }

        return await response.json();
      } catch (err: any) {
        setError(err.message);
        throw err;
      } finally {
        setIsPending(false);
      }
    },
    [getToken]
  );

  return { mutateAsync, isPending, error };
}

export function useUpdateQuotationItem() {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { getToken } = useAuth();

  const mutateAsync = useCallback(
    async (itemId: string, data: { quantity?: number; unitPrice?: number; notes?: string }) => {
      setIsPending(true);
      setError(null);

      try {
        const token = getToken();
        const response = await fetch(`/api/quotation-items/${itemId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          const err = await response.json();
          throw new Error(err.error || 'Erro ao atualizar item');
        }

        return await response.json();
      } catch (err: any) {
        setError(err.message);
        throw err;
      } finally {
        setIsPending(false);
      }
    },
    [getToken]
  );

  return { mutateAsync, isPending, error };
}

export function useDeleteQuotationItem() {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { getToken } = useAuth();

  const mutateAsync = useCallback(
    async (itemId: string) => {
      setIsPending(true);
      setError(null);

      try {
        const token = getToken();
        const response = await fetch(`/api/quotation-items/${itemId}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
          const err = await response.json();
          throw new Error(err.error || 'Erro ao remover item');
        }

        return await response.json();
      } catch (err: any) {
        setError(err.message);
        throw err;
      } finally {
        setIsPending(false);
      }
    },
    [getToken]
  );

  return { mutateAsync, isPending, error };
}
