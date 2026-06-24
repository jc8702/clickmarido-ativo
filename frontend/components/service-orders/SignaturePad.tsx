import React, { useRef, useState, useEffect } from 'react';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';

interface SignaturePadProps {
  onSave: (signatureData: string, signerName: string) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function SignaturePad({ onSave, onCancel, isLoading }: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [signerName, setSignerName] = useState('');
  const [hasSigned, setHasSigned] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Configurar o estilo da linha de desenho
    ctx.strokeStyle = '#6347F9'; // Roxo da marca
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Ajustar o canvas para a resolução física real
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    // Repintar caso mude de tamanho
    ctx.strokeStyle = '#6347F9';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, []);

  const getCoordinates = (e: React.MouseEvent | React.TouchEvent | MouseEvent | TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();

    if ('touches' in e) {
      if (e.touches.length === 0) return { x: 0, y: 0 };
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      };
    } else {
      return {
        x: (e as React.MouseEvent).clientX - rect.left,
        y: (e as React.MouseEvent).clientY - rect.top,
      };
    }
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const coords = getCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(coords.x, coords.y);
    setIsDrawing(true);
    setHasSigned(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    e.preventDefault();

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const coords = getCoordinates(e);
    ctx.lineTo(coords.x, coords.y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSigned(false);
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (!signerName.trim()) {
      alert('Por favor, informe o nome de quem está assinando.');
      return;
    }

    if (!hasSigned) {
      alert('Por favor, realize a assinatura no painel.');
      return;
    }

    const dataUrl = canvas.toDataURL('image/png');
    onSave(dataUrl, signerName);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <label className="text-xs font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">
          Nome do Responsável / Cliente
        </label>
        <Input
          placeholder="Digite o nome completo do assinante..."
          value={signerName}
          onChange={(e) => setSignerName(e.target.value)}
          className="w-full"
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider flex justify-between">
          <span>Assinatura Digital</span>
          {hasSigned && (
            <button onClick={clearCanvas} className="text-primary-500 hover:text-primary-600 transition-colors text-xs font-semibold">
              Limpar Painel
            </button>
          )}
        </label>
        <div className="border-2 border-dashed border-neutral-200 dark:border-neutral-700 rounded-xl overflow-hidden bg-neutral-50 dark:bg-neutral-900/50">
          <canvas
            ref={canvasRef}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
            className="w-full h-48 cursor-crosshair touch-none"
          />
        </div>
      </div>

      <div className="flex gap-2 justify-end pt-2">
        <Button variant="secondary" onClick={onCancel} disabled={isLoading}>
          Cancelar
        </Button>
        <Button onClick={handleSave} isLoading={isLoading}>
          Confirmar Conclusão
        </Button>
      </div>
    </div>
  );
}
