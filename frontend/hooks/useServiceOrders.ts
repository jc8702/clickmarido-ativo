import { useState, useEffect } from 'react';

// Mocks simulando a API
const mockOrders = [
  { id: 'os-1', number: 'OS-1001', scheduled_date: new Date().toISOString(), scheduled_time: '09:00', status: 'agendada', technician_name: 'Técnico Alpha', customer_name: 'João Silva', address: 'Rua A, 123' },
  { id: 'os-2', number: 'OS-1002', scheduled_date: new Date().toISOString(), scheduled_time: '14:00', status: 'em_progresso', technician_name: 'Técnico Beta', customer_name: 'Maria Souza', address: 'Av B, 456' },
];

export function useServiceOrders() {
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => {
      setData(mockOrders);
      setIsLoading(false);
    }, 500);
  }, []);

  return { data, isLoading };
}

export function useServiceOrder(id: string) {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => {
      // Cria um mock detalhado baseado no id
      setData({
        id,
        number: `OS-${id.toUpperCase()}`,
        quotation_id: 'q-123',
        status: id === 'os-2' ? 'em_progresso' : 'agendada',
        scheduled_date: new Date().toISOString(),
        scheduled_time: '09:00',
        customer_name: 'João Silva',
        technician_name: 'Técnico Alpha',
        arrival_time: id === 'os-2' ? new Date().toISOString() : null,
        completion_time: null,
        before_photos: [],
        after_photos: [],
        address: 'Rua A, 123 - Centro'
      });
      setIsLoading(false);
    }, 500);
  }, [id]);

  const mutate = (newData: any) => {
    setData((prev: any) => ({ ...prev, ...newData }));
  };

  return { data, isLoading, mutate };
}
