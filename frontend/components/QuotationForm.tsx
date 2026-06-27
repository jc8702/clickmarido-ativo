'use client';

import React, { useState, useEffect } from 'react';
import api from '../lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/Card';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';

interface QuotationFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

interface Customer {
  id: string;
  name: string;
}

interface QuotationItem {
  description: string;
  quantity: number;
  price: number;
}

export default function QuotationForm({ onSuccess, onCancel }: QuotationFormProps) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    customer_id: '',
    description_notes: '',
    valid_until: '',
    execution_time: '',
    warranty_term: '90 dias',
    payment_method: 'PIX',
    discount: 0,
  });

  const [items, setItems] = useState<QuotationItem[]>([{ description: '', quantity: 1, price: 0 }]);

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const res = await api.get('/customers');
        setCustomers(res.data.data || []);
      } catch (err) {
        console.error('Erro ao buscar clientes', err);
      }
    };
    fetchCustomers();
  }, []);

  const handleItemChange = (index: number, field: keyof QuotationItem, value: any) => {
    const newItems = [...items];
    (newItems[index] as any)[field] = value;
    setItems(newItems);
  };

  const addItem = () => {
    setItems([...items, { description: '', quantity: 1, price: 0 }]);
  };

  const removeItem = (index: number) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const calculateSubtotal = () => {
    return items.reduce((acc, item) => acc + item.quantity * item.price, 0);
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    const discountAmount = Number(formData.discount) || 0;
    return Math.max(0, subtotal - discountAmount);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validação de itens vazios
    const hasEmptyItem = items.some(item => !item.description.trim());
    if (hasEmptyItem) {
      setError('A descrição de todos os itens do serviço é obrigatória.');
      setLoading(false);
      return;
    }

    try {
      // Concatena informações ricas estruturadas no campo de notas
      const enrichedNotes = JSON.stringify({
        notes: formData.description_notes,
        valid_until: formData.valid_until,
        prazo: formData.execution_time,
        garantia: formData.warranty_term,
        pagamento: formData.payment_method,
        desconto: Number(formData.discount),
      });

      await api.post('/quotations', {
        customerId: formData.customer_id,
        items,
        notes: enrichedNotes,
      });

      if (onSuccess) onSuccess();
    } catch (err: any) {
      console.error(err);
      setError('Erro ao criar orçamento. Verifique se os dados estão corretos.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 animate-fade-in bg-white dark:bg-neutral-800 p-6 rounded-2xl border border-neutral-100 dark:border-neutral-700 shadow-sm">
      {error && (
        <div className="p-4 bg-warning-50 dark:bg-warning-900/30 border-l-4 border-warning-600 text-warning-950 dark:text-warning-200 rounded-xl text-sm animate-slide-down">
          {error}
        </div>
      )}

      {/* Dados do Cliente e Validade */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-neutral-800 dark:text-neutral-200 mb-2">
            Cliente <span className="text-warning-600">*</span>
          </label>
          <select
            className="w-full px-4 py-2.5 rounded-xl border-2 border-neutral-200 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 focus:border-primary-500 focus:ring-4 focus:ring-primary-100 dark:focus:ring-primary-900/30 focus:outline-none transition-all duration-200 text-sm"
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
          label="Orçamento Válido Até"
          type="date"
          value={formData.valid_until}
          onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
          required
        />
      </div>

      {/* Prazo, Garantia e Forma de Pagamento */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Input
          label="Prazo de Execução"
          placeholder="Ex: 2 dias úteis"
          value={formData.execution_time}
          onChange={(e) => setFormData({ ...formData, execution_time: e.target.value })}
          required
        />
        <div>
          <label className="block text-sm font-semibold text-neutral-800 dark:text-neutral-200 mb-2">Garantia Oferecida</label>
          <select
            className="w-full px-4 py-2.5 rounded-xl border-2 border-neutral-200 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 focus:border-primary-500 focus:ring-4 focus:ring-primary-100 dark:focus:ring-primary-900/30 focus:outline-none transition-all duration-200 text-sm"
            value={formData.warranty_term}
            onChange={(e) => setFormData({ ...formData, warranty_term: e.target.value })}
          >
            <option value="Sem garantia">Sem garantia</option>
            <option value="30 dias">30 dias</option>
            <option value="90 dias">90 dias (Padrão)</option>
            <option value="6 meses">6 meses</option>
            <option value="1 ano">1 ano</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-semibold text-neutral-800 dark:text-neutral-200 mb-2">Forma de Pagamento</label>
          <select
            className="w-full px-4 py-2.5 rounded-xl border-2 border-neutral-200 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 focus:border-primary-500 focus:ring-4 focus:ring-primary-100 dark:focus:ring-primary-900/30 focus:outline-none transition-all duration-200 text-sm"
            value={formData.payment_method}
            onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
          >
            <option value="PIX">PIX</option>
            <option value="Cartão de Crédito">Cartão de Crédito</option>
            <option value="Boleto">Boleto Bancário</option>
            <option value="Dinheiro">Dinheiro</option>
            <option value="Faturado">Faturado</option>
          </select>
        </div>
      </div>

      {/* Observações / Descrição Geral */}
      <div>
        <label className="block text-sm font-semibold text-neutral-800 dark:text-neutral-200 mb-2 font-medium">Observações do Serviço</label>
        <textarea
          placeholder="Detalhes adicionais, recomendações ou observações gerais..."
          className="w-full px-4 py-3 rounded-xl border-2 border-neutral-200 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 focus:border-primary-500 focus:ring-4 focus:ring-primary-100 dark:focus:ring-primary-900/30 focus:outline-none transition-all duration-200 min-h-[96px] text-sm"
          rows={3}
          value={formData.description_notes}
          onChange={(e) => setFormData({ ...formData, description_notes: e.target.value })}
        />
      </div>

      {/* Card de Itens */}
      <Card gradient="subtle" shadow="sm" className="border border-neutral-100/60 dark:border-neutral-700/60 overflow-hidden">
        <CardHeader className="bg-neutral-50/50 dark:bg-neutral-700/50 border-b border-neutral-100 dark:border-neutral-700 py-4">
          <CardTitle className="text-base font-bold text-neutral-800 dark:text-neutral-200">Itens e Serviços Mapeados</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4">
            {items.map((item, index) => (
              <div key={index} className="flex gap-4 items-end animate-fade-in" style={{ animationDelay: `${index * 50}ms` }}>
                <div className="flex-1">
                  <Input
                    label="Descrição do Item / Serviço"
                    placeholder="Ex: Troca de disjuntor principal"
                    value={item.description}
                    onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                    required
                  />
                </div>
                <div className="w-24">
                  <Input
                    label="Qtd"
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => handleItemChange(index, 'quantity', Number(e.target.value))}
                    required
                  />
                </div>
                <div className="w-36">
                  <Input
                    label="Preço Unit. (R$)"
                    type="number"
                    step="0.01"
                    min="0"
                    value={item.price}
                    onChange={(e) => handleItemChange(index, 'price', Number(e.target.value))}
                    required
                  />
                </div>
                <div className="pb-1.5">
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => removeItem(index)}
                    disabled={items.length === 1}
                    className="h-[46px] w-[46px] rounded-xl flex items-center justify-center"
                    type="button"
                  >
                    ✕
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-5">
            <Button variant="outline" size="sm" onClick={addItem} type="button" className="font-semibold text-xs py-2 px-4">
              + Adicionar Novo Item
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Desconto e Totais */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center pt-6 border-t border-neutral-100 dark:border-neutral-700 gap-6">
        <div className="w-full md:w-48">
          <Input
            label="Conceder Desconto (R$)"
            type="number"
            min="0"
            step="0.01"
            value={formData.discount}
            onChange={(e) => setFormData({ ...formData, discount: Math.max(0, Number(e.target.value)) })}
          />
        </div>

        <div className="flex items-center gap-8 w-full md:w-auto justify-between md:justify-end">
          <div className="text-right">
            <p className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">Subtotal: R$ {calculateSubtotal().toFixed(2)}</p>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 font-semibold mb-1">Total com Desconto</p>
            <p className="text-3xl font-extrabold bg-gradient-hero bg-clip-text text-transparent">
              R$ {calculateTotal().toFixed(2)}
            </p>
          </div>
          <div className="flex gap-3">
            {onCancel && (
              <Button variant="outline" onClick={onCancel} type="button" className="px-6">
                Cancelar
              </Button>
            )}
            <Button type="submit" isLoading={loading} className="px-6 shadow-md hover:shadow-lg transition-all duration-300">
              Salvar Orçamento
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
}
