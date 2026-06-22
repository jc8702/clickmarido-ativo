'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useProducts, useDeleteProduct } from '@/hooks/useProducts';
import { useAuth } from '@/hooks/useAuth';
import { Navigation } from '@/components/Navigation';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { ProductTable } from '@/components/products/ProductTable';
import { ProductForm } from '@/components/products/ProductForm';
import { useCreateProduct, useUpdateProduct } from '@/hooks/useProducts';
import { TableShimmer } from '@/components/Shimmer';

export default function ProductsPage() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const authUser = user as { name?: string; email: string; role: string } | null;

  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { data, isLoading, mutate } = useProducts(1, debouncedSearch, typeFilter);
  const { mutateAsync: createProduct, isPending: isCreating } = useCreateProduct();

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const products = (data?.data || []) as any[];

  const handleEdit = (product: any) => {
    setEditingProduct(product);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente excluir este item?')) return;
    setDeletingId(id);
    try {
      const response = await fetch(`/api/products/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      if (response.ok) {
        mutate();
      } else {
        alert('Erro ao excluir produto.');
      }
    } catch {
      alert('Erro ao excluir produto.');
    } finally {
      setDeletingId(null);
    }
  };

  const handleSubmitForm = async (formData: any) => {
    try {
      if (editingProduct) {
        await fetch(`/api/products/${editingProduct.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
          body: JSON.stringify(formData),
        });
      } else {
        await createProduct(formData);
      }
      setShowForm(false);
      setEditingProduct(null);
      mutate();
    } catch (err: any) {
      alert(err.message || 'Erro ao salvar produto');
    }
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingProduct(null);
  };

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 flex flex-col">
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
            <h1 className="text-[40px] font-bold tracking-tight text-neutral-900 dark:text-neutral-100 mb-1">Serviços e Peças</h1>
            <p className="text-neutral-600 dark:text-neutral-400">
              {isLoading ? 'Carregando...' : `${products.length} itens cadastrados`}
            </p>
          </div>
          <Button onClick={() => { setEditingProduct(null); setShowForm(true); }} className="shadow-md hover:shadow-lg transition-all duration-300">
            + Novo Item
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="flex-1">
            <Input
              placeholder="Buscar por nome, SKU ou categoria..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="shadow-sm border-neutral-200 dark:border-neutral-600"
            />
          </div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 text-sm"
          >
            <option value="">Todos os tipos</option>
            <option value="SERVICO">Serviços</option>
            <option value="PECA">Peças</option>
          </select>
        </div>

        {isLoading ? (
          <Card className="p-6">
            <TableShimmer rows={5} cols={5} />
          </Card>
        ) : (
          <Card shadow="lg" className="border border-neutral-100 dark:border-neutral-700 overflow-hidden">
            <ProductTable
              data={products}
              isLoading={isLoading}
              onEdit={handleEdit}
              onDelete={handleDelete}
              deletingId={deletingId}
            />
          </Card>
        )}
      </main>

      {/* Modal de Cadastro/Edição */}
      {showForm && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[1040] animate-fade-in flex items-center justify-center p-4">
          <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-neutral-200 dark:border-neutral-700 flex items-center justify-between">
              <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">
                {editingProduct ? 'Editar Item' : 'Novo Item'}
              </h2>
              <button
                onClick={handleCloseForm}
                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-500 dark:text-neutral-400 transition-colors"
              >
                ✕
              </button>
            </div>
            <div className="p-6">
              <ProductForm
                initialData={editingProduct}
                onSubmit={handleSubmitForm}
                isLoading={isCreating}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
