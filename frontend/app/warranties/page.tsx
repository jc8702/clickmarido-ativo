'use client';

import React, { useState, useEffect } from 'react';

interface Warranty {
  id: string;
  service_order_id: string;
  type: string;
  start_date: string;
  end_date: string;
  status: 'ativa' | 'expirada' | 'usada';
  claim_reason?: string;
}

export default function WarrantiesPage() {
  const [warranties, setWarranties] = useState<Warranty[]>([]);
  const [claimText, setClaimText] = useState('');
  const [activeClaimId, setActiveClaimId] = useState<string | null>(null);

  useEffect(() => {
    // Carrega garantias simuladas
    setWarranties([
      {
        id: 'warr_1',
        service_order_id: 'OS-1002',
        type: '12 Meses de Cobertura',
        start_date: '2026-06-19',
        end_date: '2027-06-19',
        status: 'ativa',
      },
      {
        id: 'warr_2',
        service_order_id: 'OS-1001',
        type: '6 Meses de Cobertura',
        start_date: '2025-12-19',
        end_date: '2026-06-19',
        status: 'expirada',
      }
    ]);
  }, []);

  const handleClaim = (id: string) => {
    if (!claimText) return alert('Descreva o problema para acionar a garantia.');

    setWarranties(prev => prev.map(w => {
      if (w.id === id) {
        return { ...w, status: 'usada', claim_reason: claimText };
      }
      return w;
    }));

    setClaimText('');
    setActiveClaimId(null);
    alert('Garantia acionada com sucesso! Um técnico entrará em contato.');
  };

  return (
    <div style={{ maxWidth: '800px', margin: '40px auto', fontFamily: 'sans-serif', padding: '20px' }}>
      <h1 style={{ color: '#111827', fontSize: '24px', fontWeight: 'bold', marginBottom: '24px' }}>Minhas Garantias</h1>
      <p style={{ color: '#4B5563', marginBottom: '32px' }}>Abaixo estão listadas todas as garantias associadas aos serviços realizados em sua residência.</p>

      <div style={{ display: 'grid', gap: '20px' }}>
        {warranties.map(warranty => (
          <div 
            key={warranty.id} 
            style={{ 
              border: '1px solid #E5E7EB', 
              borderRadius: '12px', 
              padding: '24px', 
              backgroundColor: '#FFFFFF',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#1F2937', margin: 0 }}>
                  Serviço {warranty.service_order_id}
                </h3>
                <span style={{ fontSize: '14px', color: '#6B7280' }}>{warranty.type}</span>
              </div>
              <span 
                style={{ 
                  padding: '6px 12px', 
                  borderRadius: '9999px', 
                  fontSize: '12px', 
                  fontWeight: 600,
                  backgroundColor: warranty.status === 'ativa' ? '#D1FAE5' : warranty.status === 'expirada' ? '#FEE2E2' : '#FEF3C7',
                  color: warranty.status === 'ativa' ? '#065F46' : warranty.status === 'expirada' ? '#991B1B' : '#92400E'
                }}
              >
                {warranty.status.toUpperCase()}
              </span>
            </div>

            <div style={{ fontSize: '14px', color: '#4B5563', marginBottom: '20px' }}>
              <div><strong>Vigência:</strong> {warranty.start_date} até {warranty.end_date}</div>
              {warranty.claim_reason && (
                <div style={{ marginTop: '12px', padding: '12px', backgroundColor: '#F9FAFB', borderRadius: '6px', borderLeft: '4px solid #F59E0B' }}>
                  <strong>Acionamento:</strong> {warranty.claim_reason}
                </div>
              )}
            </div>

            {warranty.status === 'ativa' && (
              <div>
                {activeClaimId === warranty.id ? (
                  <div>
                    <textarea 
                      placeholder="Descreva detalhadamente o problema com o serviço anterior..."
                      value={claimText}
                      onChange={e => setClaimText(e.target.value)}
                      style={{ 
                        width: '100%', 
                        padding: '12px', 
                        borderRadius: '6px', 
                        border: '1px solid #D1D5DB', 
                        fontSize: '14px',
                        marginBottom: '12px',
                        minHeight: '80px',
                        boxSizing: 'border-box'
                      }}
                    />
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button 
                        onClick={() => handleClaim(warranty.id)}
                        style={{ 
                          backgroundColor: '#2563EB', 
                          color: '#FFFFFF', 
                          border: 'none', 
                          padding: '8px 16px', 
                          borderRadius: '6px', 
                          fontWeight: 600, 
                          cursor: 'pointer' 
                        }}
                      >
                        Enviar Solicitação
                      </button>
                      <button 
                        onClick={() => setActiveClaimId(null)}
                        style={{ 
                          backgroundColor: '#E5E7EB', 
                          color: '#374151', 
                          border: 'none', 
                          padding: '8px 16px', 
                          borderRadius: '6px', 
                          cursor: 'pointer' 
                        }}
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <button 
                    onClick={() => setActiveClaimId(warranty.id)}
                    style={{ 
                      backgroundColor: '#EF4444', 
                      color: '#FFFFFF', 
                      border: 'none', 
                      padding: '8px 16px', 
                      borderRadius: '6px', 
                      fontWeight: 600, 
                      cursor: 'pointer' 
                    }}
                  >
                    Acionar Garantia
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
