'use client';

import React from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { customerSchema, CustomerFormValues } from '../../lib/validations/customer.schema';

type Props = {
  initialData?: any;
  onSubmit: (data: CustomerFormValues) => void;
  isLoading: boolean;
};

export function CustomerForm({ initialData, onSubmit, isLoading }: Props) {
  const { register, control, handleSubmit, formState: { errors } } = useForm<CustomerFormValues>({
    resolver: zodResolver(customerSchema),
    defaultValues: initialData || {
      name: '', email: '', phone: '', cpf_cnpj: '', notes: '',
      addresses: [{ street: '', number: '', neighborhood: '', city: '', state: '', postal_code: '' }]
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'addresses'
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 bg-white dark:bg-neutral-800 p-6 rounded shadow">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">Nome *</label>
          <input {...register('name')} className="mt-1 block w-full p-2 border border-neutral-300 dark:border-neutral-600 rounded bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100" placeholder="João da Silva" />
          {errors.name && <p className="text-red-500 dark:text-red-400 text-xs mt-1">{errors.name.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">Telefone *</label>
          <input {...register('phone')} className="mt-1 block w-full p-2 border border-neutral-300 dark:border-neutral-600 rounded bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100" placeholder="+5511999999999" />
          {errors.phone && <p className="text-red-500 dark:text-red-400 text-xs mt-1">{errors.phone.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">E-mail</label>
          <input {...register('email')} className="mt-1 block w-full p-2 border border-neutral-300 dark:border-neutral-600 rounded bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100" placeholder="joao@example.com" />
          {errors.email && <p className="text-red-500 dark:text-red-400 text-xs mt-1">{errors.email.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">CPF/CNPJ</label>
          <input {...register('cpf_cnpj')} className="mt-1 block w-full p-2 border border-neutral-300 dark:border-neutral-600 rounded bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100" placeholder="12345678901" />
          {errors.cpf_cnpj && <p className="text-red-500 dark:text-red-400 text-xs mt-1">{errors.cpf_cnpj.message}</p>}
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">Observações</label>
          <textarea {...register('notes')} className="mt-1 block w-full p-2 border border-neutral-300 dark:border-neutral-600 rounded bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100" rows={3}></textarea>
        </div>
      </div>

      <div className="border-t border-neutral-200 dark:border-neutral-700 pt-4">
        <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100 mb-2">Endereços</h3>
        {errors.addresses?.message && <p className="text-red-500 dark:text-red-400 text-xs mb-2">{errors.addresses.message}</p>}
        
        <div className="space-y-4">
          {fields.map((field, index) => (
            <div key={field.id} className="p-4 border border-neutral-200 dark:border-neutral-600 rounded bg-neutral-50 dark:bg-neutral-700/50 relative">
              <button type="button" onClick={() => remove(index)} className="absolute top-2 right-2 text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 text-sm">
                Remover
              </button>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300">Rua *</label>
                  <input {...register(`addresses.${index}.street`)} className="mt-1 block w-full p-2 border border-neutral-300 dark:border-neutral-600 rounded text-sm bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100" />
                  {errors.addresses?.[index]?.street && <p className="text-red-500 dark:text-red-400 text-xs mt-1">{errors.addresses[index]?.street?.message}</p>}
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300">Número *</label>
                  <input {...register(`addresses.${index}.number`)} className="mt-1 block w-full p-2 border border-neutral-300 dark:border-neutral-600 rounded text-sm bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100" />
                  {errors.addresses?.[index]?.number && <p className="text-red-500 dark:text-red-400 text-xs mt-1">{errors.addresses[index]?.number?.message}</p>}
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300">Bairro *</label>
                  <input {...register(`addresses.${index}.neighborhood`)} className="mt-1 block w-full p-2 border border-neutral-300 dark:border-neutral-600 rounded text-sm bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100" />
                  {errors.addresses?.[index]?.neighborhood && <p className="text-red-500 dark:text-red-400 text-xs mt-1">{errors.addresses[index]?.neighborhood?.message}</p>}
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300">Cidade *</label>
                  <input {...register(`addresses.${index}.city`)} className="mt-1 block w-full p-2 border border-neutral-300 dark:border-neutral-600 rounded text-sm bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100" />
                  {errors.addresses?.[index]?.city && <p className="text-red-500 dark:text-red-400 text-xs mt-1">{errors.addresses[index]?.city?.message}</p>}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300">UF *</label>
                    <input {...register(`addresses.${index}.state`)} className="mt-1 block w-full p-2 border border-neutral-300 dark:border-neutral-600 rounded text-sm bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 uppercase" maxLength={2} />
                    {errors.addresses?.[index]?.state && <p className="text-red-500 dark:text-red-400 text-xs mt-1">{errors.addresses[index]?.state?.message}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300">CEP *</label>
                    <input {...register(`addresses.${index}.postal_code`)} className="mt-1 block w-full p-2 border border-neutral-300 dark:border-neutral-600 rounded text-sm bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100" />
                    {errors.addresses?.[index]?.postal_code && <p className="text-red-500 dark:text-red-400 text-xs mt-1">{errors.addresses[index]?.postal_code?.message}</p>}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {fields.length < 5 && (
          <button 
            type="button" 
            onClick={() => append({ street: '', number: '', neighborhood: '', city: '', state: '', postal_code: '' })}
            className="mt-4 px-4 py-2 bg-neutral-200 dark:bg-neutral-600 text-neutral-800 dark:text-neutral-200 rounded hover:bg-neutral-300 dark:hover:bg-neutral-500 text-sm font-medium"
          >
            + Adicionar Endereço
          </button>
        )}
      </div>

      <div className="flex justify-end pt-4 border-t border-neutral-200 dark:border-neutral-700">
        <button 
          type="submit" 
          disabled={isLoading}
          className="px-6 py-2 bg-primary-600 text-white rounded hover:bg-primary-700 font-medium disabled:opacity-50"
        >
          {isLoading ? 'Salvando...' : 'Salvar Cliente'}
        </button>
      </div>
    </form>
  );
}
