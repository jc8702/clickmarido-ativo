'use client';

import React, { useState } from 'react';
import { Input } from './Input';
import { Button } from './Button';
import api from '../lib/api';

interface ServiceOrderFormProps {
  so: {
    id: string;
    final_total?: number;
    amount?: number;
  };
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function ServiceOrderForm({ so, onSuccess, onCancel }: ServiceOrderFormProps) {
  const [formData, setFormData] = useState({
    final_total: so.final_total || so.amount || 0,
    technician_notes: ''
  });
  const [photos, setPhotos] = useState<{ before: File | null; after: File | null }>({
    before: null,
    after: null
  });
  const [loading, setLoading] = useState(false);

  // Converte File para Base64
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
      return res.data.url; // mock: /uploads/photos/...
    } catch (e) {
      console.error("Upload falhou", e);
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let before_photo_url: string | null = null;
      let after_photo_url: string | null = null;

      if (photos.before) before_photo_url = await handleUpload(photos.before, 'before');
      if (photos.after) after_photo_url = await handleUpload(photos.after, 'after');

      const payload = {
        final_total: Number(formData.final_total),
        technician_notes: formData.technician_notes,
        before_photo_url,
        after_photo_url
      };

      await api.patch(`/service-orders/${so.id}/complete`, payload);
      if (onSuccess) onSuccess();
    } catch (err) {
      alert("Erro ao concluir Ordem de Serviço.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 animate-fade-in">
      <Input
        label="Valor Final (R$)"
        type="number"
        step="0.01"
        value={formData.final_total}
        onChange={e => setFormData({ ...formData, final_total: Number(e.target.value) })}
        required
      />

      <div>
        <label className="block text-sm font-medium text-neutral-900 mb-1">Notas do Técnico</label>
        <textarea
          className="w-full px-4 py-2 border-2 border-neutral-300 focus:border-primary-600 focus:ring-4 focus:ring-primary-100 focus:outline-none transition-all duration-200 rounded-md placeholder:text-neutral-500"
          rows={3}
          value={formData.technician_notes}
          onChange={e => setFormData({ ...formData, technician_notes: e.target.value })}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-neutral-900 mb-1">Foto Antes</label>
          <input
            type="file"
            accept="image/*"
            onChange={e => {
              const file = e.target.files?.[0] || null;
              setPhotos({ ...photos, before: file });
            }}
            className="w-full text-sm text-neutral-600 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-900 mb-1">Foto Depois</label>
          <input
            type="file"
            accept="image/*"
            onChange={e => {
              const file = e.target.files?.[0] || null;
              setPhotos({ ...photos, after: file });
            }}
            className="w-full text-sm text-neutral-600 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
          />
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4 border-t border-neutral-200">
        <Button variant="outline" onClick={onCancel} type="button">Cancelar</Button>
        <Button type="submit" isLoading={loading}>Concluir Serviço</Button>
      </div>
    </form>
  );
}

export default ServiceOrderForm;
