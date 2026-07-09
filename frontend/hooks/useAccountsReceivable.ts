import { useState, useCallback, useEffect } from 'react';
import { useAuth } from './useAuth';

interface AccountReceivable {
  id: string;
  title: string;
  description?: string;
  totalAmount: number;
  paidAmount: number;
  status: string;
  dueDate: string;
  paidDate?: string;
  origin: string;
  paymentMethod?: string;
  bankAccountId?: string;
  customerId?: string;
  invoiceId?: string;
  chartOfAccountId?: string;
  costCenter?: string;
  discount: number;
  interest: number;
  fine: number;
  installment?: number;
  installmentOf?: string;
  notes?: string;
  customer?: { id: string; name: string; phone?: string };
  bankAccount?: { id: string; bankName: string; nickname?: string };
  chartOfAccount?: { id: string; code: string; name: string };
  invoice?: { id: string; invoiceNumber: string };
}

interface AccountsReceivableResponse {
  data: AccountReceivable[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  summary: {
    totalPending: number;
    totalPaid: number;
    totalOverdue: number;
    overduePaid: number;
  };
}

export function useAccountsReceivable(filters?: {
  status?: string;
  customerId?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}) {
  const [data, setData] = useState<AccountsReceivableResponse>({
    data: [],
    meta: { total: 0, page: 1, limit: 20, totalPages: 0 },
    summary: { totalPending: 0, totalPaid: 0, totalOverdue: 0, overduePaid: 0 },
  });
  const [isLoading, setIsLoading] = useState(true);
  const { getToken } = useAuth();

  const mutate = useCallback(async () => {
    setIsLoading(true);
    try {
      const token = getToken();
      const params = new URLSearchParams();
      if (filters?.status) params.append('status', filters.status);
      if (filters?.customerId) params.append('customerId', filters.customerId);
      if (filters?.startDate) params.append('startDate', filters.startDate);
      if (filters?.endDate) params.append('endDate', filters.endDate);
      if (filters?.page) params.append('page', String(filters.page));
      if (filters?.limit) params.append('limit', String(filters.limit));

      const response = await fetch(`/api/financeiro/accounts-receivable?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const result = await response.json();
        setData(result);
      } else {
        console.error('[AccountsReceivable] API error:', response.status, await response.text());
      }
    } finally {
      setIsLoading(false);
    }
  }, [getToken, filters?.status, filters?.customerId, filters?.startDate, filters?.endDate, filters?.page, filters?.limit]);

  useEffect(() => { mutate(); }, [mutate]);

  const createAccount = async (account: Partial<AccountReceivable>) => {
    const token = getToken();
    const response = await fetch('/api/financeiro/accounts-receivable', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(account),
    });
    if (!response.ok) throw new Error('Erro ao criar conta');
    await mutate();
    return response.json();
  };

  const updateAccount = async (id: string, account: Partial<AccountReceivable>) => {
    const token = getToken();
    const response = await fetch(`/api/financeiro/accounts-receivable/${id}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(account),
    });
    if (!response.ok) throw new Error('Erro ao atualizar conta');
    await mutate();
    return response.json();
  };

  const deleteAccount = async (id: string) => {
    const token = getToken();
    const response = await fetch(`/api/financeiro/accounts-receivable/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) throw new Error('Erro ao excluir conta');
    await mutate();
  };

  const receivePayment = async (
    id: string,
    data: { amount: number; paymentMethod: string; bankAccountId?: string; paymentDate?: string; notes?: string }
  ) => {
    const token = getToken();
    const response = await fetch(`/api/financeiro/accounts-receivable/${id}/pay`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Erro ao registrar recebimento');
    await mutate();
    return response.json();
  };

  return {
    data,
    isLoading,
    mutate,
    createAccount,
    updateAccount,
    deleteAccount,
    receivePayment,
  };
}
