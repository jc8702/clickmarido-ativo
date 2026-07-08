import { useState, useCallback, useEffect } from 'react';
import { useAuth } from './useAuth';

interface BankReconciliation {
  id: string;
  bankAccountId: string;
  transactionDate: string;
  description: string;
  amount: number;
  type: string;
  isReconciled: boolean;
  reconciledAt?: string;
  referenceType?: string;
  referenceId?: string;
  documentNumber?: string;
  notes?: string;
  bankAccount?: { id: string; bankName: string; nickname?: string; accountNumber: string };
}

interface BankReconciliationResponse {
  data: BankReconciliation[];
  pendingSummary: { bankAccountId: string; _sum: { amount: number }; _count: number }[];
}

export function useBankReconciliation(filters?: { bankAccountId?: string; isReconciled?: boolean }) {
  const [data, setData] = useState<BankReconciliationResponse>({ data: [], pendingSummary: [] });
  const [isLoading, setIsLoading] = useState(true);
  const { getToken } = useAuth();

  const mutate = useCallback(async () => {
    setIsLoading(true);
    try {
      const token = getToken();
      const params = new URLSearchParams();
      if (filters?.bankAccountId) params.append('bankAccountId', filters.bankAccountId);
      if (filters?.isReconciled !== undefined) params.append('isReconciled', String(filters.isReconciled));

      const response = await fetch(`/api/financeiro/bank-reconciliation?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const result = await response.json();
        setData(result);
      }
    } finally {
      setIsLoading(false);
    }
  }, [getToken, filters?.bankAccountId, filters?.isReconciled]);

  useEffect(() => { mutate(); }, [mutate]);

  const createReconciliation = async (reconciliation: Partial<BankReconciliation>) => {
    const token = getToken();
    const response = await fetch('/api/financeiro/bank-reconciliation', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(reconciliation),
    });
    if (!response.ok) throw new Error('Erro ao criar conciliação');
    await mutate();
    return response.json();
  };

  const reconcile = async (id: string) => {
    const token = getToken();
    const response = await fetch(`/api/financeiro/bank-reconciliation/${id}/reconcile`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) throw new Error('Erro ao conciliar');
    await mutate();
    return response.json();
  };

  return {
    data,
    isLoading,
    mutate,
    createReconciliation,
    reconcile,
  };
}
