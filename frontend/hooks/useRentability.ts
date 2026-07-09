import { useState, useCallback, useEffect } from 'react';
import { useAuth } from './useAuth';

interface ProfitabilityData {
  period: { start: string; end: string };
  summary: {
    totalOrders: number;
    totalRevenue: number;
    totalCost: number;
    totalProfit: number;
    averageMargin: number;
  };
  customerAnalysis: {
    customer: { id: string; name: string } | null;
    orders: number;
    totalRevenue: number;
    totalCost: number;
    totalProfit: number;
    margin: number;
  }[];
  mostProfitable: any[];
  leastProfitable: any[];
  allOperations: any[];
}

export function useRentability(filters?: {
  startDate?: string;
  endDate?: string;
  customerId?: string;
  groupBy?: string;
}) {
  const [data, setData] = useState<ProfitabilityData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { getToken } = useAuth();

  const mutate = useCallback(async () => {
    setIsLoading(true);
    try {
      const token = getToken();
      const params = new URLSearchParams();
      if (filters?.startDate) params.append('startDate', filters.startDate);
      if (filters?.endDate) params.append('endDate', filters.endDate);
      if (filters?.customerId) params.append('customerId', filters.customerId);
      if (filters?.groupBy) params.append('groupBy', filters.groupBy);

      const response = await fetch(`/api/financeiro/rentability?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const result = await response.json();
        setData(result);
      } else {
        console.error('[Rentability] API error:', response.status, await response.text());
      }
    } finally {
      setIsLoading(false);
    }
  }, [getToken, filters?.startDate, filters?.endDate, filters?.customerId, filters?.groupBy]);

  useEffect(() => { mutate(); }, [mutate]);

  return {
    data,
    isLoading,
    mutate,
  };
}
