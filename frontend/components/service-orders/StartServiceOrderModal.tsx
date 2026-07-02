'use client';

import React, { useState, useEffect } from 'react';
import { Modal } from '../Modal';
import { Button } from '../Button';
import api from '../../lib/api';

interface StartServiceOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  osId: string | null;
  onSuccess: () => void;
}

interface Technician {
  id: string;
  name: string;
}

export function StartServiceOrderModal({ isOpen, onClose, osId, onSuccess }: StartServiceOrderModalProps) {
  const [loading, setLoading] = useState(false);
  const [starting, setStarting] = useState(false);
  const [osDetails, setOsDetails] = useState<any>(null);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [selectedTechnician, setSelectedTechnician] = useState<string>('');

  useEffect(() => {
    if (isOpen && osId) {
      const fetchData = async () => {
        setLoading(true);
        try {
          const [osRes, techsRes] = await Promise.all([
            api.get(`/service-orders/${osId}`),
            api.get('/technicians?limit=100')
          ]);
          setOsDetails(osRes.data);
          setTechnicians(techsRes.data.data || []);
          setSelectedTechnician(osRes.data.technicianId || '');
        } catch (err) {
          console.error('Erro ao buscar dados da OS:', err);
        } finally {
          setLoading(false);
        }
      };
      fetchData();
    } else {
      setOsDetails(null);
      setSelectedTechnician('');
    }
  }, [isOpen, osId]);

  const handleStart = async () => {
    if (!osId) return;
    setStarting(true);
    try {
      await api.patch(`/service-orders/${osId}/start`, {
        technicianId: selectedTechnician || null
      });
      onSuccess();
    } catch (err) {
      console.error(err);
      alert('Erro ao iniciar a OS.');
    } finally {
      setStarting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Iniciar Ordem de Serviço">
      {loading ? (
        <div className="py-10 text-center text-sm text-neutral-500">Carregando detalhes...</div>
      ) : osDetails ? (
        <div className="space-y-6">
          <div className="bg-neutral-50 dark:bg-neutral-800 p-4 rounded-xl border border-neutral-200 dark:border-neutral-700">
            <h3 className="font-bold text-neutral-900 dark:text-neutral-100 text-lg mb-2">
              {osDetails.number || 'Sem número'}
            </h3>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-1">
              <strong>Cliente:</strong> {osDetails.customer?.name}
            </p>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-1">
              <strong>Endereço:</strong> {osDetails.address || 'Não informado'}
            </p>
            {osDetails.scheduledTime && (
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                <strong>Agendamento:</strong> {new Date(osDetails.scheduledTime).toLocaleString('pt-BR')}
              </p>
            )}
          </div>

          <div>
            <h4 className="text-sm font-bold text-neutral-800 dark:text-neutral-200 mb-2">Serviços / Peças a Executar:</h4>
            {osDetails.quotation?.items?.length > 0 ? (
              <ul className="space-y-2">
                {osDetails.quotation.items.map((item: any) => (
                  <li key={item.id} className="text-sm bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 p-2 rounded flex justify-between">
                    <span>{Number(item.quantity)}x {item.product?.name}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-neutral-500">Nenhum item vinculado a este orçamento.</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-bold text-neutral-800 dark:text-neutral-200 mb-1">
              Técnico Responsável
            </label>
            <select
              value={selectedTechnician}
              onChange={(e) => setSelectedTechnician(e.target.value)}
              className="w-full px-3 py-2 border-2 border-neutral-300 dark:border-neutral-600 rounded bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 text-sm focus:outline-none focus:border-primary-500"
            >
              <option value="">Selecione um técnico</option>
              {technicians.map((tech) => (
                <option key={tech.id} value={tech.id}>
                  {tech.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-neutral-200 dark:border-neutral-700">
            <Button variant="outline" onClick={onClose} disabled={starting}>Cancelar</Button>
            <Button variant="primary" onClick={handleStart} isLoading={starting}>Confirmar Início</Button>
          </div>
        </div>
      ) : (
        <div className="py-10 text-center text-sm text-neutral-500">Erro ao carregar detalhes.</div>
      )}
    </Modal>
  );
}
