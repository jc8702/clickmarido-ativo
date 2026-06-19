import { useState } from 'react';
import Input from './Input';
import Button from './Button';
import api from '../lib/api';

export default function CustomerForm({ onSuccess, onCancel }) {
  const [formData, setFormData] = useState({ name: '', email: '', phone: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await api.post('/customers', formData);
      setFormData({ name: '', email: '', phone: '' });
      if (onSuccess) onSuccess();
    } catch (err) {
      setError('Erro ao criar cliente. Verifique os dados.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Novo Cliente</h3>
      
      {error && <div className="mb-4 text-red-600 text-sm">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Input 
          label="Nome" 
          value={formData.name} 
          onChange={e => setFormData({...formData, name: e.target.value})} 
          required 
        />
        <Input 
          label="E-mail" 
          type="email" 
          value={formData.email} 
          onChange={e => setFormData({...formData, email: e.target.value})} 
          required 
        />
        <Input 
          label="Telefone" 
          placeholder="(11) 99999-9999" 
          value={formData.phone} 
          onChange={e => setFormData({...formData, phone: e.target.value})} 
        />
      </div>

      <div className="flex justify-end gap-2 mt-2">
        {onCancel && (
          <Button variant="outline" onClick={onCancel} type="button">Cancelar</Button>
        )}
        <Button type="submit" disabled={loading}>
          {loading ? 'Salvando...' : 'Salvar Cliente'}
        </Button>
      </div>
    </form>
  );
}
