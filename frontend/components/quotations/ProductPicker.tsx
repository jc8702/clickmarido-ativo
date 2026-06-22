'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Modal } from '@/components/Modal';
import { Button } from '@/components/Button';

interface Product {
  id: string;
  name: string;
  sku: string;
  type: string;
  description: string;
  price: number;
  unit: string;
  category: string;
}

interface ProductPickerProps {
  onSelect: (product: Product, quantity: number) => void;
  onClose: () => void;
}

const FAMILIES = [
  { code: '', name: 'Todas as Famílias' },
  { code: 'HID', name: 'Hidráulica' },
  { code: 'ELE', name: 'Elétrica' },
  { code: 'MAR', name: 'Marcenaria' },
  { code: 'INS', name: 'Instalação' },
  { code: 'MON', name: 'Montagem de Móveis' },
  { code: 'LIM', name: 'Limpeza' },
  { code: 'GER', name: 'Geral' },
];

export function ProductPicker({ onSelect, onClose }: ProductPickerProps) {
  const { getToken } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [familyFilter, setFamilyFilter] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    try {
      const token = getToken();
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (typeFilter) params.set('type', typeFilter);
      if (familyFilter) params.set('family', familyFilter);
      params.set('limit', '100');

      const response = await fetch(`/api/products/available?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setProducts(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setIsLoading(false);
    }
  }, [search, typeFilter, familyFilter, getToken]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    searchInputRef.current?.focus();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleSelect = (product: Product) => {
    setSelectedProduct(product);
    setQuantity(1);
  };

  const handleConfirm = () => {
    if (selectedProduct) {
      onSelect(selectedProduct, quantity);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && selectedProduct) {
      handleConfirm();
    }
  };

  const subtotal = selectedProduct ? selectedProduct.price * quantity : 0;

  const getFamilyBadge = (sku: string) => {
    const match = sku?.match(/^SRV-([A-Z]{3})-/);
    if (!match) return null;
    const code = match[1];
    const family = FAMILIES.find(f => f.code === code);
    if (!family || !code) return null;

    const colors: Record<string, string> = {
      HID: 'bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300',
      ELE: 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-300',
      MAR: 'bg-orange-100 dark:bg-orange-900/50 text-orange-800 dark:text-orange-300',
      INS: 'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300',
      MON: 'bg-purple-100 dark:bg-purple-900/50 text-purple-800 dark:text-purple-300',
      LIM: 'bg-cyan-100 dark:bg-cyan-900/50 text-cyan-800 dark:text-cyan-300',
      GER: 'bg-gray-100 dark:bg-gray-900/50 text-gray-800 dark:text-gray-300',
    };

    return (
      <span className={`inline-flex px-1.5 py-0.5 text-[10px] font-bold rounded ${colors[code] || colors.GER}`}>
        {code}
      </span>
    );
  };

  return (
    <Modal isOpen={true} onClose={onClose}>
      <div className="p-6" onKeyDown={handleKeyDown}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">
            Selecionar Serviço/Peça
          </h2>
          <button
            onClick={onClose}
            className="text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
          >
            ✕
          </button>
        </div>

        <div className="space-y-3 mb-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              Buscar por nome, SKU ou descrição
            </label>
            <input
              ref={searchInputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Digite para buscar... (ex: SRV-HID, Hidráulica, Instalar torneira)"
              className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono text-sm"
            />
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Família (SKU)
              </label>
              <select
                value={familyFilter}
                onChange={(e) => setFamilyFilter(e.target.value)}
                className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
              >
                {FAMILIES.map((f) => (
                  <option key={f.code} value={f.code}>
                    {f.code ? `${f.code} - ${f.name}` : f.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex-1">
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Tipo
              </label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
              >
                <option value="">Todos</option>
                <option value="SERVICO">Serviços</option>
                <option value="PECA">Peças</option>
              </select>
            </div>
          </div>
        </div>

        <div className="mb-2 text-xs text-neutral-500 dark:text-neutral-400">
          {products.length} resultado(s) encontrado(s)
        </div>

        <div className="max-h-80 overflow-y-auto border border-neutral-200 dark:border-neutral-700 rounded-lg">
          {isLoading ? (
            <div className="p-8 text-center text-neutral-500 dark:text-neutral-400">
              Carregando...
            </div>
          ) : products.length === 0 ? (
            <div className="p-8 text-center text-neutral-500 dark:text-neutral-400">
              Nenhum serviço/peça encontrado
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-neutral-50 dark:bg-neutral-800 sticky top-0">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase">
                    SKU
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase">
                    Nome
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase">
                    Tipo
                  </th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase">
                    Preço
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 dark:divide-neutral-700">
                {products.map((product) => (
                  <tr
                    key={product.id}
                    onClick={() => handleSelect(product)}
                    className={`cursor-pointer transition-colors ${
                      selectedProduct?.id === product.id
                        ? 'bg-teal-50 dark:bg-teal-900/30'
                        : 'hover:bg-neutral-50 dark:hover:bg-neutral-800'
                    }`}
                  >
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-mono font-bold text-neutral-700 dark:text-neutral-300">
                          {product.sku}
                        </span>
                        {getFamilyBadge(product.sku)}
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <div className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                        {product.name}
                      </div>
                      {product.description && (
                        <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 truncate max-w-xs">
                          {product.description}
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        product.type === 'SERVICO'
                          ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300'
                          : 'bg-purple-100 dark:bg-purple-900/50 text-purple-800 dark:text-purple-300'
                      }`}>
                        {product.type === 'SERVICO' ? 'Serviço' : 'Peça'}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right text-sm font-medium text-neutral-900 dark:text-neutral-100">
                      R$ {product.price.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {selectedProduct && (
          <div className="mt-4 p-4 bg-neutral-50 dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="font-medium text-neutral-900 dark:text-neutral-100">
                  {selectedProduct.name}
                </p>
                <p className="text-sm text-neutral-500 dark:text-neutral-400 font-mono">
                  {selectedProduct.sku} • R$ {selectedProduct.price.toFixed(2)}/{selectedProduct.unit}
                </p>
              </div>
            </div>

            <div className="flex items-end gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Quantidade
                </label>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={quantity}
                  onChange={(e) => setQuantity(parseFloat(e.target.value) || 1)}
                  className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <div className="text-right">
                <p className="text-sm text-neutral-500 dark:text-neutral-400">Subtotal</p>
                <p className="text-lg font-bold text-teal-600 dark:text-teal-400">
                  R$ {subtotal.toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end gap-3 mt-6">
          <Button
            onClick={onClose}
            className="bg-neutral-300 dark:bg-neutral-600 text-neutral-900 dark:text-neutral-100 hover:bg-neutral-400 dark:hover:bg-neutral-500"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!selectedProduct}
            className="bg-teal-600 hover:bg-teal-700 disabled:opacity-50"
          >
            Adicionar Item
          </Button>
        </div>
      </div>
    </Modal>
  );
}
