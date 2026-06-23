import { EXPENSE_CATEGORIES, COST_CENTERS, getCategoryLabel, getCostCenterLabel } from '../../lib/finance-options';

describe('finance-options', () => {
  describe('EXPENSE_CATEGORIES', () => {
    it('deve conter a categoria FERRAMENTAS', () => {
      const ferramentas = EXPENSE_CATEGORIES.find(c => c.value === 'FERRAMENTAS');
      expect(ferramentas).toBeDefined();
      expect(ferramentas?.label).toBe('Ferramentas');
    });

    it('deve conter todas as categorias essenciais', () => {
      const expectedCategories = ['MATERIAL', 'SERVICO', 'TRANSPORTE', 'ALUGUEL', 'UTILITIES', 'FERRAMENTAS', 'OUTROS'];
      expectedCategories.forEach(cat => {
        const found = EXPENSE_CATEGORIES.find(c => c.value === cat);
        expect(found).toBeDefined();
      });
    });

    it('deve ter labels em português para todas as categorias', () => {
      EXPENSE_CATEGORIES.forEach(cat => {
        expect(cat.label).toBeTruthy();
        expect(cat.label.length).toBeGreaterThan(0);
      });
    });
  });

  describe('COST_CENTERS', () => {
    it('deve conter todos os centros de custo', () => {
      const expectedCenters = ['OPERACIONAL', 'ADMINISTRATIVO', 'COMERCIAL', 'FERRAMENTAS', 'VEICULOS', 'TERCEIROS', 'IMPOSTOS_TAXAS', 'OUTROS'];
      expectedCenters.forEach(cc => {
        const found = COST_CENTERS.find(c => c.value === cc);
        expect(found).toBeDefined();
      });
    });

    it('deve ter labels em português para todos os centros de custo', () => {
      COST_CENTERS.forEach(cc => {
        expect(cc.label).toBeTruthy();
        expect(cc.label.length).toBeGreaterThan(0);
      });
    });
  });

  describe('getCategoryLabel', () => {
    it('deve retornar o label correto para MATERIAL', () => {
      expect(getCategoryLabel('MATERIAL')).toBe('Material');
    });

    it('deve retornar o label correto para FERRAMENTAS', () => {
      expect(getCategoryLabel('FERRAMENTAS')).toBe('Ferramentas');
    });

    it('deve retornar o value como fallback para categoria desconhecida', () => {
      expect(getCategoryLabel('CATEGORIA_INVALIDA')).toBe('CATEGORIA_INVALIDA');
    });
  });

  describe('getCostCenterLabel', () => {
    it('deve retornar o label correto para OPERACIONAL', () => {
      expect(getCostCenterLabel('OPERACIONAL')).toBe('Operacional');
    });

    it('deve retornar o label correto para FERRAMENTAS', () => {
      expect(getCostCenterLabel('FERRAMENTAS')).toBe('Ferramentas');
    });

    it('deve retornar "Não Definido" para centro de custo vazio', () => {
      expect(getCostCenterLabel('')).toBe('Não Definido');
    });

    it('deve retornar o value como fallback para centro de custo desconhecido', () => {
      expect(getCostCenterLabel('CENTRO_INVALIDO')).toBe('CENTRO_INVALIDO');
    });
  });
});
