'use client';

import React, { useState, use } from 'react';
import { useVendor, useUpdateVendor, useDeleteVendor } from '@/hooks/useVendors';
import { VendorForm } from '@/components/vendors/VendorForm';
import { VendorPurchaseHistory } from '@/components/vendors/VendorPurchaseHistory';
import { Shimmer } from '@/components/Shimmer';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/Button';
import { Modal } from '@/components/Modal';

type Props = {
  params: Promise<{ id: string }>;
};

export default function VendorDetailsPage({ params }: Props) {
  const { id } = use(params);
  const router = useRouter();
  const { data: vendor, isLoading, error, mutate } = useVendor(id);
  const { mutateAsync: updateVendor, isPending, error: updateError } = useUpdateVendor(id);
  const { mutateAsync: deleteVendor, isPending: deleting } = useDeleteVendor();
  const [activeTab, setActiveTab] = useState<'details' | 'history'>('details');
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const handleDelete = async () => {
    try {
      await deleteVendor(id);
      setShowDeleteModal(false);
      alert('Fornecedor excluído com sucesso!');
      router.push('/vendors');
    } catch (err: any) {
      console.error('Error deleting vendor:', err);
      alert(err.message || 'Erro ao excluir fornecedor');
    }
  };

  const handleSubmit = async (formData: any) => {
    try {
      await updateVendor(formData);
      alert('Fornecedor atualizado com sucesso!');
      mutate();
    } catch (err) {
      console.error('Error updating vendor:', err);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Shimmer className="h-6 w-32" />
        <Shimmer className="h-10 w-64" />
        <Shimmer className="h-96 w-full" />
      </div>
    );
  }

  if (error || !vendor) {
    return (
      <div className="p-6 bg-neutral-50 dark:bg-neutral-950 min-h-screen">
        <div className="p-4 bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800 rounded">
          Erro ao carregar fornecedor: {error || 'Fornecedor não encontrado'}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-neutral-50 dark:bg-neutral-950 min-h-screen">
      <div className="flex items-center space-x-3">
        <Link 
          href="/vendors" 
          className="text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 text-sm font-semibold"
        >
          ← Voltar para Fornecedores
        </Link>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">{vendor.name}</h1>
            {vendor.isBlocked && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300 border border-red-300 dark:border-red-800">
                Bloqueado
              </span>
            )}
          </div>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            Categoria: {vendor.category} | Classificação: {vendor.classification}
          </p>
        </div>
        <div className="flex space-x-2">
          <Button
            variant="danger"
            onClick={() => setShowDeleteModal(true)}
          >
            Excluir Fornecedor
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-neutral-200 dark:border-neutral-700">
        <nav className="flex space-x-4" aria-label="Tabs">
          <button
            onClick={() => setActiveTab('details')}
            className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'details'
                ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300 dark:text-neutral-400 dark:hover:text-neutral-300'
            }`}
          >
            📋 Cadastro & Controles
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'history'
                ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300 dark:text-neutral-400 dark:hover:text-neutral-300'
            }`}
          >
            📦 Histórico de Compras
          </button>
        </nav>
      </div>

      {updateError && (
        <div className="p-4 bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800 rounded">
          {updateError}
        </div>
      )}

      {activeTab === 'details' ? (
        <VendorForm initialData={vendor} onSubmit={handleSubmit} isLoading={isPending} />
      ) : (
        <div className="space-y-6">
          <div className="border-b border-neutral-200 dark:border-neutral-700 pb-2">
            <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">Pedidos Vinculados</h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">Total investido e lista de ordens de compra efetuadas.</p>
          </div>
          <VendorPurchaseHistory vendorId={vendor.id} />
        </div>
      )}
      {/* MODAL DE EXCLUSÃO */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Excluir Fornecedor"
      >
        <div className="space-y-4">
          <p className="text-sm text-neutral-700 dark:text-neutral-300">
            Tem certeza que deseja excluir o fornecedor <strong>{vendor.name}</strong>?
          </p>
          <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
            <p className="text-xs text-amber-700 dark:text-amber-400 font-semibold">
              Atenção: A exclusão é irreversível.
            </p>
            <p className="text-xs text-amber-600 dark:text-amber-500 mt-1">
              Caso o fornecedor possua Ordens de Compra associadas, a exclusão será bloqueada para manter a integridade dos dados (considere Desativar).
            </p>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setShowDeleteModal(false)}>
              Cancelar
            </Button>
            <Button variant="danger" onClick={handleDelete} isLoading={deleting}>
              Sim, Excluir
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
