import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { vendorSchema, VendorFormValues } from '../../lib/validations/vendor.schema';
import { useAuth } from '../../hooks/useAuth';

type Props = {
  initialData?: any;
  onSubmit: (data: VendorFormValues) => void;
  isLoading: boolean;
};

export function VendorForm({ initialData, onSubmit, isLoading }: Props) {
  const { register, handleSubmit, setValue, getValues, formState: { errors } } = useForm<any>({
    resolver: zodResolver(vendorSchema),
    defaultValues: initialData || {
      name: '',
      tradeName: '',
      email: '',
      phone: '',
      whatsapp: '',
      cnpjCpf: '',
      stateRegistration: '',
      municipalRegistration: '',
      address: '',
      contactName: '',
      category: 'OUTROS',
      classification: 'B',
      paymentTerms: '',
      averageDeliveryDays: 0,
      isActive: true,
      isBlocked: false,
      notes: ''
    }
  });

  const [isSearchingCNPJ, setIsSearchingCNPJ] = useState(false);
  const { getToken } = useAuth();

  const handleSearchCNPJ = async () => {
    const cnpjCpfValue = getValues('cnpjCpf');
    if (!cnpjCpfValue) {
      alert('Por favor, digite o CNPJ que deseja consultar.');
      return;
    }

    const cleanCnpj = cnpjCpfValue.replace(/\D/g, '');
    if (cleanCnpj.length !== 14) {
      alert('Por favor, insira um CNPJ válido com 14 dígitos (apenas números ou no formato padrão).');
      return;
    }

    setIsSearchingCNPJ(true);
    try {
      const token = getToken();
      const res = await fetch(`/api/vendors/cnpj/${cleanCnpj}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Erro ao buscar dados do CNPJ');
      }

      const data = await res.json();

      if (data.name) setValue('name', data.name);
      if (data.tradeName) setValue('tradeName', data.tradeName);
      if (data.email) setValue('email', data.email);
      if (data.phone) {
        setValue('phone', data.phone);
        setValue('whatsapp', data.phone);
      }
      if (data.address) setValue('address', data.address);

      alert('Dados do CNPJ preenchidos automaticamente com sucesso!');
    } catch (error: any) {
      console.error('Error fetching CNPJ:', error);
      alert(error.message || 'Ocorreu um erro ao consultar o CNPJ. Verifique a conexão ou se o CNPJ está correto.');
    } finally {
      setIsSearchingCNPJ(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 bg-white dark:bg-neutral-800 p-6 rounded shadow border border-neutral-200 dark:border-neutral-700">
      <div className="border-b border-neutral-200 dark:border-neutral-700 pb-4">
        <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Informações Básicas</h3>
        <p className="text-xs text-neutral-500 dark:text-neutral-400">Insira a identificação do fornecedor e dados fiscais.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">Razão Social / Nome Comercial *</label>
          <input 
            {...register('name')} 
            className="mt-1 block w-full p-2 border border-neutral-300 dark:border-neutral-600 rounded bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100" 
            placeholder="Nome ou Razão Social" 
          />
          {errors.name && <p className="text-red-500 dark:text-red-400 text-xs mt-1">{errors.name.message?.toString()}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">Nome Fantasia</label>
          <input 
            {...register('tradeName')} 
            className="mt-1 block w-full p-2 border border-neutral-300 dark:border-neutral-600 rounded bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100" 
            placeholder="Nome de fantasia do estabelecimento" 
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">CNPJ / CPF</label>
          <div className="flex gap-2 mt-1">
            <input 
              {...register('cnpjCpf')} 
              className="flex-1 p-2 border border-neutral-300 dark:border-neutral-600 rounded bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100" 
              placeholder="Apenas números ou formato padrão" 
            />
            <button
              type="button"
              onClick={handleSearchCNPJ}
              disabled={isSearchingCNPJ}
              className="px-4 py-2 bg-neutral-100 dark:bg-neutral-700 hover:bg-neutral-200 dark:hover:bg-neutral-600 text-neutral-700 dark:text-neutral-200 rounded font-medium disabled:opacity-50 text-sm transition-colors border border-neutral-300 dark:border-neutral-600 flex items-center justify-center min-w-[140px] shadow-sm"
            >
              {isSearchingCNPJ ? (
                <span className="flex items-center space-x-1">
                  <svg className="animate-spin h-4 w-4 text-neutral-500" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                  </svg>
                  <span>Buscando...</span>
                </span>
              ) : 'Busca por CNPJ'}
            </button>
          </div>
          {errors.cnpjCpf && <p className="text-red-500 dark:text-red-400 text-xs mt-1">{errors.cnpjCpf.message?.toString()}</p>}
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">Inscr. Estadual</label>
            <input 
              {...register('stateRegistration')} 
              className="mt-1 block w-full p-2 border border-neutral-300 dark:border-neutral-600 rounded bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">Inscr. Municipal</label>
            <input 
              {...register('municipalRegistration')} 
              className="mt-1 block w-full p-2 border border-neutral-300 dark:border-neutral-600 rounded bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100" 
            />
          </div>
        </div>
      </div>

      <div className="border-b border-neutral-200 dark:border-neutral-700 pb-4 pt-2">
        <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Contato & Localização</h3>
        <p className="text-xs text-neutral-500 dark:text-neutral-400">Canais de contato e endereço para faturamento/entregas.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">Pessoa de Contato</label>
          <input 
            {...register('contactName')} 
            className="mt-1 block w-full p-2 border border-neutral-300 dark:border-neutral-600 rounded bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100" 
            placeholder="Nome do representante comercial" 
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">Telefone</label>
          <input 
            {...register('phone')} 
            className="mt-1 block w-full p-2 border border-neutral-300 dark:border-neutral-600 rounded bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100" 
            placeholder="(XX) XXXX-XXXX" 
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">WhatsApp</label>
          <input 
            {...register('whatsapp')} 
            className="mt-1 block w-full p-2 border border-neutral-300 dark:border-neutral-600 rounded bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100" 
            placeholder="(XX) XXXXX-XXXX" 
          />
        </div>

        <div className="md:col-span-3">
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">E-mail Comercial</label>
          <input 
            {...register('email')} 
            className="mt-1 block w-full p-2 border border-neutral-300 dark:border-neutral-600 rounded bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100" 
            placeholder="fornecedor@email.com" 
          />
          {errors.email && <p className="text-red-500 dark:text-red-400 text-xs mt-1">{errors.email.message?.toString()}</p>}
        </div>

        <div className="md:col-span-3">
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">Endereço Completo</label>
          <input 
            {...register('address')} 
            className="mt-1 block w-full p-2 border border-neutral-300 dark:border-neutral-600 rounded bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100" 
            placeholder="Rua, Número, Bairro - Cidade / Estado, CEP" 
          />
        </div>
      </div>

      <div className="border-b border-neutral-200 dark:border-neutral-700 pb-4 pt-2">
        <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Configurações & Termos</h3>
        <p className="text-xs text-neutral-500 dark:text-neutral-400">Classificação operacional, termos de pagamento e status.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">Categoria Principal</label>
          <select 
            {...register('category')} 
            className="mt-1 block w-full p-2 border border-neutral-300 dark:border-neutral-600 rounded bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 text-sm"
          >
            <option value="MATERIAL">Material / Peça</option>
            <option value="SERVICO">Serviço Terceirizado</option>
            <option value="TRANSPORTE">Transporte / Frete</option>
            <option value="EQUIPAMENTO">Locação de Equipamento</option>
            <option value="FERRAMENTAS">Ferramentas</option>
            <option value="TERCEIRIZADO">Terceirização de Mão de Obra</option>
            <option value="OUTROS">Outros</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">Classificação</label>
          <select 
            {...register('classification')} 
            className="mt-1 block w-full p-2 border border-neutral-300 dark:border-neutral-600 rounded bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 text-sm"
          >
            <option value="A">Classe A (Preferencial)</option>
            <option value="B">Classe B (Aprovado)</option>
            <option value="C">Classe C (Atenção)</option>
            <option value="D">Classe D (Bloqueável)</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">Prazo Médio de Entrega (Dias)</label>
          <input 
            type="number"
            {...register('averageDeliveryDays')} 
            className="mt-1 block w-full p-2 border border-neutral-300 dark:border-neutral-600 rounded bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100" 
            placeholder="Ex: 5" 
          />
          {errors.averageDeliveryDays && <p className="text-red-500 dark:text-red-400 text-xs mt-1">{errors.averageDeliveryDays.message?.toString()}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">Condições Padrão de Pgto.</label>
          <input 
            {...register('paymentTerms')} 
            className="mt-1 block w-full p-2 border border-neutral-300 dark:border-neutral-600 rounded bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100" 
            placeholder="Ex: Boleto 30 dias, PIX à vista" 
          />
        </div>
      </div>

      <div className="flex flex-row space-x-6 bg-neutral-50 dark:bg-neutral-700/30 p-4 rounded border border-neutral-200 dark:border-neutral-700/60">
        <label className="flex items-center space-x-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 cursor-pointer">
          <input 
            type="checkbox" 
            {...register('isActive')} 
            className="rounded border-neutral-300 dark:border-neutral-600 text-primary-600 focus:ring-primary-500 h-4 w-4 bg-white dark:bg-neutral-700" 
          />
          <span>Fornecedor Ativo (aparece nas listagens de novas compras)</span>
        </label>

        <label className="flex items-center space-x-2 text-sm font-medium text-red-700 dark:text-red-400 cursor-pointer">
          <input 
            type="checkbox" 
            {...register('isBlocked')} 
            className="rounded border-red-300 dark:border-red-600 text-red-600 focus:ring-red-500 h-4 w-4 bg-white dark:bg-neutral-700" 
          />
          <span className="font-semibold text-red-600 dark:text-red-400">Bloquear Fornecedor (impede novos pedidos de compra)</span>
        </label>
      </div>

      <div className="md:col-span-2">
        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">Observações Internas</label>
        <textarea 
          {...register('notes')} 
          className="mt-1 block w-full p-2 border border-neutral-300 dark:border-neutral-600 rounded bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100" 
          rows={3}
          placeholder="Anotações gerais e informações operacionais sobre negociações."
        ></textarea>
      </div>

      <div className="flex justify-end pt-4 border-t border-neutral-200 dark:border-neutral-700">
        <button 
          type="submit" 
          disabled={isLoading}
          className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded font-medium disabled:opacity-50 transition-colors shadow"
        >
          {isLoading ? 'Salvando...' : 'Salvar Fornecedor'}
        </button>
      </div>
    </form>
  );
}
