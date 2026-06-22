'use client';

import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/Button';

interface QuotationItemRow {
  id: string;
  product: {
    id: string;
    name: string;
    sku: string;
    unit: string;
  };
  quantity: number;
  unitPrice: number;
  subtotal: number;
  notes: string;
}

interface QuotationItemsTableProps {
  items: QuotationItemRow[];
  isLoading?: boolean;
  onItemUpdated?: () => void;
}

export function QuotationItemsTable({ items, isLoading, onItemUpdated }: QuotationItemsTableProps) {
  const { getToken } = useAuth();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editQuantity, setEditQuantity] = useState(1);
  const [editPrice, setEditPrice] = useState(0);
  const [isSaving, setIsSaving] = useState(false);

  const handleEdit = (item: QuotationItemRow) => {
    setEditingId(item.id);
    setEditQuantity(item.quantity);
    setEditPrice(item.unitPrice);
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditQuantity(1);
    setEditPrice(0);
  };

  const handleSave = async (itemId: string) => {
    setIsSaving(true);
    try {
      const token = getToken();
      const response = await fetch(`/api/quotation-items/${itemId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          quantity: editQuantity,
          unitPrice: editPrice,
        }),
      });

      if (!response.ok) {
        throw new Error('Erro ao salvar item');
      }

      setEditingId(null);
      onItemUpdated?.();
    } catch (error) {
      console.error('Error saving item:', error);
      alert('Erro ao salvar item');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (itemId: string) => {
    if (!confirm('Tem certeza que deseja remover este item?')) {
      return;
    }

    try {
      const token = getToken();
      const response = await fetch(`/api/quotation-items/${itemId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error('Erro ao remover item');
      }

      onItemUpdated?.();
    } catch (error) {
      console.error('Error deleting item:', error);
      alert('Erro ao remover item');
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 text-center text-neutral-500 dark:text-neutral-400">
        Carregando itens...
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="p-8 text-center text-neutral-500 dark:text-neutral-400">
        Nenhum item adicionado. Clique em &quot;+ Adicionar Item&quot; para começar.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-neutral-200 dark:border-neutral-700">
            <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase">
              Produto/Serviço
            </th>
            <th className="px-4 py-3 text-center text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase">
              Qtd
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase">
              Valor Unit.
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase">
              Subtotal
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase">
              Ações
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-200 dark:divide-neutral-700">
          {items.map((item) => (
            <tr key={item.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
              <td className="px-4 py-3">
                <div className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                  {item.product.name}
                </div>
                <div className="text-xs text-neutral-500 dark:text-neutral-400">
                  {item.product.sku}
                </div>
                {item.notes && (
                  <div className="text-xs text-neutral-400 dark:text-neutral-500 mt-1">
                    {item.notes}
                  </div>
                )}
              </td>
              <td className="px-4 py-3 text-center">
                {editingId === item.id ? (
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={editQuantity}
                    onChange={(e) => setEditQuantity(parseFloat(e.target.value) || 1)}
                    className="w-20 px-2 py-1 text-center border border-neutral-300 dark:border-neutral-600 rounded bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                ) : (
                  <span className="text-sm text-neutral-900 dark:text-neutral-100">
                    {item.quantity}
                  </span>
                )}
              </td>
              <td className="px-4 py-3 text-right">
                {editingId === item.id ? (
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={editPrice}
                    onChange={(e) => setEditPrice(parseFloat(e.target.value) || 0)}
                    className="w-24 px-2 py-1 text-right border border-neutral-300 dark:border-neutral-600 rounded bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                ) : (
                  <span className="text-sm text-neutral-900 dark:text-neutral-100">
                    R$ {item.unitPrice.toFixed(2)}
                  </span>
                )}
              </td>
              <td className="px-4 py-3 text-right">
                <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                  R$ {(editingId === item.id ? editQuantity * editPrice : item.subtotal).toFixed(2)}
                </span>
              </td>
              <td className="px-4 py-3 text-right">
                {editingId === item.id ? (
                  <div className="flex justify-end gap-2">
                    <Button
                      onClick={() => handleSave(item.id)}
                      disabled={isSaving}
                      className="text-xs px-3 py-1 bg-teal-600 hover:bg-teal-700"
                    >
                      {isSaving ? '...' : 'Salvar'}
                    </Button>
                    <Button
                      onClick={handleCancel}
                      disabled={isSaving}
                      className="text-xs px-3 py-1 bg-neutral-300 dark:bg-neutral-600 text-neutral-900 dark:text-neutral-100"
                    >
                      Cancelar
                    </Button>
                  </div>
                ) : (
                  <div className="flex justify-end gap-2">
                    <Button
                      onClick={() => handleEdit(item)}
                      className="text-xs px-3 py-1 bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-300 dark:hover:bg-neutral-600"
                    >
                      Editar
                    </Button>
                    <Button
                      onClick={() => handleDelete(item.id)}
                      className="text-xs px-3 py-1 bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-800/50"
                    >
                      Remover
                    </Button>
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
