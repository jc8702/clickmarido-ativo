'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useCustomers, useDeleteCustomer } from '@/hooks/useCustomers';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Table, TableHead, TableHeader, TableRow, TableCell } from '@/components/Table';
import { Badge } from '@/components/Badge';
import { Navigation } from '@/components/Navigation';
import { useAuth } from '@/hooks/useAuth';
import { TableShimmer } from '@/components/Shimmer';

interface CustomerAddress {
  street: string;
  number: string;
  complement?: string;
  neighborhood?: string;
  city: string;
  state: string;
  zip: string;
}

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  addresses: string | CustomerAddress[]; // Pode ser string JSON ou array
}

export default function CustomersPage() {
  const { user, logout } = useAuth();
  const authUser = user as { name?: string; email: string; role: string } | null;
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  
  const { data, isLoading, mutate } = useCustomers(1, debouncedSearch);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);

  // Efeito para debounce da busca
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const customers = (data?.data || []) as Customer[];

  useEffect(() => {
    if (typeof window !== 'undefined' && customers.length > 0) {
      const params = new URLSearchParams(window.location.search);
      const id = params.get('id');
      if (id) {
        const found = customers.find(c => c.id === id);
        if (found) {
          setSelectedCustomer(found);
        }
      }
    }
  }, [customers]);

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente excluir este cliente?')) return;
    setIsDeletingId(id);
    try {
      const response = await fetch(`/api/customers/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (response.ok) {
        mutate();
        if (selectedCustomer?.id === id) {
          setSelectedCustomer(null);
        }
      } else {
        alert('Erro ao excluir cliente.');
      }
    } catch (err) {
      console.error(err);
      alert('Erro ao excluir cliente.');
    } finally {
      setIsDeletingId(null);
    }
  };

  // Helper para formatar o endereço principal da listagem
  const getPrimaryAddress = (addressesField: string | CustomerAddress[]): string => {
    try {
      const list = typeof addressesField === 'string' 
        ? JSON.parse(addressesField) 
        : addressesField;
      
      if (Array.isArray(list) && list.length > 0) {
        const addr = list[0] as CustomerAddress;
        return `${addr.street || ''}, ${addr.number || ''} - ${addr.city || ''}/${addr.state || ''}`;
      }
      return 'Sem endereço cadastrado';
    } catch {
      return 'Sem endereço cadastrado';
    }
  };

  // Helper para obter a lista completa de endereços
  const getAddressesList = (addressesField: string | CustomerAddress[]): CustomerAddress[] => {
    try {
      return typeof addressesField === 'string' 
        ? JSON.parse(addressesField) 
        : addressesField || [];
    } catch {
      return [];
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 flex flex-col relative overflow-x-hidden">
      <Navigation
        logo={<div className="text-2xl font-bold bg-gradient-hero bg-clip-text text-transparent">Click Marido</div>}
        links={[
          { href: '/dashboard', label: 'Dashboard' },
          { href: '/customers', label: 'Clientes' },
          { href: '/quotations', label: 'Orçamentos' },
          { href: '/products', label: 'Serviços e Peças' },
          { href: '/service-orders', label: 'Ordens de Serviço' },
          { href: '/payments', label: 'Pagamentos' },
          { href: '/warranties', label: 'Garantias' },
        ]}
        user={authUser ? { name: authUser.name || 'Admin', email: authUser.email } : { name: 'Admin', email: '' }}
        onLogout={logout}
      />

      <main className="max-w-7xl mx-auto px-6 py-10 w-full flex-1">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-[40px] font-bold tracking-tight text-neutral-900 dark:text-neutral-100 mb-1">Clientes</h1>
            <p className="text-neutral-600 dark:text-neutral-400">
              {isLoading ? 'Carregando clientes...' : `${customers.length} clientes cadastrados`}
            </p>
          </div>
          <Link href="/customers/new">
            <Button className="shadow-md hover:shadow-lg transition-all duration-300">
              + Novo Cliente
            </Button>
          </Link>
        </div>

        <div className="mb-6">
          <Input
            placeholder="Buscar por nome, email ou telefone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="shadow-sm border-neutral-200 dark:border-neutral-600"
          />
        </div>

        {isLoading ? (
          <Card className="p-6">
            <TableShimmer rows={5} cols={4} />
          </Card>
        ) : customers.length === 0 ? (
          <Card gradient="none" shadow="md" className="border border-neutral-200/60 dark:border-neutral-700">
            <div className="text-center py-16 text-neutral-500 dark:text-neutral-400">
              <span className="text-4xl block mb-4">👥</span>
              Nenhum cliente encontrado
            </div>
          </Card>
        ) : (
          <Card shadow="lg" className="border border-neutral-100 dark:border-neutral-700 overflow-hidden">
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeader>Cliente</TableHeader>
                  <TableHeader>Telefone</TableHeader>
                  <TableHeader>Endereço Principal</TableHeader>
                  <TableHeader>Ações</TableHeader>
                </TableRow>
              </TableHead>
              <tbody>
                {customers.map((customer) => (
                  <TableRow key={customer.id} className="group hover:bg-neutral-50 dark:hover:bg-neutral-700/50 transition-colors">
                    <TableCell className="font-medium">
                      <button
                        onClick={() => setSelectedCustomer(customer)}
                        className="text-left hover:text-primary-600 dark:hover:text-primary-400 focus:outline-none transition-colors"
                      >
                        <div className="font-semibold text-neutral-900 dark:text-neutral-100 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                          {customer.name}
                        </div>
                        <div className="text-xs text-neutral-500 dark:text-neutral-400 font-normal">{customer.email}</div>
                      </button>
                    </TableCell>
                    <TableCell>{customer.phone}</TableCell>
                    <TableCell className="max-w-xs truncate text-neutral-600 dark:text-neutral-400" title={getPrimaryAddress(customer.addresses)}>
                      {getPrimaryAddress(customer.addresses)}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2 opacity-80 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => setSelectedCustomer(customer)}
                          className="px-3 py-1.5 rounded-md text-xs font-semibold bg-neutral-100 dark:bg-neutral-700 hover:bg-neutral-200 dark:hover:bg-neutral-600 text-neutral-700 dark:text-neutral-300 transition-colors"
                        >
                          Detalhes
                        </button>
                        <Link href={`/customers/${customer.id}`}>
                          <Button size="xs" variant="outline">
                            Editar
                          </Button>
                        </Link>
                        <Button 
                          size="xs" 
                          variant="danger" 
                          onClick={() => handleDelete(customer.id)}
                          isLoading={isDeletingId === customer.id}
                        >
                          Excluir
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </tbody>
            </Table>
          </Card>
        )}
      </main>

      {/* Backdrop do Drawer */}
      {selectedCustomer && (
        <div 
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[1040] animate-fade-in"
          onClick={() => setSelectedCustomer(null)}
        />
      )}

      {/* Gaveta Lateral (Drawer) de Detalhes do Cliente */}
      <div 
        className={`fixed inset-y-0 right-0 max-w-lg w-full bg-white dark:bg-neutral-800 shadow-2xl z-[1050] transition-transform duration-300 transform flex flex-col ${
          selectedCustomer ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {selectedCustomer && (
          <>
            <div className="p-6 border-b border-neutral-100 dark:border-neutral-700 flex items-center justify-between bg-gradient-to-r from-neutral-50 dark:from-neutral-700 to-white dark:to-neutral-800">
              <div>
                <h3 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">Ficha do Cliente</h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">ID: {selectedCustomer.id}</p>
              </div>
              <button 
                onClick={() => setSelectedCustomer(null)}
                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="p-6 flex-1 overflow-y-auto space-y-6">
              {/* Informações Básicas */}
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">Informações Básicas</h4>
                <div className="bg-neutral-50 dark:bg-neutral-700/50 p-4 rounded-xl space-y-3">
                  <div>
                    <label className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">Nome</label>
                    <div className="text-base font-bold text-neutral-900 dark:text-neutral-100">{selectedCustomer.name}</div>
                  </div>
                  <div>
                    <label className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">E-mail</label>
                    <div className="text-sm text-neutral-800 dark:text-neutral-200">{selectedCustomer.email || 'Não informado'}</div>
                  </div>
                  <div>
                    <label className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">Telefone</label>
                    <div className="text-sm text-neutral-800 dark:text-neutral-200">{selectedCustomer.phone}</div>
                  </div>
                </div>
              </div>

              {/* Endereços */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="text-sm font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">Endereços Cadastrados</h4>
                  <Badge variant="primary" size="sm">
                    {getAddressesList(selectedCustomer.addresses).length}
                  </Badge>
                </div>
                
                <div className="space-y-3">
                  {getAddressesList(selectedCustomer.addresses).map((addr, index) => (
                    <div key={index} className="border border-neutral-150 dark:border-neutral-600 p-4 rounded-xl bg-white dark:bg-neutral-700 shadow-sm hover:border-neutral-300 dark:hover:border-neutral-500 transition-colors relative">
                      <span className="absolute top-3 right-3 text-xs bg-neutral-100 dark:bg-neutral-600 text-neutral-500 dark:text-neutral-400 px-2 py-0.5 rounded-full font-bold">
                        {index === 0 ? 'Principal' : `Local ${index + 1}`}
                      </span>
                      <div className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                        {addr.street}, {addr.number}
                      </div>
                      {addr.complement && (
                        <div className="text-xs text-neutral-600 dark:text-neutral-400 mt-0.5">Compl: {addr.complement}</div>
                      )}
                      <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                        Bairro: {addr.neighborhood || 'N/A'} • {addr.city}/{addr.state}
                      </div>
                      <div className="text-xs text-neutral-400 dark:text-neutral-500 mt-0.5">CEP: {addr.zip}</div>
                    </div>
                  ))}
                  {getAddressesList(selectedCustomer.addresses).length === 0 && (
                    <p className="text-sm text-neutral-400 dark:text-neutral-500 text-center py-4 bg-neutral-50 dark:bg-neutral-700/50 rounded-xl">
                      Nenhum endereço associado.
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-neutral-100 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-700/50 flex gap-3">
              <Link href={`/customers/${selectedCustomer.id}`} className="flex-1">
                <Button fullWidth>Editar Cadastro</Button>
              </Link>
              <Link href={`/quotations/new?customerId=${selectedCustomer.id}`} className="flex-1">
                <Button variant="secondary" fullWidth>Novo Orçamento</Button>
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
