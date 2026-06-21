'use client';

import { useState, useEffect } from 'react';
import api from '../lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/Card';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { Badge } from '@/components/Badge';

interface QuotationFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

interface Customer {
  id: string;
  name: string;
}

interface Item {
  name: string;
  quantity: number;
  price: number;
}

export default function QuotationForm({ onSuccess, onCancel }: QuotationFormProps) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    customer_id: '',
    description: '',
    valid_until: '',
  });

  const [items, setItems] = useState<Item[]>([{ name: '', quantity: 1, price: 0 }]);

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const res = await api.get('/customers');
        setCustomers(res.data.data || []);
      } catch (err) {
        console.error("Erro ao buscar clientes", err);
      }
    };
    fetchCustomers();
  }, []);

  const handleItemChange = (index: number, field: keyof Item, value: any) => {
    const newItems = [...items];
    (newItems[index] as any)[field] = value;
    setItems(newItems);
  };

  const addItem = () => {
    setItems([...items, { name: '', quantity: 1, price: 0 }]);
  };

  const removeItem = (index: number) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const calculateTotal = () => {
    return items.reduce((acc, item) => acc + item.quantity * item.price, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await api.post('/quotations', {
        ...formData,
        items,
        total_amount: calculateTotal(),
      });
      if (onSuccess) onSuccess();
    } catch {
      setError('Erro ao criar orçamento');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 animate-fade-in">
      {error && (
        <div className="p-3 bg-warning-50 border-l-4 border-warning-600 text-warning-900 rounded-md text-sm animate-slide-down">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-neutral-900 mb-1">
            Cliente <span className="text-warning-600">*</span>
          </label>
          <select
            className="w-full px-4 py-2 rounded-md border-2 border-neutral-300 focus:border-primary-600 focus:ring-4 focus:ring-primary-100 focus:outline-none transition-all duration-200"
            value={formData.customer_id}
            onChange={(e) => setFormData({ ...formData, customer_id: e.target.value })}
            required
          >
            <option value="">Selecione um cliente...</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <Input
          label="Validade"
          type="date"
          value={formData.valid_until}
          onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-neutral-900 mb-1">Descrição</label>
        <textarea
          className="w-full px-4 py-2 rounded-md border-2 border-neutral-300 focus:border-primary-600 focus:ring-4 focus:ring-primary-100 focus:outline-none transition-all duration-200 min-h-[96px]"
          rows={3}
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        />
      </div>

      <Card gradient="subtle" shadow="sm">
        <CardHeader>
          <CardTitle>Itens do Orçamento</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {items.map((item, index) => (
              <div key={index} className="flex gap-3 items-end animate-fade-in" style={{ animationDelay: `${index * 50}ms` }}>
                <div className="flex-1">
                  <Input
                    label="Item"
                    placeholder="Descrição do serviço"
                    value={item.name}
                    onChange={(e) => handleItemChange(index, 'name', e.target.value)}
                    required
                  />
                </div>
                <div className="w-20">
                  <Input
                    label="Qtd"
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => handleItemChange(index, 'quantity', Number(e.target.value))}
                    required
                  />
                </div>
                <div className="w-32">
                  <Input
                    label="Preço (R$)"
                    type="number"
                    step="0.01"
                    min="0"
                    value={item.price}
                    onChange={(e) => handleItemChange(index, 'price', Number(e.target.value))}
                    required
                  />
                </div>
                <div className="pb-1">
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => removeItem(index)}
                    disabled={items.length === 1}
                  >
                    ✕
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4">
            <Button variant="outline" size="sm" onClick={addItem} type="button">
              + Adicionar Item
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between items-center pt-4 border-t border-neutral-200">
        <div>
          <p className="text-sm text-neutral-600 mb-1">Valor Total</p>
          <p className="text-3xl font-bold bg-gradient-hero bg-clip-text text-transparent">
            R$ {calculateTotal().toFixed(2)}
          </p>
        </div>
        <div className="flex gap-3">
          {onCancel && (
            <Button variant="outline" onClick={onCancel} type="button">
              Cancelar
            </Button>
          )}
          <Button type="submit" isLoading={loading}>
            {loading ? 'Salvando...' : 'Salvar Orçamento'}
          </Button>
        </div>
      </div>
    </form>
  );
}
