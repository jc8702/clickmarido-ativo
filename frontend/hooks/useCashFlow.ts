import { useState, useCallback, useEffect } from 'react';
import { useAuth } from './useAuth';

interface CashFlowData {
  period: { start: string; end: string };
  bankAccounts: { id: string; bankName: string; nickname?: string; currentBalance: number }[];
  totalBalance: number;
  current: {
    receivable: number;
    payable: number;
    receivablePaid: number;
    payablePaid: number;
    netPending: number;
    projected: number;
  };
  items: {
    receivables: any[];
    payables: any[];
  };
  projection: {
    days30: number;
    days60: number;
    days90: number;
  };
  alerts: {
    overdueReceivable: { count: number; total: number };
    overduePayable: { count: number; total: number };
  };
}

export function useCashFlow(filters?: {
  period?: string;
  startDate?: string;
  endDate?: string;
  bankAccountId?: string;
}) {
  const [data, setData] = useState<CashFlowData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { getToken } = useAuth();

  const mutate = useCallback(async () => {
    setIsLoading(true);
    try {
      const token = getToken();
      const params = new URLSearchParams();
      if (filters?.period) params.append('period', filters.period);
      if (filters?.startDate) params.append('startDate', filters.startDate);
      if (filters?.endDate) params.append('endDate', filters.endDate);
      if (filters?.bankAccountId) params.append('bankAccountId', filters.bankAccountId);

      const response = await fetch(`/api/financeiro/cash-flow?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const result = await response.json();
        setData(result);
      }
    } catch (error) {
      console.error('Erro ao buscar fluxo de caixa:', error);
    } finally {
      setIsLoading(false);
    }
  }, [getToken, filters?.period, filters?.startDate, filters?.endDate, filters?.bankAccountId]);

  useEffect(() => { mutate(); }, [mutate]);

  return {
    data,
    isLoading,
    mutate,
  };
}
