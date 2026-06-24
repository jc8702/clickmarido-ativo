'use client';

import React, { useState, useEffect } from 'react';
import { Input } from './Input';
import { Button } from './Button';
import api from '../lib/api';
import { SignaturePad } from './service-orders/SignaturePad';

interface ServiceOrderFormProps {
  so: {
    id: string;
    final_total?: number;
    amount?: number;
  };
  onSuccess?: () => void;
  onCancel?: () => void;
}

interface Product {
  id: string;
  name: string;
  sku: string;
  price: number;
  quantity: number;
  unit: string;
}

interface MaterialUsage {
  id: string;
  product: Product;
  quantityUsed: number;
  createdAt: string;
}

export function ServiceOrderForm({ so, onSuccess, onCancel }: ServiceOrderFormProps) {
  const [step, setStep] = useState<'details' | 'materials' | 'signature'>('details');
  const [formData, setFormData] = useState({
    final_total: so.final_total || so.amount || 0,
    technician_notes: ''
  });
  const [photos, setPhotos] = useState<{ before: File | null; after: File | null }>({
    before: null,
    after: null
  });
  
  // Estados para Materiais
  const [availableMaterials, setAvailableMaterials] = useState<Product[]>([]);
  const [usedMaterials, setUsedMaterials] = useState<MaterialUsage[]>([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [quantityToAdd, setQuantityToAdd] = useState(1);
  const [loadingMaterials, setLoadingMaterials] = useState(false);
  const [addingMaterial, setAddingMaterial] = useState(false);

  const [loading, setLoading] = useState(false);

  // Carregar materiais e usos
  useEffect(() => {
    const loadMaterialsData = async () => {
      setLoadingMaterials(true);
      try {
        const [materialsRes, usagesRes] = await Promise.all([
          api.get('/products?type=PECA&limit=100'),
          api.get(`/service-orders/${so.id}/materials`)
        ]);
        setAvailableMaterials(materialsRes.data.data || []);
        setUsedMaterials(usagesRes.data.data || []);
        if (materialsRes.data.data?.length > 0) {
          setSelectedProductId(materialsRes.data.data[0].id);
        }
      } catch (err) {
        console.error('Erro ao carregar dados de materiais:', err);
      } finally {
        setLoadingMaterials(false);
      }
    };

    if (step === 'materials') {
      loadMaterialsData();
    }
  }, [step, so.id]);

  const toBase64 = (file: File): Promise<string | ArrayBuffer | null> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = error => reject(error);
    });

  const handleUpload = async (file: File, type: string): Promise<string | null> => {
    try {
      const base64 = await toBase64(file);
      const res = await api.post('/upload', { image: base64, type });
      return res.data.url;
    } catch (e) {
      console.error("Upload falhou", e);
      return null;
    }
  };

  const handleAddMaterial = async () => {
    if (!selectedProductId || quantityToAdd <= 0) return;
    setAddingMaterial(true);
    try {
      const res = await api.post(`/service-orders/${so.id}/materials`, {
        productId: selectedProductId,
        quantityUsed: quantityToAdd
      });
      
      // Recarregar os materiais utilizados
      const usagesRes = await api.get(`/service-orders/${so.id}/materials`);
      setUsedMaterials(usagesRes.data.data || []);
      
      // Atualizar o estoque local
      const productAdded = availableMaterials.find(p => p.id === selectedProductId);
      if (productAdded) {
        productAdded.quantity = res.data.data.newQuantity;
        setAvailableMaterials([...availableMaterials]);
      }

      setQuantityToAdd(1);
      alert('Material registrado com sucesso!');
    } catch (err: any) {
      alert(err.response?.data?.error || 'Erro ao registrar material.');
    } finally {
      setAddingMaterial(false);
    }
  };

  const handleCompleteWithSignature = async (signatureData: string, signerName: string) => {
    setLoading(true);
    try {
      let before_photo_url: string | null = null;
      let after_photo_url: string | null = null;

      if (photos.before) before_photo_url = await handleUpload(photos.before, 'before');
      if (photos.after) after_photo_url = await handleUpload(photos.after, 'after');

      // 1. Salvar os detalhes de encerramento da OS
      const completePayload = {
        final_total: Number(formData.final_total),
        technician_notes: formData.technician_notes,
        before_photo_url,
        after_photo_url
      };
      await api.patch(`/service-orders/${so.id}/complete`, completePayload);

      // 2. Salvar a assinatura do cliente
      await api.post(`/service-orders/${so.id}/signature`, {
        signatureData,
        signerName
      });

      alert('Ordem de serviço finalizada com sucesso!');
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error('Erro ao finalizar serviço:', err);
      alert("Erro ao concluir Ordem de Serviço com Assinatura.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Indicador de Abas */}
      <div className="flex border-b border-neutral-200 dark:border-neutral-700">
        <button
          type="button"
          onClick={() => setStep('details')}
          className={`flex-1 py-3 text-sm font-bold border-b-2 transition-all ${
            step === 'details'
              ? 'border-primary-500 text-primary-600 dark:text-primary-400'
              : 'border-transparent text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'
          }`}
        >
          1. Detalhes & Fotos
        </button>
        <button
          type="button"
          onClick={() => setStep('materials')}
          className={`flex-1 py-3 text-sm font-bold border-b-2 transition-all ${
            step === 'materials'
              ? 'border-primary-500 text-primary-600 dark:text-primary-400'
              : 'border-transparent text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'
          }`}
        >
          2. Materiais Utilizados
        </button>
        <button
          type="button"
          onClick={() => setStep('signature')}
          className={`flex-1 py-3 text-sm font-bold border-b-2 transition-all ${
            step === 'signature'
              ? 'border-primary-500 text-primary-600 dark:text-primary-400'
              : 'border-transparent text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'
          }`}
        >
          3. Assinatura do Cliente
        </button>
      </div>

      {/* Aba 1: Detalhes */}
      {step === 'details' && (
        <div className="space-y-5 animate-fade-in">
          <Input
            label="Valor Final do Serviço (R$)"
            type="number"
            step="0.01"
            value={formData.final_total}
            onChange={e => setFormData({ ...formData, final_total: Number(e.target.value) })}
            required
            className="font-semibold text-lg"
          />

          <div>
            <label className="block text-sm font-semibold text-neutral-800 dark:text-neutral-200 mb-1">Notas e Relato do Técnico</label>
            <textarea
              className="w-full px-4 py-2 border-2 border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 focus:border-primary-600 focus:ring-4 focus:ring-primary-100 dark:focus:ring-primary-900/30 focus:outline-none transition-all duration-200 rounded-md placeholder:text-neutral-500 dark:placeholder:text-neutral-400"
              rows={3}
              value={formData.technician_notes}
              onChange={e => setFormData({ ...formData, technician_notes: e.target.value })}
              placeholder="Descreva o que foi feito no local, problemas encontrados e soluções aplicadas..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border border-neutral-200 dark:border-neutral-700 rounded-xl p-4 bg-neutral-50/50 dark:bg-neutral-800/50">
              <label className="block text-sm font-bold text-neutral-700 dark:text-neutral-300 mb-2">Foto Antes do Trabalho</label>
              <input
                type="file"
                accept="image/*"
                onChange={e => {
                  const file = e.target.files?.[0] || null;
                  setPhotos({ ...photos, before: file });
                }}
                className="w-full text-xs text-neutral-500 file:mr-4 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-primary-50 dark:file:bg-primary-900/30 file:text-primary-700 dark:file:text-primary-300 hover:file:bg-primary-100"
              />
            </div>
            <div className="border border-neutral-200 dark:border-neutral-700 rounded-xl p-4 bg-neutral-50/50 dark:bg-neutral-800/50">
              <label className="block text-sm font-bold text-neutral-700 dark:text-neutral-300 mb-2">Foto Depois do Trabalho</label>
              <input
                type="file"
                accept="image/*"
                onChange={e => {
                  const file = e.target.files?.[0] || null;
                  setPhotos({ ...photos, after: file });
                }}
                className="w-full text-xs text-neutral-500 file:mr-4 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-primary-50 dark:file:bg-primary-900/30 file:text-primary-700 dark:file:text-primary-300 hover:file:bg-primary-100"
              />
            </div>
          </div>

          <div className="flex justify-between pt-4 border-t border-neutral-200 dark:border-neutral-700">
            <Button variant="outline" onClick={onCancel} type="button">Cancelar</Button>
            <Button onClick={() => setStep('materials')} type="button">Próximo: Materiais →</Button>
          </div>
        </div>
      )}

      {/* Aba 2: Materiais Utilizados */}
      {step === 'materials' && (
        <div className="space-y-6 animate-fade-in">
          {/* Lançador de peças do estoque */}
          <div className="border border-neutral-200 dark:border-neutral-700 p-4 rounded-xl bg-neutral-50/50 dark:bg-neutral-800/50 space-y-4">
            <h4 className="text-sm font-bold text-neutral-800 dark:text-neutral-200">Lançar Peça / Material Utilizado</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-neutral-500 mb-1">Selecionar Peça em Estoque</label>
                <select
                  value={selectedProductId}
                  onChange={e => setSelectedProductId(e.target.value)}
                  className="w-full px-3 py-2 border-2 border-neutral-300 dark:border-neutral-600 rounded bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 text-sm focus:outline-none focus:border-primary-500"
                >
                  {availableMaterials.map(mat => (
                    <option key={mat.id} value={mat.id}>
                      {mat.name} (Disponível: {mat.quantity} {mat.unit}) - SKU: {mat.sku}
                    </option>
                  ))}
                  {availableMaterials.length === 0 && (
                    <option value="">Nenhuma peça cadastrada no inventário</option>
                  )}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-neutral-500 mb-1">Quantidade Usada</label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    min="1"
                    value={quantityToAdd}
                    onChange={e => setQuantityToAdd(Number(e.target.value))}
                    className="w-full"
                  />
                  <Button onClick={handleAddMaterial} isLoading={addingMaterial} disabled={availableMaterials.length === 0}>
                    Adicionar
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Listagem de peças já lançadas na OS */}
          <div>
            <h4 className="text-sm font-bold text-neutral-800 dark:text-neutral-200 mb-3">Materiais Consumidos nesta OS</h4>
            {loadingMaterials ? (
              <div className="text-center py-4 text-xs text-neutral-500">Buscando consumo de materiais...</div>
            ) : usedMaterials.length > 0 ? (
              <div className="border border-neutral-200 dark:border-neutral-700 rounded-xl overflow-hidden bg-white dark:bg-neutral-800 divide-y divide-neutral-100 dark:divide-neutral-700">
                {usedMaterials.map(item => (
                  <div key={item.id} className="flex justify-between items-center p-3 text-sm">
                    <div>
                      <p className="font-bold text-neutral-950 dark:text-neutral-50">{item.product?.name}</p>
                      <p className="text-xs text-neutral-400 font-mono">SKU: {item.product?.sku}</p>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-neutral-900 dark:text-neutral-100">
                        {item.quantityUsed} {item.product?.unit}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-xs text-neutral-500 border border-dashed border-neutral-200 dark:border-neutral-700 rounded-xl">
                Nenhum material de estoque lançado nesta ordem de serviço ainda.
              </div>
            )}
          </div>

          <div className="flex justify-between pt-4 border-t border-neutral-200 dark:border-neutral-700">
            <Button variant="secondary" onClick={() => setStep('details')} type="button">← Voltar</Button>
            <Button onClick={() => setStep('signature')} type="button">Próximo: Assinatura →</Button>
          </div>
        </div>
      )}

      {/* Aba 3: Assinatura */}
      {step === 'signature' && (
        <div className="space-y-4 animate-fade-in">
          <SignaturePad
            onSave={handleCompleteWithSignature}
            onCancel={() => setStep('materials')}
            isLoading={loading}
          />
        </div>
      )}
    </div>
  );
}

export default ServiceOrderForm;
