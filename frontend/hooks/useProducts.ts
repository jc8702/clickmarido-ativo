import { useState, useCallback, useEffect, useRef } from 'react';
import { useAuth } from './useAuth';

export function useProducts(page = 1, search = '', type = '') {
  const [data, setData] = useState({ data: [], meta: { total: 0, page, limit: 50 } });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { getToken } = useAuth();
  const prevPageRef = useRef(page);
  const prevSearchRef = useRef(search);
  const prevTypeRef = useRef(type);

  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const token = getToken();
      const params = new URLSearchParams({ page: String(page), limit: '50' });
      if (search) params.set('search', search);
      if (type) params.set('type', type);

      const response = await fetch(`/api/products?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Erro ao carregar produtos');
      const result = await response.json();
      setData(result);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [page, search, type, getToken]);

  useEffect(() => {
    if (prevPageRef.current !== page || prevSearchRef.current !== search || prevTypeRef.current !== type) {
      prevPageRef.current = page;
      prevSearchRef.current = search;
      prevTypeRef.current = type;
      fetchProducts();
    }
  }, [page, search, type, fetchProducts]);

  useEffect(() => {
    fetchProducts();
  }, []);

  return { data, isLoading, error, mutate: fetchProducts };
}

export function useCreateProduct() {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { getToken } = useAuth();

  const mutateAsync = async (formData: any) => {
    setIsPending(true);
    setError(null);

    try {
      const token = getToken();
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Erro ao criar produto');
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

export function useUpdateProduct(id: string) {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { getToken } = useAuth();

  const mutateAsync = async (formData: any) => {
    setIsPending(true);
    setError(null);

    try {
      const token = getToken();
      const response = await fetch(`/api/products/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error('Erro ao atualizar produto');
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

export function useProduct(id: string) {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { getToken } = useAuth();

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const token = getToken();
        const response = await fetch(`/api/products/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.ok) setData(await response.json());
      } catch (err) {
        console.error('Error fetching product:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProduct();
  }, [id, getToken]);

  return { data, isLoading };
}

export function useDeleteProduct(id: string) {
  const [isPending, setIsPending] = useState(false);
  const { getToken } = useAuth();

  const mutateAsync = async () => {
    setIsPending(true);

    try {
      const token = getToken();
      const response = await fetch(`/api/products/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Erro ao deletar produto');
      return await response.json();
    } finally {
      setIsPending(false);
    }
  };

  return { mutateAsync, isPending };
}
