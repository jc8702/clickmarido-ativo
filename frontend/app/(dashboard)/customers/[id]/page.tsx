'use client';

import React, { use } from 'react';
import { useRouter } from 'next/navigation';
import { CustomerForm } from '../../../../components/customers/CustomerForm';
import { useCustomer, useUpdateCustomer } from '../../../../hooks/useCustomers';
import Link from 'next/link';

export default function EditCustomerPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  
  const { data: initialData, isLoading: isFetching } = useCustomer(id);
  const { mutateAsync, isPending } = useUpdateCustomer(id);

  const onSubmit = async (data: any) => {
    try {
      await mutateAsync(data);
      alert('Cliente atualizado com sucesso!');
      router.push('/customers');
    } catch (err) {
      alert('Erro ao atualizar cliente');
    }
  };

  if (isFetching) return <div className="p-8">Carregando...</div>;
  if (!initialData) return <div className="p-8">Cliente não encontrado.</div>;

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8 flex items-center gap-4">
        <Link href="/customers" className="text-blue-600 hover:underline">&larr; Voltar</Link>
        <h1 className="text-2xl font-bold text-gray-900">Editar Cliente: {initialData.name}</h1>
      </div>
      
      <CustomerForm initialData={initialData} onSubmit={onSubmit} isLoading={isPending} />
    </div>
  );
}
