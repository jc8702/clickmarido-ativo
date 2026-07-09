import { useState, useCallback, useEffect } from 'react';
import { useAuth } from './useAuth';

interface BankAccount {
  id: string;
  bankName: string;
  agency: string;
  accountNumber: string;
  accountType: string;
  nickname?: string;
  initialBalance: number;
  currentBalance: number;
  status: string;
  color?: string;
  isDefault: boolean;
  notes?: string;
}

interface BankAccountsResponse {
  data: BankAccount[];
  totalBalance: number;
  count: number;
}

export function useBankAccounts() {
  const [data, setData] = useState<BankAccountsResponse>({ data: [], totalBalance: 0, count: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const { getToken } = useAuth();

  const mutate = useCallback(async () => {
    setIsLoading(true);
    try {
      const token = getToken();
      const response = await fetch('/api/financeiro/bank-accounts', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const result = await response.json();
        setData(result);
      } else {
        console.error('[BankAccounts] API error:', response.status, await response.text());
      }
    } finally {
      setIsLoading(false);
    }
  }, [getToken]);

  useEffect(() => { mutate(); }, [mutate]);

  const createAccount = async (account: Omit<BankAccount, 'id' | 'currentBalance'>) => {
    const token = getToken();
    const response = await fetch('/api/financeiro/bank-accounts', {
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

  const updateAccount = async (id: string, account: Partial<BankAccount>) => {
    const token = getToken();
    const response = await fetch(`/api/financeiro/bank-accounts/${id}`, {
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
    const response = await fetch(`/api/financeiro/bank-accounts/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) throw new Error('Erro ao excluir conta');
    await mutate();
  };

  const adjustBalance = async (id: string, currentBalance: number, notes?: string) => {
    const token = getToken();
    const response = await fetch(`/api/financeiro/bank-accounts/${id}/balance`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ currentBalance, notes }),
    });
    if (!response.ok) throw new Error('Erro ao ajustar saldo');
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
    adjustBalance,
  };
}
