import { useState } from 'react';
import Input from './Input';
import Button from './Button';
import api from '../lib/api';

export default function ServiceOrderForm({ so, onSuccess, onCancel }) {
  const [formData, setFormData] = useState({
    final_total: so.final_total || 0,
    technician_notes: ''
  });
  const [photos, setPhotos] = useState({ before: null, after: null });
  const [loading, setLoading] = useState(false);

  // Converte File para Base64
  const toBase64 = file => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
  });

  const handleUpload = async (file, type) => {
    try {
      const base64 = await toBase64(file);
      const res = await api.post('/upload', { image: base64, type });
      return res.data.url; // mock: /uploads/photos/...
    } catch (e) {
      console.error("Upload falhou", e);
      return null;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      let before_photo_url = null;
      let after_photo_url = null;

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
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input 
        label="Valor Final (R$)" 
        type="number" 
        step="0.01" 
        value={formData.final_total} 
        onChange={e => setFormData({...formData, final_total: e.target.value})} 
        required 
      />

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Notas do Técnico</label>
        <textarea 
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
          rows="3"
          value={formData.technician_notes}
          onChange={e => setFormData({...formData, technician_notes: e.target.value})}
        ></textarea>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Foto Antes</label>
          <input 
            type="file" 
            accept="image/*" 
            onChange={e => setPhotos({...photos, before: e.target.files[0]})}
            className="w-full text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Foto Depois</label>
          <input 
            type="file" 
            accept="image/*" 
            onChange={e => setPhotos({...photos, after: e.target.files[0]})}
            className="w-full text-sm"
          />
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button variant="outline" onClick={onCancel} type="button">Cancelar</Button>
        <Button type="submit" disabled={loading}>{loading ? 'Enviando...' : 'Concluir Serviço'}</Button>
      </div>
    </form>
  );
}
