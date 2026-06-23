'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { productSchema, ProductFormValues } from '../../lib/validations/product.schema';
import { useVendors } from '../../hooks/useVendors';
import { useEscapeToClose } from '../../hooks/useEscapeToClose';

type Props = {
  initialData?: any;
  onSubmit: (data: ProductFormValues) => void;
  isLoading: boolean;
};

const FAMILY_OPTIONS = [
  { value: 'Hidráulica', label: 'HID - Hidráulica' },
  { value: 'Elétrica', label: 'ELE - Elétrica' },
  { value: 'Marcenaria', label: 'MAR - Marcenaria' },
  { value: 'Instalação', label: 'INS - Instalação' },
  { value: 'Montagem de Móveis', label: 'MON - Montagem de Móveis' },
  { value: 'Limpeza', label: 'LIM - Limpeza' },
];

export function ProductForm({ initialData, onSubmit, isLoading }: Props) {
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: initialData || {
      name: '',
      sku: '',
      type: 'SERVICO',
      description: '',
      price: 0,
      unit: 'un',
      category: '',
      active: true,
      vendorId: '',
    }
  });

  const category = watch('category');
  const [nextSku, setNextSku] = useState<any>(null);

  // Estados e Logica do Fornecedor Inline
  const { data: vendorsData, mutate: refreshVendors } = useVendors(1, '', '', '', 'true', 'false');
  const vendors = vendorsData?.data || [];

  const [showVendorModal, setShowVendorModal] = useState(false);
  const [vendorName, setVendorName] = useState('');
  const [vendorCnpj, setVendorCnpj] = useState('');
  const [vendorPhone, setVendorPhone] = useState('');

  useEscapeToClose(showVendorModal, () => setShowVendorModal(false));
  const [vendorEmail, setVendorEmail] = useState('');
  const [vendorCategory, setVendorCategory] = useState('MATERIAL');
  const [isCreatingVendor, setIsCreatingVendor] = useState(false);

  const handleCreateVendorInline = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!vendorName.trim()) return;
    setIsCreatingVendor(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/vendors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: vendorName,
          cnpjCpf: vendorCnpj || undefined,
          phone: vendorPhone || undefined,
          email: vendorEmail || undefined,
          category: vendorCategory,
          isActive: true,
          isBlocked: false,
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Erro ao criar fornecedor');
      }

      const newVendor = await response.json();
      await refreshVendors();
      
      // Seleciona automaticamente o fornecedor cadastrado
      setValue('vendorId', newVendor.id);
      
      // Limpa e fecha o modal
      setShowVendorModal(false);
      setVendorName('');
      setVendorCnpj('');
      setVendorPhone('');
      setVendorEmail('');
      setVendorCategory('MATERIAL');
    } catch (err: any) {
      alert(err.message || 'Erro ao cadastrar fornecedor');
    } finally {
      setIsCreatingVendor(false);
    }
  };

  useEffect(() => {
    if (!category || initialData) {
      setNextSku(null);
      return;
    }

    const fetchNextSku = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`/api/products/next-sku?category=${encodeURIComponent(category)}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setNextSku(data);
        }
      } catch (err) {
        console.error('Erro ao buscar próximo SKU:', err);
      }
    };

    fetchNextSku();
  }, [category, initialData]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 bg-white dark:bg-neutral-800 p-6 rounded shadow">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">Nome *</label>
          <input
            {...register('name')}
            className="mt-1 block w-full p-2 border border-neutral-300 dark:border-neutral-600 rounded bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100"
            placeholder="Ex: Instalar Torneira Simples"
          />
          {errors.name && <p className="text-red-500 dark:text-red-400 text-xs mt-1">{errors.name.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">Categoria / Família *</label>
          <select
            {...register('category')}
            className="mt-1 block w-full p-2 border border-neutral-300 dark:border-neutral-600 rounded bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100"
          >
            <option value="">Selecione a família...</option>
            {FAMILY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          {errors.category && <p className="text-red-500 dark:text-red-400 text-xs mt-1">{errors.category.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">SKU</label>
          <input
            {...register('sku')}
            className="mt-1 block w-full p-2 border border-neutral-300 dark:border-neutral-600 rounded bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 uppercase font-mono"
            placeholder={nextSku ? nextSku.sku : "Deixe vazio para auto-gerar"}
          />
          {nextSku && !initialData && (
            <p className="text-xs text-teal-600 dark:text-teal-400 mt-1">
              Próximo SKU disponível: <span className="font-mono font-bold">{nextSku.sku}</span>
              {nextSku.lastProduct && (
                <span className="text-neutral-500 dark:text-neutral-400"> (após: {nextSku.lastProduct.sku})</span>
              )}
            </p>
          )}
          {errors.sku && <p className="text-red-500 dark:text-red-400 text-xs mt-1">{errors.sku.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">Tipo *</label>
          <select
            {...register('type')}
            className="mt-1 block w-full p-2 border border-neutral-300 dark:border-neutral-600 rounded bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100"
          >
            <option value="SERVICO">Serviço</option>
            <option value="PECA">Peça / Produto</option>
          </select>
          {errors.type && <p className="text-red-500 dark:text-red-400 text-xs mt-1">{errors.type.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">Preço (R$) *</label>
          <input
            {...register('price', { valueAsNumber: true })}
            type="number"
            step="0.01"
            min="0"
            className="mt-1 block w-full p-2 border border-neutral-300 dark:border-neutral-600 rounded bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100"
            placeholder="0.00"
          />
          {errors.price && <p className="text-red-500 dark:text-red-400 text-xs mt-1">{errors.price.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">Unidade *</label>
          <select
            {...register('unit')}
            className="mt-1 block w-full p-2 border border-neutral-300 dark:border-neutral-600 rounded bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100"
          >
            <option value="un">Unidade (un)</option>
            <option value="m²">Metro quadrado (m²)</option>
            <option value="m">Metro (m)</option>
            <option value="h">Hora (h)</option>
            <option value="kg">Quilograma (kg)</option>
            <option value="l">Litro (l)</option>
            <option value="cx">Caixa (cx)</option>
            <option value="par">Par</option>
            <option value="kit">Kit</option>
          </select>
          {errors.unit && <p className="text-red-500 dark:text-red-400 text-xs mt-1">{errors.unit.message}</p>}
        </div>

        <div className="md:col-span-2">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">Fornecedor Padrão</label>
            <button
              type="button"
              onClick={() => setShowVendorModal(true)}
              className="text-xs text-primary-600 hover:text-primary-700 dark:text-teal-400 dark:hover:text-teal-300 font-semibold"
            >
              + Cadastrar Fornecedor
            </button>
          </div>
          <select
            {...register('vendorId')}
            className="mt-1 block w-full p-2 border border-neutral-300 dark:border-neutral-600 rounded bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 text-sm"
          >
            <option value="">Nenhum fornecedor associado</option>
            {vendors.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name} {v.cnpjCpf ? `(${v.cnpjCpf})` : ''}
              </option>
            ))}
          </select>
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">Descrição</label>
          <textarea
            {...register('description')}
            className="mt-1 block w-full p-2 border border-neutral-300 dark:border-neutral-600 rounded bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100"
            rows={3}
            placeholder="Descrição opcional do serviço ou peça..."
          ></textarea>
        </div>

        <div className="flex items-center gap-3">
          <input
            {...register('active')}
            type="checkbox"
            id="active"
            className="w-4 h-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
          />
          <label htmlFor="active" className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
            Ativo (aparece nos orçamentos)
          </label>
        </div>
      </div>

      <div className="flex justify-end pt-4 border-t border-neutral-200 dark:border-neutral-700">
        <button
          type="submit"
          disabled={isLoading}
          className="px-6 py-2 bg-primary-600 text-white rounded hover:bg-primary-700 font-medium disabled:opacity-50"
        >
          {isLoading ? 'Salvando...' : initialData ? 'Atualizar Produto' : 'Cadastrar Produto'}
        </button>
      </div>

      {/* Modal Inline de Cadastro Rápido de Fornecedor */}
      {showVendorModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[1050] flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-xl w-full max-w-md overflow-hidden border border-neutral-200 dark:border-neutral-700">
            <div className="p-4 border-b border-neutral-200 dark:border-neutral-700 flex justify-between items-center bg-neutral-50 dark:bg-neutral-800">
              <h3 className="text-md font-bold text-neutral-900 dark:text-neutral-100">Cadastrar Fornecedor Rápido</h3>
              <button
                type="button"
                onClick={() => setShowVendorModal(false)}
                className="text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200 text-sm"
              >
                ✕
              </button>
            </div>
            <div className="p-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">Razão Social / Nome Comercial *</label>
                <input
                  type="text"
                  value={vendorName}
                  onChange={(e) => setVendorName(e.target.value)}
                  className="w-full p-2 border border-neutral-300 dark:border-neutral-600 rounded bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 text-sm"
                  placeholder="Nome do Fornecedor"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">CNPJ / CPF</label>
                <input
                  type="text"
                  value={vendorCnpj}
                  onChange={(e) => setVendorCnpj(e.target.value)}
                  className="w-full p-2 border border-neutral-300 dark:border-neutral-600 rounded bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 text-sm"
                  placeholder="Apenas números ou formato"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">WhatsApp / Telefone</label>
                  <input
                    type="text"
                    value={vendorPhone}
                    onChange={(e) => setVendorPhone(e.target.value)}
                    className="w-full p-2 border border-neutral-300 dark:border-neutral-600 rounded bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 text-sm"
                    placeholder="(XX) XXXXX-XXXX"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">Categoria Principal</label>
                  <select
                    value={vendorCategory}
                    onChange={(e) => setVendorCategory(e.target.value)}
                    className="w-full p-2 border border-neutral-300 dark:border-neutral-600 rounded bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 text-sm"
                  >
                    <option value="MATERIAL">Material / Peça</option>
                    <option value="SERVICO">Serviço Terceirizado</option>
                    <option value="TRANSPORTE">Transporte / Frete</option>
                    <option value="FERRAMENTAS">Ferramentas</option>
                    <option value="OUTROS">Outros</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">E-mail Comercial</label>
                <input
                  type="email"
                  value={vendorEmail}
                  onChange={(e) => setVendorEmail(e.target.value)}
                  className="w-full p-2 border border-neutral-300 dark:border-neutral-600 rounded bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 text-sm"
                  placeholder="fornecedor@email.com"
                />
              </div>
            </div>
            <div className="p-4 border-t border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowVendorModal(false)}
                className="px-4 py-2 border border-neutral-300 dark:border-neutral-600 text-neutral-700 dark:text-neutral-300 text-sm rounded bg-white dark:bg-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-600 font-medium"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleCreateVendorInline}
                disabled={isCreatingVendor || !vendorName.trim()}
                className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm rounded font-medium disabled:opacity-50"
              >
                {isCreatingVendor ? 'Criando...' : 'Cadastrar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </form>
  );
}
