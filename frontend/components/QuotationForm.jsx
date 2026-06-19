import { useState, useEffect } from 'react';
import Input from './Input';
import Button from './Button';
import api from '../lib/api';

export default function QuotationForm({ onSuccess, onCancel }) {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    customer_id: '',
    description: '',
    valid_until: '',
    items: [{ name: '', quantity: 1, price: 0 }]
  });

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const res = await api.get('/customers');
        setCustomers(res.data.data);
      } catch (err) {
        console.error("Erro ao buscar clientes", err);
      }
    };
    fetchCustomers();
  }, []);

  const handleItemChange = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index][field] = value;
    setFormData({ ...formData, items: newItems });
  };

  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { name: '', quantity: 1, price: 0 }]
    });
  };

  const removeItem = (index) => {
    const newItems = formData.items.filter((_, i) => i !== index);
    setFormData({ ...formData, items: newItems });
  };

  const calculateTotal = () => {
    return formData.items.reduce((acc, item) => acc + (item.quantity * item.price), 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        ...formData,
        total_amount: calculateTotal()
      };
      await api.post('/quotations', payload);
      if (onSuccess) onSuccess();
    } catch (err) {
      alert("Erro ao criar orçamento");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Cliente *</label>
          <select 
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            value={formData.customer_id}
            onChange={e => setFormData({...formData, customer_id: e.target.value})}
            required
          >
            <option value="">Selecione um cliente...</option>
            {customers.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <Input 
          label="Validade" 
          type="date" 
          value={formData.valid_until}
          onChange={e => setFormData({...formData, valid_until: e.target.value})}
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
        <textarea 
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
          rows="3"
          value={formData.description}
          onChange={e => setFormData({...formData, description: e.target.value})}
        ></textarea>
      </div>

      <div className="border-t pt-4">
        <h4 className="font-medium text-gray-800 mb-2">Itens</h4>
        {formData.items.map((item, index) => (
          <div key={index} className="flex gap-2 items-end mb-2">
            <div className="flex-1">
              <Input label="Item" value={item.name} onChange={e => handleItemChange(index, 'name', e.target.value)} required />
            </div>
            <div className="w-24">
              <Input label="Qtd" type="number" min="1" value={item.quantity} onChange={e => handleItemChange(index, 'quantity', Number(e.target.value))} required />
            </div>
            <div className="w-32">
              <Input label="Preço (R$)" type="number" step="0.01" value={item.price} onChange={e => handleItemChange(index, 'price', Number(e.target.value))} required />
            </div>
            <div className="mb-4">
              <Button variant="danger" onClick={() => removeItem(index)} disabled={formData.items.length === 1}>X</Button>
            </div>
          </div>
        ))}
        <Button variant="outline" onClick={addItem} type="button" className="text-sm">+ Adicionar Item</Button>
      </div>

      <div className="flex justify-between items-center border-t pt-4">
        <div className="text-lg font-bold">
          Total: R$ {calculateTotal().toFixed(2)}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onCancel} type="button">Cancelar</Button>
          <Button type="submit" disabled={loading}>{loading ? 'Salvando...' : 'Salvar Orçamento'}</Button>
        </div>
      </div>
    </form>
  );
}
