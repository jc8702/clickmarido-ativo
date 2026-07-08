import { useState, useCallback, useEffect } from 'react';
import { useAuth } from './useAuth';

interface ChartOfAccount {
  id: string;
  code: string;
  name: string;
  type: string;
  parentId?: string;
  isActive: boolean;
  level: number;
  children?: ChartOfAccount[];
}

interface ChartOfAccountsResponse {
  data: ChartOfAccount[];
  flat: ChartOfAccount[];
}

export function useChartOfAccounts(type?: string) {
  const [data, setData] = useState<ChartOfAccountsResponse>({ data: [], flat: [] });
  const [isLoading, setIsLoading] = useState(true);
  const { getToken } = useAuth();

  const mutate = useCallback(async () => {
    setIsLoading(true);
    try {
      const token = getToken();
      const params = new URLSearchParams();
      if (type) params.append('type', type);

      const response = await fetch(`/api/financeiro/chart-of-accounts?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const result = await response.json();
        setData(result);
      }
    } finally {
      setIsLoading(false);
    }
  }, [getToken, type]);

  useEffect(() => { mutate(); }, [mutate]);

  const createAccount = async (account: Omit<ChartOfAccount, 'id' | 'level'>) => {
    const token = getToken();
    const response = await fetch('/api/financeiro/chart-of-accounts', {
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

  const updateAccount = async (id: string, account: Partial<ChartOfAccount>) => {
    const token = getToken();
    const response = await fetch(`/api/financeiro/chart-of-accounts/${id}`, {
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
    const response = await fetch(`/api/financeiro/chart-of-accounts/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) throw new Error('Erro ao excluir conta');
    await mutate();
  };

  return {
    data,
    isLoading,
    mutate,
    createAccount,
    updateAccount,
    deleteAccount,
  };
}
