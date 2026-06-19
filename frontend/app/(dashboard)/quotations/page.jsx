'use client';

import { useState, useEffect } from 'react';
import api from '../../../lib/api';
import Table from '../../../components/Table';
import Button from '../../../components/Button';
import QuotationForm from '../../../components/QuotationForm';

export default function QuotationsPage() {
  const [quotations, setQuotations] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchQuotations = async () => {
    setLoading(true);
    try {
      const res = await api.get('/quotations');
      setQuotations(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuotations();
  }, []);

  const handleApprove = async (id) => {
    try {
      await api.patch(`/quotations/${id}/approve`);
      fetchQuotations(); // recarrega após aprovar
    } catch (err) {
      alert("Erro ao aprovar orçamento.");
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      draft: 'bg-gray-100 text-gray-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800'
    };
    return <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${styles[status]}`}>{status.toUpperCase()}</span>;
  };

  const columns = [
    { header: 'ID', accessor: 'id' },
    { header: 'Cliente', accessor: 'customer_name' },
    { header: 'Total (R$)', render: (row) => Number(row.total_amount).toFixed(2) },
    { header: 'Status', render: (row) => getStatusBadge(row.status) },
    { 
      header: 'Ações', 
      render: (row) => (
        row.status === 'draft' ? (
          <Button variant="secondary" onClick={() => handleApprove(row.id)} className="text-xs py-1 px-2">Aprovar</Button>
        ) : null
      )
    }
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Orçamentos</h2>
        {!showForm && (
          <Button onClick={() => setShowForm(true)}>+ Novo Orçamento</Button>
        )}
      </div>

      {showForm && (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Criar Orçamento</h3>
          <QuotationForm 
            onCancel={() => setShowForm(false)} 
            onSuccess={() => {
              setShowForm(false);
              fetchQuotations();
            }} 
          />
        </div>
      )}

      {loading ? (
        <div>Carregando...</div>
      ) : (
        <Table columns={columns} data={quotations} />
      )}
    </div>
  );
}
