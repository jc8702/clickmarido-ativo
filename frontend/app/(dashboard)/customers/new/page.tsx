'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCreateCustomer } from '@/hooks/useCustomers';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CustomerSchema } from '@/lib/schemas';

export default function NewCustomerPage() {
  const router = useRouter();
  const { mutateAsync, isPending } = useCreateCustomer();
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(CustomerSchema),
  });
  const [error, setError] = useState('');

  const onSubmit = async (data: any) => {
    try {
      setError('');
      await mutateAsync(data);
      router.push('/dashboard/customers');
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Novo Cliente</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-lg shadow p-6 space-y-4">
        {error && <div className="bg-red-50 text-red-700 p-4 rounded">{error}</div>}

        <div>
          <label className="block text-sm font-medium text-gray-700">Nome</label>
          <input
            {...register('name')}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
            placeholder="João Silva"
          />
          {errors.name && <p className="text-red-600 text-sm">{String(errors.name.message)}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Email</label>
          <input
            {...register('email')}
            type="email"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
            placeholder="joao@example.com"
          />
          {errors.email && <p className="text-red-600 text-sm">{String(errors.email.message)}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Telefone</label>
          <input
            {...register('phone')}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
            placeholder="11999999999"
          />
          {errors.phone && <p className="text-red-600 text-sm">{String(errors.phone.message)}</p>}
        </div>

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={isPending}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {isPending ? 'Salvando...' : 'Salvar'}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
