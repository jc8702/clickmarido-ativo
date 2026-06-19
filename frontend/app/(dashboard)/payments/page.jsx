'use client';

import { useState, useEffect } from 'react';
import api from '../../../lib/api';
import Table from '../../../components/Table';
import Button from '../../../components/Button';
import Modal from '../../../components/Modal';
import PaymentForm from '../../../components/PaymentForm';

export default function PaymentsPage() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pixModalId, setPixModalId] = useState(null); // id do payment para o PIX

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const res = await api.get('/payments');
      setPayments(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const handleApprove = async (id) => {
    try {
      await api.patch(`/payments/${id}/approve`);
      fetchPayments();
    } catch (err) {
      alert("Erro ao marcar como pago.");
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      pendente: 'bg-red-100 text-red-800',
      aprovado: 'bg-green-100 text-green-800'
    };
    return <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${styles[status]}`}>{status.toUpperCase()}</span>;
  };

  const columns = [
    { header: 'ID', accessor: 'id' },
    { header: 'OS (Ref)', accessor: 'service_order_id' },
    { header: 'Valor (R$)', render: (row) => Number(row.amount).toFixed(2) },
    { header: 'Status', render: (row) => getStatusBadge(row.status) },
    { 
      header: 'Ações', 
      render: (row) => (
        row.status === 'pendente' ? (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setPixModalId(row.id)} className="text-xs py-1 px-2">Gerar PIX</Button>
            <Button variant="secondary" onClick={() => handleApprove(row.id)} className="text-xs py-1 px-2">Marcar Pago</Button>
          </div>
        ) : <span className="text-gray-400 text-sm">Nenhuma</span>
      )
    }
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Pagamentos</h2>
      </div>

      {loading ? (
        <div>Carregando...</div>
      ) : (
        <Table columns={columns} data={payments} />
      )}

      {/* Modal para gerar PIX */}
      <Modal 
        isOpen={pixModalId !== null} 
        onClose={() => setPixModalId(null)} 
        title="Cobrança PIX"
      >
        {pixModalId && (
          <PaymentForm 
            paymentId={pixModalId}
            onClose={() => setPixModalId(null)}
          />
        )}
      </Modal>
    </div>
  );
}
