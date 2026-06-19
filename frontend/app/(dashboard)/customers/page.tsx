'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { CustomerTable } from '../../../components/customers/CustomerTable';
import { useCustomers } from '../../../hooks/useCustomers';

export default function CustomersPage() {
  const [search, setSearch] = useState('');
  const { data, isLoading } = useCustomers(1, search);

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clientes</h1>
          <p className="text-gray-500 text-sm">Gerencie a carteira de clientes</p>
        </div>
        <Link 
          href="/customers/new" 
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium"
        >
          + Novo Cliente
        </Link>
      </div>

      <div className="mb-6">
        <input 
          type="text" 
          placeholder="Buscar por nome ou telefone..." 
          className="w-full md:w-1/3 p-2 border rounded shadow-sm"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <CustomerTable data={data} isLoading={isLoading} />
    </div>
  );
}
