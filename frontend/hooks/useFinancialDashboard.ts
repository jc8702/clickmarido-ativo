import { useState, useCallback, useEffect } from 'react';
import { useAuth } from './useAuth';

interface FinancialDashboard {
  bankAccounts: {
    id: string;
    bankName: string;
    nickname?: string;
    currentBalance: number;
    accountType: string;
    color?: string;
  }[];
  totalBalance: number;
  receivables: {
    total: number;
    paid: number;
    pending: number;
    count: number;
  };
  overdueReceivables: {
    total: number;
    paid: number;
    count: number;
  };
  payables: {
    total: number;
    paid: number;
    pending: number;
    count: number;
  };
  overduePayables: {
    total: number;
    paid: number;
    count: number;
  };
  recurringExpenses: {
    total: number;
    count: number;
  };
  projection: {
    inflow: number;
    outflow: number;
    net: number;
  };
  recentActivity: {
    receivables: any[];
    payables: any[];
  };
}

export function useFinancialDashboard() {
  const [data, setData] = useState<FinancialDashboard | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { getToken } = useAuth();

  const mutate = useCallback(async () => {
    setIsLoading(true);
    try {
      const token = getToken();
      const response = await fetch('/api/financeiro/dashboard', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const result = await response.json();
        setData(result);
      } else {
        console.error('[Financeiro] API error:', response.status, await response.text());
      }
    } finally {
      setIsLoading(false);
    }
  }, [getToken]);

  useEffect(() => { mutate(); }, [mutate]);

  return {
    data,
    isLoading,
    mutate,
  };
}
