export interface FinanceOption {
  value: string;
  label: string;
}

export const EXPENSE_CATEGORIES: FinanceOption[] = [
  { value: 'MATERIAL', label: 'Material' },
  { value: 'SERVICO', label: 'Serviço' },
  { value: 'TRANSPORTE', label: 'Transporte' },
  { value: 'ALUGUEL', label: 'Aluguel' },
  { value: 'UTILITIES', label: 'Contas de Consumo (Luz, Água, etc)' },
  { value: 'FERRAMENTAS', label: 'Ferramentas' },
  { value: 'OUTROS', label: 'Outros' },
];

export const COST_CENTERS: FinanceOption[] = [
  { value: 'OPERACIONAL', label: 'Operacional' },
  { value: 'ADMINISTRATIVO', label: 'Administrativo' },
  { value: 'COMERCIAL', label: 'Comercial' },
  { value: 'FERRAMENTAS', label: 'Ferramentas' },
  { value: 'VEICULOS', label: 'Veículos e Deslocamento' },
  { value: 'TERCEIROS', label: 'Terceiros' },
  { value: 'IMPOSTOS_TAXAS', label: 'Impostos e Taxas' },
  { value: 'OUTROS', label: 'Outros' },
];

export const getCategoryLabel = (value: string): string => {
  return EXPENSE_CATEGORIES.find(c => c.value === value)?.label || value;
};

export const getCostCenterLabel = (value: string): string => {
  return COST_CENTERS.find(cc => cc.value === value)?.label || value || 'Não Definido';
};
