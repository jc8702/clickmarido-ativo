import { useState, useCallback, useEffect } from 'react';
import { useAuth } from './useAuth';

interface BankTransfer {
  id: string;
  fromAccountId: string;
  toAccountId: string;
  amount: number;
  description?: string;
  transferDate: string;
  status: string;
  fromAccount?: { id: string; bankName: string; nickname?: string; accountNumber: string };
  toAccount?: { id: string; bankName: string; nickname?: string; accountNumber: string };
}

interface BankTransfersResponse {
  data: BankTransfer[];
}

export function useBankTransfers() {
  const [data, setData] = useState<BankTransfersResponse>({ data: [] });
  const [isLoading, setIsLoading] = useState(true);
  const { getToken } = useAuth();

  const mutate = useCallback(async () => {
    setIsLoading(true);
    try {
      const token = getToken();
      const response = await fetch('/api/financeiro/bank-transfers', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const result = await response.json();
        setData(result);
      }
    } finally {
      setIsLoading(false);
    }
  }, [getToken]);

  useEffect(() => { mutate(); }, [mutate]);

  const createTransfer = async (transfer: {
    fromAccountId: string;
    toAccountId: string;
    amount: number;
    description?: string;
    transferDate: string;
  }) => {
    const token = getToken();
    const response = await fetch('/api/financeiro/bank-transfers', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(transfer),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erro ao criar transferência');
    }
    await mutate();
    return response.json();
  };

  const cancelTransfer = async (id: string) => {
    const token = getToken();
    const response = await fetch(`/api/financeiro/bank-transfers/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) throw new Error('Erro ao cancelar transferência');
    await mutate();
  };

  return {
    data,
    isLoading,
    mutate,
    createTransfer,
    cancelTransfer,
  };
}
