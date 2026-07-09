import { useState, useCallback, useEffect } from 'react';
import { useAuth } from './useAuth';

interface DREData {
  period: { start: string; end: string };
  dre: {
    receitaBruta: number;
    impostosSobreReceita: number;
    descontos: number;
    receitaLiquida: number;
    custosProdutosServicos: number;
    lucroBruto: number;
    despesasOperacionais: number;
    resultadoOperacional: number;
    despesasFinanceiras: number;
    resultadoFinanceiro: number;
    impostos: number;
    lucroLiquido: number;
  };
  margins: {
    gross: number;
    operational: number;
    net: number;
  };
  comparison: {
    previousRevenue: number;
    currentRevenue: number;
    growth: number;
  };
  expensesByCategory: Record<string, number>;
}

export function useDRE(filters?: { startDate?: string; endDate?: string; period?: string }) {
  const [data, setData] = useState<DREData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { getToken } = useAuth();

  const mutate = useCallback(async () => {
    setIsLoading(true);
    try {
      const token = getToken();
      const params = new URLSearchParams();
      if (filters?.startDate) params.append('startDate', filters.startDate);
      if (filters?.endDate) params.append('endDate', filters.endDate);
      if (filters?.period) params.append('period', filters.period);

      const response = await fetch(`/api/financeiro/dre?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const result = await response.json();
        setData(result);
      }
    } catch (error) {
      console.error('Erro ao buscar DRE:', error);
    } finally {
      setIsLoading(false);
    }
  }, [getToken, filters?.startDate, filters?.endDate, filters?.period]);

  useEffect(() => { mutate(); }, [mutate]);

  return {
    data,
    isLoading,
    mutate,
  };
}
