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
  const [paymentData, setPaymentData] = useState<any>(null);

  useEffect(() => {
    const fetchPix = async () => {
      try {
        const res = await api.get(`/payments/${paymentId}/generate-pix`);
        setQrCode(res.data.data.qr_code);
        setPaymentData(res.data.data);
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

  const handleWhatsAppShare = () => {
    if (!paymentData) return;
    const phone = paymentData.customer_phone.replace(/\D/g, '');
    const cleanPhone = phone.startsWith('55') ? phone : `55${phone}`;
    const amountFormatted = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(paymentData.amount);
    
    const text = `Olá, ${paymentData.customer_name}! 🛠️\n\nSegue o código PIX para o pagamento do serviço Click Marido no valor de *${amountFormatted}*:\n\n${qrCode}\n\nBasta copiar o código acima e colar no aplicativo do seu banco na opção PIX Copia e Cola. Obrigado!`;
    
    window.open(`https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(text)}`, '_blank');
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
        {paymentData?.customer_phone && (
          <Button onClick={handleWhatsAppShare} variant="primary" className="w-full bg-emerald-600 hover:bg-emerald-700 border-none text-white">
            💬 Cobrar via WhatsApp
          </Button>
        )}
        <Button onClick={onClose} variant="outline" className="w-full">
          Fechar
        </Button>
      </div>
    </div>
  );
}

export default PaymentForm;
