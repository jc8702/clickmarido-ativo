import { useState, useCallback, useEffect, useRef } from 'react';
import { useAuth } from './useAuth';

export function useVendors(page = 1, search = '', category = '', classification = '', isActive = '', isBlocked = '') {
  const [data, setData] = useState<{
    data: any[];
    meta: { total: number; page: number; limit: number; totalPages: number };
  }>({ data: [], meta: { total: 0, page, limit: 20, totalPages: 1 } });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { getToken } = useAuth();
  
  const prevPageRef = useRef(page);
  const prevSearchRef = useRef(search);
  const prevCategoryRef = useRef(category);
  const prevClassificationRef = useRef(classification);
  const prevIsActiveRef = useRef(isActive);
  const prevIsBlockedRef = useRef(isBlocked);

  const fetchVendors = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const token = getToken();
      let url = `/api/vendors?page=${page}&limit=20&search=${search}`;
      if (category) url += `&category=${category}`;
      if (classification) url += `&classification=${classification}`;
      if (isActive !== '') url += `&isActive=${isActive}`;
      if (isBlocked !== '') url += `&isBlocked=${isBlocked}`;

      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Erro ao carregar fornecedores');
      const result = await response.json();
      setData(result);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [page, search, category, classification, isActive, isBlocked, getToken]);

  useEffect(() => {
    if (
      prevPageRef.current !== page ||
      prevSearchRef.current !== search ||
      prevCategoryRef.current !== category ||
      prevClassificationRef.current !== classification ||
      prevIsActiveRef.current !== isActive ||
      prevIsBlockedRef.current !== isBlocked
    ) {
      prevPageRef.current = page;
      prevSearchRef.current = search;
      prevCategoryRef.current = category;
      prevClassificationRef.current = classification;
      prevIsActiveRef.current = isActive;
      prevIsBlockedRef.current = isBlocked;
      fetchVendors();
    }
  }, [page, search, category, classification, isActive, isBlocked, fetchVendors]);

  useEffect(() => {
    fetchVendors();
  }, []);

  return { data, isLoading, error, mutate: fetchVendors };
}

export function useVendor(id: string) {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { getToken } = useAuth();

  const fetchVendor = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    setError(null);
    try {
      const token = getToken();
      const response = await fetch(`/api/vendors/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Erro ao buscar fornecedor');
      setData(await response.json());
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [id, getToken]);

  useEffect(() => {
    fetchVendor();
  }, [id, fetchVendor]);

  return { data, isLoading, error, mutate: fetchVendor };
}

export function useCreateVendor() {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { getToken } = useAuth();

  const mutateAsync = async (formData: any) => {
    setIsPending(true);
    setError(null);
    try {
      const token = getToken();
      const response = await fetch('/api/vendors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Erro ao criar fornecedor');
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

export function useUpdateVendor(id: string) {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { getToken } = useAuth();

  const mutateAsync = async (formData: any) => {
    setIsPending(true);
    setError(null);
    try {
      const token = getToken();
      const response = await fetch(`/api/vendors/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Erro ao atualizar fornecedor');
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

export function useVendorPurchaseHistory(id: string, page = 1) {
  const [data, setData] = useState<{
    data: any[];
    meta: { total: number; page: number; limit: number; totalPages: number };
    stats: { totalSpent: number; ordersCount: number };
  }>({ data: [], meta: { total: 0, page, limit: 10, totalPages: 1 }, stats: { totalSpent: 0, ordersCount: 0 } });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { getToken } = useAuth();

  const fetchHistory = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    setError(null);
    try {
      const token = getToken();
      const response = await fetch(`/api/vendors/${id}/purchase-history?page=${page}&limit=10`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Erro ao buscar histórico de compras');
      setData(await response.json());
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [id, page, getToken]);

  useEffect(() => {
    fetchHistory();
  }, [id, page, fetchHistory]);

  return { data, isLoading, error, mutate: fetchHistory };
}

export function useVendorClassificationSummary() {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { getToken } = useAuth();

  const fetchSummary = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const token = getToken();
      const response = await fetch('/api/vendors/classification-summary', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Erro ao buscar resumo de classificações');
      setData(await response.json());
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  return { data, isLoading, error, mutate: fetchSummary };
}
