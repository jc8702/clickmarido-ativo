'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';

interface SettingsData {
  companyName: string;
  cnpj: string;
  phone: string;
  email: string;
  address: string;
  defaultHourlyRate: number;
  defaultWarranty: string;
  defaultCommissionRate: number;
  logoUrl?: string | null;
}

export default function SettingsPage() {
  const { getToken } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState<SettingsData>({
    companyName: 'Click Marido',
    cnpj: '',
    phone: '',
    email: '',
    address: '',
    defaultHourlyRate: 80.0,
    defaultWarranty: '90 dias nos termos do art. 26, II do CDC.',
    defaultCommissionRate: 40.0,
    logoUrl: null,
  });
  const [uploadingLogo, setUploadingLogo] = useState(false);

  const fetchSettings = useCallback(async () => {
    try {
      const token = getToken();
      const response = await fetch('/api/settings', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          setData(result.data);
        }
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setData(prev => ({
      ...prev,
      [name]: name === 'defaultHourlyRate' || name === 'defaultCommissionRate' ? parseFloat(value) || 0 : value
    }));
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingLogo(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const token = getToken();
      const response = await fetch('/api/upload/settings', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        if (result.url) {
          setData(prev => ({ ...prev, logoUrl: result.url }));
          alert('Logo enviada com sucesso! Lembre-se de salvar as alterações da página.');
        }
      } else {
        const err = await response.json().catch(() => ({}));
        alert('Erro ao enviar logo: ' + (err.error || 'Erro desconhecido'));
      }
    } catch (err: any) {
      alert('Erro ao enviar logo: ' + err.message);
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const token = getToken();
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        alert('Configurações salvas com sucesso!');
        fetchSettings();
      } else {
        const err = await response.json().catch(() => ({}));
        alert('Erro ao salvar: ' + (err.error || 'Erro desconhecido'));
      }
    } catch (err: any) {
      alert('Erro ao salvar: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 min-h-screen">
        <div className="max-w-3xl mx-auto space-y-6">
          <h1 className="text-3xl font-bold">Configurações Gerais</h1>
          <div className="bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 h-96 animate-pulse"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 min-h-screen">
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary-500 to-secondary-500 bg-clip-text text-transparent">Configurações Gerais</h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">Gerencie os dados cadastrais da empresa, comissões de técnicos e termos de garantias dos documentos.</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 shadow-xl space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">Logo da Empresa</label>
              <div className="flex items-center space-x-4">
                {data.logoUrl ? (
                  <img src={data.logoUrl} alt="Logo da Empresa" className="h-16 w-auto object-contain rounded-lg border border-neutral-200 dark:border-neutral-700 p-1 bg-white dark:bg-neutral-800" />
                ) : (
                  <div className="h-16 w-16 bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg flex items-center justify-center text-neutral-400 text-xs">Sem Logo</div>
                )}
                <div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    disabled={uploadingLogo}
                    className="block w-full text-sm text-neutral-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 dark:file:bg-primary-900/20 dark:file:text-primary-400"
                  />
                  {uploadingLogo && <p className="text-xs text-primary-500 mt-2">Enviando logo...</p>}
                  <p className="text-xs text-neutral-500 mt-1">Recomendado: fundo transparente (PNG/SVG) e formato horizontal.</p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">Nome da Empresa</label>
              <input
                type="text"
                name="companyName"
                value={data.companyName}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-neutral-100/50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">CNPJ / CPF</label>
              <input
                type="text"
                name="cnpj"
                value={data.cnpj}
                onChange={handleChange}
                placeholder="00.000.000/0001-00"
                className="w-full px-4 py-2 bg-neutral-100/50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">Telefone Comercial</label>
              <input
                type="text"
                name="phone"
                value={data.phone}
                onChange={handleChange}
                placeholder="(47) 99999-9999"
                className="w-full px-4 py-2 bg-neutral-100/50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">E-mail Comercial</label>
              <input
                type="email"
                name="email"
                value={data.email}
                onChange={handleChange}
                placeholder="contato@empresa.com"
                className="w-full px-4 py-2 bg-neutral-100/50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">Endereço Comercial</label>
              <input
                type="text"
                name="address"
                value={data.address}
                onChange={handleChange}
                placeholder="Rua, Número - Bairro, Cidade - UF"
                className="w-full px-4 py-2 bg-neutral-100/50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">Valor da Hora Técnica Padrão (R$)</label>
              <input
                type="number"
                name="defaultHourlyRate"
                value={data.defaultHourlyRate}
                onChange={handleChange}
                step="0.01"
                className="w-full px-4 py-2 bg-neutral-100/50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">Taxa de Comissão Padrão (%)</label>
              <input
                type="number"
                name="defaultCommissionRate"
                value={data.defaultCommissionRate}
                onChange={handleChange}
                step="0.1"
                className="w-full px-4 py-2 bg-neutral-100/50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">Termo de Garantia Padrão</label>
              <textarea
                name="defaultWarranty"
                value={data.defaultWarranty}
                onChange={handleChange}
                rows={3}
                className="w-full px-4 py-2 bg-neutral-100/50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                required
              />
            </div>
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-neutral-200 dark:border-neutral-800">
            <div className="text-xs text-neutral-400">Última alteração salva localmente no banco Neon.</div>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-gradient-to-r from-primary-600 to-secondary-600 hover:from-primary-700 hover:to-secondary-700 text-white font-semibold rounded-xl transition-all duration-200 shadow-md disabled:opacity-50"
            >
              {saving ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </div>
        </form>

        <div className="bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 shadow-xl space-y-4">
          <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">Backup e Banco de Dados</h2>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">O Click Marido CRM utiliza o Neon PostgreSQL com replicação serverless na nuvem. Os backups são automáticos. Use as ferramentas de console do Neon para backups pontuais adicionais.</p>
          <div className="flex space-x-4 pt-2">
            <a
              href="https://console.neon.tech"
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-xs font-semibold rounded-xl transition-all"
            >
              Acessar Painel Neon Tech
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
