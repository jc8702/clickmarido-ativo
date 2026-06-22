'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useVendors } from '@/hooks/useVendors';
import { VendorClassificationBadge } from '@/components/vendors/VendorClassificationBadge';
import { Shimmer } from '@/components/Shimmer';

export default function VendorsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [classification, setClassification] = useState('');
  const [isActive, setIsActive] = useState('');
  const [isBlocked, setIsBlocked] = useState('');

  const { data, isLoading, error, mutate } = useVendors(
    page,
    search,
    category,
    classification,
    isActive,
    isBlocked
  );

  const vendors = data?.data || [];
  const meta = data?.meta || { total: 0, page: 1, limit: 20, totalPages: 1 };

  return (
    <div className="p-6 space-y-6 bg-neutral-50 dark:bg-neutral-950 min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">Fornecedores</h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">Gerenciamento de parceiros, prestadores e fornecedores de insumos.</p>
        </div>
        <Link 
          href="/vendors/new"
          className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded font-semibold text-sm shadow transition-colors"
        >
          + Novo Fornecedor
        </Link>
      </div>

      {/* Filtros */}
      <div className="bg-white dark:bg-neutral-800 p-4 rounded shadow border border-neutral-200 dark:border-neutral-700">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <div className="md:col-span-2">
            <input
              type="text"
              placeholder="Buscar por nome, fantasia, CPF/CNPJ..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full p-2 border border-neutral-300 dark:border-neutral-600 rounded bg-white dark:bg-neutral-750 text-neutral-900 dark:text-neutral-100 text-sm"
            />
          </div>
          <div>
            <select
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                setPage(1);
              }}
              className="w-full p-2 border border-neutral-300 dark:border-neutral-600 rounded bg-white dark:bg-neutral-750 text-neutral-900 dark:text-neutral-100 text-sm"
            >
              <option value="">Todas Categorias</option>
              <option value="MATERIAL">Material / Peça</option>
              <option value="SERVICO">Serviço Terceirizado</option>
              <option value="TRANSPORTE">Transporte / Frete</option>
              <option value="EQUIPAMENTO">Locação de Equipamento</option>
              <option value="TERCEIRIZADO">Mão de Obra</option>
              <option value="OUTROS">Outros</option>
            </select>
          </div>
          <div>
            <select
              value={classification}
              onChange={(e) => {
                setClassification(e.target.value);
                setPage(1);
              }}
              className="w-full p-2 border border-neutral-300 dark:border-neutral-600 rounded bg-white dark:bg-neutral-750 text-neutral-900 dark:text-neutral-100 text-sm"
            >
              <option value="">Todas Classificações</option>
              <option value="A">Classe A (Preferencial)</option>
              <option value="B">Classe B (Aprovado)</option>
              <option value="C">Classe C (Atenção)</option>
              <option value="D">Classe D (Bloqueável)</option>
            </select>
          </div>
          <div>
            <select
              value={isBlocked}
              onChange={(e) => {
                setIsBlocked(e.target.value);
                setPage(1);
              }}
              className="w-full p-2 border border-neutral-300 dark:border-neutral-600 rounded bg-white dark:bg-neutral-750 text-neutral-900 dark:text-neutral-100 text-sm"
            >
              <option value="">Todos Status</option>
              <option value="false">Ativos (Desbloqueados)</option>
              <option value="true">Bloqueados</option>
            </select>
          </div>
        </div>
      </div>

      {/* Lista */}
      {isLoading ? (
        <Shimmer className="h-64 w-full" />
      ) : error ? (
        <div className="p-4 bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800 rounded">
          Erro ao listar fornecedores: {error}
        </div>
      ) : (
        <div className="bg-white dark:bg-neutral-800 rounded shadow overflow-hidden border border-neutral-200 dark:border-neutral-700">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-neutral-200 dark:divide-neutral-700 text-sm">
              <thead className="bg-neutral-50 dark:bg-neutral-700/30 text-neutral-600 dark:text-neutral-300 font-medium">
                <tr>
                  <th className="px-6 py-3 text-left">Fornecedor</th>
                  <th className="px-6 py-3 text-left">Categoria</th>
                  <th className="px-6 py-3 text-left">Classificação</th>
                  <th className="px-6 py-3 text-left">Contato</th>
                  <th className="px-6 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 dark:divide-neutral-700 text-neutral-800 dark:text-neutral-200">
                {vendors.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-10 text-center text-neutral-500 dark:text-neutral-400">
                      Nenhum fornecedor encontrado para os filtros selecionados.
                    </td>
                  </tr>
                ) : (
                  vendors.map((vendor: any) => (
                    <tr key={vendor.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-700/50">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-neutral-900 dark:text-neutral-100">{vendor.name}</div>
                        {vendor.tradeName && <div className="text-xs text-neutral-500 dark:text-neutral-400">{vendor.tradeName}</div>}
                        {vendor.cnpjCpf && <div className="text-xs text-neutral-400 dark:text-neutral-500 mt-0.5">CNPJ/CPF: {vendor.cnpjCpf}</div>}
                      </td>
                      <td className="px-6 py-4 text-xs font-semibold text-neutral-600 dark:text-neutral-300">
                        {vendor.category}
                      </td>
                      <td className="px-6 py-4">
                        <VendorClassificationBadge classification={vendor.classification} isBlocked={vendor.isBlocked} />
                      </td>
                      <td className="px-6 py-4 text-xs space-y-0.5 text-neutral-600 dark:text-neutral-300">
                        {vendor.contactName && <div className="font-medium text-neutral-800 dark:text-neutral-200">{vendor.contactName}</div>}
                        {vendor.phone && <div>Tel: {vendor.phone}</div>}
                        {vendor.email && <div className="truncate max-w-xs">{vendor.email}</div>}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end space-x-3 font-semibold">
                          <Link href={`/vendors/${vendor.id}`} className="text-primary-600 dark:text-primary-400 hover:text-primary-800">
                            Visualizar
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Paginação */}
          {meta.totalPages > 1 && (
            <div className="bg-neutral-50 dark:bg-neutral-700/30 px-6 py-3 flex items-center justify-between border-t border-neutral-200 dark:border-neutral-700">
              <span className="text-xs text-neutral-500 dark:text-neutral-400">
                Mostrando página {meta.page} de {meta.totalPages} ({meta.total} registros)
              </span>
              <div className="flex space-x-2">
                <button
                  disabled={page === 1}
                  onClick={() => setPage(p => p - 1)}
                  className="px-3 py-1 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-600 rounded text-xs font-semibold disabled:opacity-50 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700"
                >
                  Anterior
                </button>
                <button
                  disabled={page === meta.totalPages}
                  onClick={() => setPage(p => p + 1)}
                  className="px-3 py-1 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-600 rounded text-xs font-semibold disabled:opacity-50 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700"
                >
                  Próximo
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
