'use client';

import React, { useState, useEffect } from 'react';
import { Button } from './Button';
import api from '../lib/api';

interface PaymentFormProps {
  paymentId: number | string;
  onClose?: () => void;
}

export function PaymentForm({ paymentId, onClose }: PaymentFormProps) {
  const [qrCode, setQrCode] = useState('');
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchPix = async () => {
      try {
        const res = await api.get(`/payments/${paymentId}/generate-pix`);
        setQrCode(res.data.data.qr_code);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchPix();
  }, [paymentId]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(qrCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="p-8 text-center animate-pulse text-neutral-600 font-semibold">
        Gerando PIX...
      </div>
    );
  }

  return (
    <div className="text-center space-y-6 animate-fade-in">
      <p className="text-sm text-neutral-600">
        Escaneie o código abaixo no app do seu banco ou copie a chave (PIX Copia e Cola).
      </p>

      <div className="bg-neutral-50 p-6 rounded-lg inline-block mx-auto border-2 border-neutral-200 shadow-sm">
        {/* Simulação visual do QR Code */}
        <div className="w-48 h-48 bg-white border border-neutral-300 mx-auto flex items-center justify-center p-2 rounded shadow-inner">
          <div className="text-center border-4 border-dashed border-neutral-200 w-full h-full flex items-center justify-center bg-neutral-50">
            <span className="text-xs font-bold text-neutral-400">QR CODE<br />SIMULADO</span>
          </div>
        </div>
      </div>

      <div className="bg-neutral-50 p-4 rounded-md border-2 border-neutral-200 text-xs break-all font-mono text-neutral-700 select-all max-h-24 overflow-y-auto">
        {qrCode || "Erro ao gerar PIX."}
      </div>

      <div className="pt-4 space-y-2">
        <Button onClick={copyToClipboard} variant="secondary" className="w-full">
          {copied ? '✔ Copiado!' : 'Copiar Código PIX'}
        </Button>
        <Button onClick={onClose} variant="outline" className="w-full">
          Fechar
        </Button>
      </div>
    </div>
  );
}

export default PaymentForm;
