import { useState, useCallback, useEffect } from 'react';
import { useAuth } from './useAuth';

interface RecurringExpense {
  id: string;
  description: string;
  amount: number;
  frequency: string;
  customFrequency?: number;
  dayOfMonth?: number;
  dayOfWeek?: number;
  monthOfYear?: number;
  startDate: string;
  endDate?: string;
  isActive: boolean;
  lastGenerated?: string;
  nextDue: string;
  chartOfAccountId?: string;
  costCenter?: string;
  vendorId?: string;
  bankAccountId?: string;
  notes?: string;
  vendor?: { id: string; name: string };
  bankAccount?: { id: string; bankName: string; nickname?: string };
  chartOfAccount?: { id: string; code: string; name: string };
}

interface RecurringExpensesResponse {
  data: RecurringExpense[];
  monthlyTotal: number;
}

export function useRecurringExpenses(isActive?: boolean) {
  const [data, setData] = useState<RecurringExpensesResponse>({ data: [], monthlyTotal: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const { getToken } = useAuth();

  const mutate = useCallback(async () => {
    setIsLoading(true);
    try {
      const token = getToken();
      const params = new URLSearchParams();
      if (isActive !== undefined) params.append('isActive', String(isActive));

      const response = await fetch(`/api/financeiro/recurring-expenses?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const result = await response.json();
        setData(result);
      }
    } finally {
      setIsLoading(false);
    }
  }, [getToken, isActive]);

  useEffect(() => { mutate(); }, [mutate]);

  const createExpense = async (expense: Partial<RecurringExpense>) => {
    const token = getToken();
    const response = await fetch('/api/financeiro/recurring-expenses', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(expense),
    });
    if (!response.ok) throw new Error('Erro ao criar despesa fixa');
    await mutate();
    return response.json();
  };

  const updateExpense = async (id: string, expense: Partial<RecurringExpense>) => {
    const token = getToken();
    const response = await fetch(`/api/financeiro/recurring-expenses/${id}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(expense),
    });
    if (!response.ok) throw new Error('Erro ao atualizar despesa fixa');
    await mutate();
    return response.json();
  };

  const deleteExpense = async (id: string) => {
    const token = getToken();
    const response = await fetch(`/api/financeiro/recurring-expenses/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) throw new Error('Erro ao excluir despesa fixa');
    await mutate();
  };

  const toggleExpense = async (id: string) => {
    const token = getToken();
    const response = await fetch(`/api/financeiro/recurring-expenses/${id}/toggle`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) throw new Error('Erro ao alternar despesa fixa');
    await mutate();
    return response.json();
  };

  return {
    data,
    isLoading,
    mutate,
    createExpense,
    updateExpense,
    deleteExpense,
    toggleExpense,
  };
}
