'use client';

import React from 'react';

interface Product {
  id: string;
  name: string;
  sku: string;
  type: string;
  price: number;
  unit: string;
  category: string;
  active: boolean;
  vendorId?: string;
  vendor?: {
    id: string;
    name: string;
    cnpjCpf?: string;
  };
}

interface ProductTableProps {
  data: Product[];
  isLoading: boolean;
  onEdit: (product: Product) => void;
  onDelete: (id: string) => void;
  deletingId: string | null;
  onViewDetails?: (product: Product) => void;
}

export function ProductTable({ data, isLoading, onEdit, onDelete, deletingId, onViewDetails }: ProductTableProps) {
  if (isLoading) {
    return <div className="p-4 text-center text-neutral-900 dark:text-neutral-100">Carregando...</div>;
  }

  if (data.length === 0) {
    return (
      <div className="text-center py-16 text-neutral-500 dark:text-neutral-400">
        <span className="text-4xl block mb-4">📦</span>
        Nenhum serviço ou peça cadastrado
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-neutral-100 dark:bg-neutral-700 border-b border-neutral-200 dark:border-neutral-600">
            <th className="p-4 font-semibold text-neutral-700 dark:text-neutral-300">Nome</th>
            <th className="p-4 font-semibold text-neutral-700 dark:text-neutral-300">SKU</th>
            <th className="p-4 font-semibold text-neutral-700 dark:text-neutral-300">Tipo</th>
            <th className="p-4 font-semibold text-neutral-700 dark:text-neutral-300">Categoria</th>
            <th className="p-4 font-semibold text-neutral-700 dark:text-neutral-300">Preço</th>
            <th className="p-4 font-semibold text-neutral-700 dark:text-neutral-300">Un.</th>
            <th className="p-4 font-semibold text-neutral-700 dark:text-neutral-300">Status</th>
            <th className="p-4 font-semibold text-neutral-700 dark:text-neutral-300">Ações</th>
          </tr>
        </thead>
        <tbody>
          {data.map((product) => (
            <tr
              key={product.id}
              className="border-b border-neutral-200 dark:border-neutral-600 hover:bg-neutral-50 dark:hover:bg-neutral-700/50 transition-colors"
            >
              <td className="p-4 text-neutral-900 dark:text-neutral-100 font-medium">{product.name}</td>
              <td className="p-4 font-mono text-xs text-neutral-600 dark:text-neutral-400 uppercase">{product.sku}</td>
              <td className="p-4">
                <span
                  className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${
                    product.type === 'SERVICO'
                      ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                      : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'
                  }`}
                >
                  {product.type === 'SERVICO' ? 'Serviço' : 'Peça'}
                </span>
              </td>
              <td className="p-4 text-neutral-600 dark:text-neutral-400 text-sm">{product.category || '-'}</td>
              <td className="p-4 text-neutral-900 dark:text-neutral-100 font-semibold">
                R$ {product.price.toFixed(2).replace('.', ',')}
              </td>
              <td className="p-4 text-neutral-600 dark:text-neutral-400 text-sm">{product.unit}</td>
              <td className="p-4">
                <span
                  className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${
                    product.active
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                      : 'bg-neutral-100 dark:bg-neutral-700 text-neutral-500 dark:text-neutral-400'
                  }`}
                >
                  {product.active ? 'Ativo' : 'Inativo'}
                </span>
              </td>
              <td className="p-4">
                <div className="flex gap-2">
                  <button
                    onClick={() => onViewDetails && onViewDetails(product)}
                    className="px-3 py-1.5 rounded-md text-xs font-semibold bg-teal-50 dark:bg-teal-900/20 hover:bg-teal-100 dark:hover:bg-teal-900/40 text-teal-700 dark:text-teal-400 transition-colors"
                  >
                    Histórico
                  </button>
                  <button
                    onClick={() => onEdit(product)}
                    className="px-3 py-1.5 rounded-md text-xs font-semibold bg-neutral-100 dark:bg-neutral-700 hover:bg-neutral-200 dark:hover:bg-neutral-600 text-neutral-700 dark:text-neutral-300 transition-colors"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => onDelete(product.id)}
                    disabled={deletingId === product.id}
                    className="px-3 py-1.5 rounded-md text-xs font-semibold bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 transition-colors disabled:opacity-50"
                  >
                    {deletingId === product.id ? '...' : 'Excluir'}
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
