'use client';

import { useState, useEffect } from 'react';
import api from '../../../lib/api';
import { Table, TableHead, TableRow, TableCell, TableHeader } from '../../../components/Table';
import Button from '../../../components/Button';
import Modal from '../../../components/Modal';
import { Badge } from '../../../components/Badge';
import ServiceOrderForm from '../../../components/ServiceOrderForm';

export default function ServiceOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeModal, setActiveModal] = useState(null);

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
    const variantMap = {
      agendada: 'primary',
      em_progresso: 'warning',
      concluida: 'success',
      cancelada: 'danger'
    };
    return <Badge variant={variantMap[status] || 'neutral'}>{status.replace('_', ' ').toUpperCase()}</Badge>;
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
            <Button variant="primary" size="sm" onClick={() => handleStart(row.id)}>Iniciar</Button>
          )}
          {row.status === 'em_progresso' && (
            <Button variant="secondary" size="sm" onClick={() => setActiveModal(row.id)}>Concluir</Button>
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
        <Table>
          <TableHead>
            <tr>
              {columns.map((col) => (
                <TableHeader key={col.header}>{col.header}</TableHeader>
              ))}
            </tr>
          </TableHead>
          <tbody>
            {orders.map((row) => (
              <TableRow key={row.id}>
                {columns.map((col) => (
                  <TableCell key={col.header}>{col.render ? col.render(row) : row[col.accessor]}</TableCell>
                ))}
              </TableRow>
            ))}
          </tbody>
        </Table>
      )}

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
