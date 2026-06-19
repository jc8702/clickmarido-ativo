'use client';

import { useState, useEffect } from 'react';
import api from '../../../lib/api';
import Table from '../../../components/Table';
import Button from '../../../components/Button';
import Modal from '../../../components/Modal';
import ServiceOrderForm from '../../../components/ServiceOrderForm';

export default function ServiceOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeModal, setActiveModal] = useState(null); // armazena o id da SO que está sendo concluída

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await api.get('/service-orders');
      setOrders(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleStart = async (id) => {
    try {
      await api.patch(`/service-orders/${id}/start`);
      fetchOrders();
    } catch (err) {
      alert("Erro ao iniciar a OS.");
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      agendada: 'bg-blue-100 text-blue-800',
      em_progresso: 'bg-yellow-100 text-yellow-800',
      concluida: 'bg-green-100 text-green-800',
      cancelada: 'bg-red-100 text-red-800'
    };
    return <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${styles[status]}`}>{status.replace('_', ' ').toUpperCase()}</span>;
  };

  const columns = [
    { header: 'ID', accessor: 'id' },
    { header: 'Cliente', accessor: 'customer_name' },
    { header: 'Data Prevista', render: (row) => new Date(row.scheduled_date).toLocaleDateString('pt-BR') },
    { header: 'Status', render: (row) => getStatusBadge(row.status) },
    { 
      header: 'Ações', 
      render: (row) => (
        <div className="flex gap-2">
          {row.status === 'agendada' && (
            <Button variant="gold" onClick={() => handleStart(row.id)} className="text-xs py-1 px-2">Iniciar</Button>
          )}
          {row.status === 'em_progresso' && (
            <Button variant="secondary" onClick={() => setActiveModal(row.id)} className="text-xs py-1 px-2">Concluir</Button>
          )}
        </div>
      )
    }
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Ordens de Serviço</h2>
      </div>

      {loading ? (
        <div>Carregando...</div>
      ) : (
        <Table columns={columns} data={orders} />
      )}

      {/* Modal para concluir OS */}
      <Modal 
        isOpen={activeModal !== null} 
        onClose={() => setActiveModal(null)} 
        title="Concluir Ordem de Serviço"
      >
        {activeModal && (
          <ServiceOrderForm 
            so={orders.find(o => o.id === activeModal)}
            onCancel={() => setActiveModal(null)}
            onSuccess={() => {
              setActiveModal(null);
              fetchOrders();
            }}
          />
        )}
      </Modal>
    </div>
  );
}
