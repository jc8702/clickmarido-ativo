import { useState, useCallback, useEffect, useRef } from 'react';
import { useAuth } from './useAuth';

export function usePurchaseOrders(filters: {
  page?: number;
  search?: string;
  status?: string;
  vendorId?: string;
  quotationId?: string;
  serviceOrderId?: string;
  dateFrom?: string;
  dateTo?: string;
} = {}) {
  const {
    page = 1,
    search = '',
    status = '',
    vendorId = '',
    quotationId = '',
    serviceOrderId = '',
    dateFrom = '',
    dateTo = ''
  } = filters;

  const [data, setData] = useState<{
    data: any[];
    meta: { total: number; page: number; limit: number; totalPages: number };
  }>({ data: [], meta: { total: 0, page, limit: 20, totalPages: 1 } });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { getToken } = useAuth();

  const prevFiltersRef = useRef(JSON.stringify(filters));

  const fetchOrders = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const token = getToken();
      let url = `/api/purchase-orders?page=${page}&limit=20&search=${search}`;
      if (status) url += `&status=${status}`;
      if (vendorId) url += `&vendorId=${vendorId}`;
      if (quotationId) url += `&quotationId=${quotationId}`;
      if (serviceOrderId) url += `&serviceOrderId=${serviceOrderId}`;
      if (dateFrom) url += `&dateFrom=${dateFrom}`;
      if (dateTo) url += `&dateTo=${dateTo}`;

      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Erro ao carregar ordens de compra');
      const result = await response.json();
      setData(result);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [page, search, status, vendorId, quotationId, serviceOrderId, dateFrom, dateTo, getToken]);

  useEffect(() => {
    const currentFiltersStr = JSON.stringify(filters);
    if (prevFiltersRef.current !== currentFiltersStr) {
      prevFiltersRef.current = currentFiltersStr;
      fetchOrders();
    }
  }, [filters, fetchOrders]);

  useEffect(() => {
    fetchOrders();
  }, []);

  return { data, isLoading, error, mutate: fetchOrders };
}

export function usePurchaseOrder(id: string) {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { getToken } = useAuth();

  const fetchOrder = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    setError(null);
    try {
      const token = getToken();
      const response = await fetch(`/api/purchase-orders/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Erro ao buscar ordem de compra');
      setData(await response.json());
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [id, getToken]);

  useEffect(() => {
    fetchOrder();
  }, [id, fetchOrder]);

  return { data, isLoading, error, mutate: fetchOrder };
}

export function useCreatePurchaseOrder() {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { getToken } = useAuth();

  const mutateAsync = async (formData: any) => {
    setIsPending(true);
    setError(null);
    try {
      const token = getToken();
      const response = await fetch('/api/purchase-orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Erro ao criar ordem de compra');
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

export function useUpdatePurchaseOrder(id: string) {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { getToken } = useAuth();

  const mutateAsync = async (formData: any) => {
    setIsPending(true);
    setError(null);
    try {
      const token = getToken();
      const response = await fetch(`/api/purchase-orders/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Erro ao atualizar ordem de compra');
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

export function useDeletePurchaseOrder(id: string) {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { getToken } = useAuth();

  const mutateAsync = async () => {
    setIsPending(true);
    setError(null);
    try {
      const token = getToken();
      const response = await fetch(`/api/purchase-orders/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Erro ao excluir ordem de compra');
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

export function useEmitPurchaseOrder(id: string) {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { getToken } = useAuth();

  const mutateAsync = async () => {
    setIsPending(true);
    setError(null);
    try {
      const token = getToken();
      const response = await fetch(`/api/purchase-orders/${id}/emit`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Erro ao emitir ordem de compra');
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

export function useApprovePurchaseOrder(id: string) {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { getToken } = useAuth();

  const mutateAsync = async () => {
    setIsPending(true);
    setError(null);
    try {
      const token = getToken();
      const response = await fetch(`/api/purchase-orders/${id}/approve`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Erro ao aprovar ordem de compra');
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

export function useReceivePurchaseOrderItems(id: string) {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { getToken } = useAuth();

  const mutateAsync = async (items: { itemId: string; quantityReceived: number }[]) => {
    setIsPending(true);
    setError(null);
    try {
      const token = getToken();
      const response = await fetch(`/api/purchase-orders/${id}/receive`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ items }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Erro ao registrar recebimento');
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

export function useReturnPurchaseOrderItems(id: string) {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { getToken } = useAuth();

  const mutateAsync = async (
    items: { itemId: string; quantityReturned: number }[],
    bankAccountId?: string
  ) => {
    setIsPending(true);
    setError(null);
    try {
      const token = getToken();
      const response = await fetch(`/api/purchase-orders/${id}/return`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ items, bankAccountId }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Erro ao processar devolução');
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

export function useCancelPurchaseOrder(id: string) {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { getToken } = useAuth();

  const mutateAsync = async (reason?: string) => {
    setIsPending(true);
    setError(null);
    try {
      const token = getToken();
      const response = await fetch(`/api/purchase-orders/${id}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ reason }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Erro ao cancelar ordem de compra');
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

export function useCreatePurchaseOrderFromQuotation(quotationId: string) {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { getToken } = useAuth();

  const mutateAsync = async (vendorId: string) => {
    setIsPending(true);
    setError(null);
    try {
      const token = getToken();
      const response = await fetch(`/api/purchase-orders/from-quotation/${quotationId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ vendorId }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Erro ao gerar ordem de compra');
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

export function useCreatePurchaseOrderFromServiceOrder(serviceOrderId: string) {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { getToken } = useAuth();

  const mutateAsync = async (vendorId: string) => {
    setIsPending(true);
    setError(null);
    try {
      const token = getToken();
      const response = await fetch(`/api/purchase-orders/from-service-order/${serviceOrderId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ vendorId }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Erro ao gerar ordem de compra');
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

export function usePurchaseOrdersHistory(page = 1, filters: { purchaseOrderId?: string; type?: string } = {}) {
  const [data, setData] = useState<{
    data: any[];
    meta: { total: number; page: number; limit: number; totalPages: number };
  }>({ data: [], meta: { total: 0, page, limit: 30, totalPages: 1 } });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { getToken } = useAuth();

  const fetchHistory = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const token = getToken();
      let url = `/api/purchase-orders/history?page=${page}&limit=30`;
      if (filters.purchaseOrderId) url += `&purchaseOrderId=${filters.purchaseOrderId}`;
      if (filters.type) url += `&type=${filters.type}`;

      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Erro ao buscar histórico de auditoria');
      setData(await response.json());
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [page, filters.purchaseOrderId, filters.type, getToken]);

  useEffect(() => {
    fetchHistory();
  }, [page, filters.purchaseOrderId, filters.type, fetchHistory]);

  return { data, isLoading, error, mutate: fetchHistory };
}
