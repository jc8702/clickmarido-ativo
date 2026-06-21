'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { CustomerForm } from '@/components/customers/CustomerForm';
import { useCreateCustomer } from '@/hooks/useCustomers';
import Link from 'next/link';

export default function NewCustomerPage() {
  const router = useRouter();
  const { mutateAsync, isPending } = useCreateCustomer();

  const onSubmit = async (data: any) => {
    try {
      await mutateAsync(data);
      router.push('/customers');
    } catch (err) {
      alert('Erro ao criar cliente');
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8 flex items-center gap-4">
        <Link href="/customers" className="text-blue-600 hover:underline">&larr; Voltar</Link>
        <h1 className="text-2xl font-bold text-gray-900">Novo Cliente</h1>
      </div>
      
      <CustomerForm onSubmit={onSubmit} isLoading={isPending} />
    </div>
  );
}
