'use client';

import { useState, useEffect } from 'react';
import api from '../../../lib/api';
import Table from '../../../components/Table';
import Button from '../../../components/Button';
import CustomerForm from '../../../components/CustomerForm';

export default function CustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/customers');
      setCustomers(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const columns = [
    { header: 'ID', accessor: 'id' },
    { header: 'Nome', accessor: 'name' },
    { header: 'E-mail', accessor: 'email' },
    { header: 'Telefone', accessor: 'phone' }
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Clientes</h2>
        {!showForm && (
          <Button onClick={() => setShowForm(true)}>+ Novo Cliente</Button>
        )}
      </div>

      {showForm && (
        <CustomerForm 
          onCancel={() => setShowForm(false)} 
          onSuccess={() => {
            setShowForm(false);
            fetchCustomers();
          }} 
        />
      )}

      {loading ? (
        <div>Carregando...</div>
      ) : (
        <Table columns={columns} data={customers} />
      )}
    </div>
  );
}
