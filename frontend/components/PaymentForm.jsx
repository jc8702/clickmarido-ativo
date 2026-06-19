import { useState, useEffect } from 'react';
import Button from './Button';
import api from '../lib/api';

export default function PaymentForm({ paymentId, onClose }) {
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

  if (loading) return <div className="p-4 text-center">Gerando PIX...</div>;

  return (
    <div className="text-center space-y-4">
      <p className="text-sm text-gray-600">Escaneie o código abaixo no app do seu banco ou copie a chave (PIX Copia e Cola).</p>
      
      <div className="bg-gray-100 p-6 rounded-lg inline-block mx-auto border border-gray-300">
        {/* Simulação visual do QR Code */}
        <div className="w-48 h-48 bg-white border border-gray-300 mx-auto flex items-center justify-center p-2">
          <div className="text-center border-4 border-dashed border-gray-300 w-full h-full flex items-center justify-center">
             <span className="text-xs text-gray-400">QR CODE<br/>SIMULADO</span>
          </div>
        </div>
      </div>

      <div className="bg-gray-50 p-3 rounded border text-sm break-all font-mono text-gray-800">
        {qrCode || "Erro ao gerar PIX."}
      </div>

      <div className="pt-4">
        <Button onClick={copyToClipboard} variant="secondary" className="w-full mb-2">
          {copied ? '✔ Copiado!' : 'Copiar Código PIX'}
        </Button>
        <Button onClick={onClose} variant="outline" className="w-full">
          Fechar
        </Button>
      </div>
    </div>
  );
}
