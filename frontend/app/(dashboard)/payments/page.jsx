'use client';

import { useState, useEffect } from 'react';
import api from '../../../lib/api';
import { Table, TableHead, TableRow, TableCell, TableHeader } from '../../../components/Table';
import Button from '../../../components/Button';
import Modal from '../../../components/Modal';
import { Badge } from '../../../components/Badge';
import PaymentForm from '../../../components/PaymentForm';

export default function PaymentsPage() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pixModalId, setPixModalId] = useState(null);

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
    const variantMap = {
      pendente: 'warning',
      aprovado: 'success'
    };
    return <Badge variant={variantMap[status] || 'neutral'}>{status.toUpperCase()}</Badge>;
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
            <Button variant="outline" size="sm" onClick={() => setPixModalId(row.id)}>Gerar PIX</Button>
            <Button variant="secondary" size="sm" onClick={() => handleApprove(row.id)}>Marcar Pago</Button>
          </div>
        ) : <span className="text-neutral-400 text-sm">—</span>
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
        <Table>
          <TableHead>
            <tr>
              {columns.map((col) => (
                <TableHeader key={col.header}>{col.header}</TableHeader>
              ))}
            </tr>
          </TableHead>
          <tbody>
            {payments.map((row) => (
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
