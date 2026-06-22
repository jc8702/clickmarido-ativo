'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { VendorForm } from '@/components/vendors/VendorForm';
import { useCreateVendor } from '@/hooks/useVendors';
import Link from 'next/link';

export default function NewVendorPage() {
  const router = useRouter();
  const { mutateAsync: createVendor, isPending, error } = useCreateVendor();

  const handleSubmit = async (data: any) => {
    try {
      await createVendor(data);
      router.push('/vendors');
    } catch (err) {
      // O erro é tratado no hook ou exibido no componente
      console.error('Error creating vendor:', err);
    }
  };

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

      <div>
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">Novo Fornecedor</h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">Cadastre um parceiro ou fornecedor no CRM.</p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800 rounded">
          {error}
        </div>
      )}

      <VendorForm onSubmit={handleSubmit} isLoading={isPending} />
    </div>
  );
}
