import { estimateServicePrice } from '../../lib/ai/pricing-engine';
import { prisma } from '../../lib/prisma';

// Mock do prisma para evitar chamadas de banco reais nos testes unitários
jest.mock('../../lib/prisma', () => ({
  prisma: {
    companySettings: {
      findFirst: jest.fn(),
    },
    product: {
      findMany: jest.fn(),
    },
    quotationItem: {
      findMany: jest.fn(),
    },
  },
}));

describe('pricing-engine', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve estimar preço com base na taxa de hora padrão da empresa quando não houver histórico', async () => {
    // Configurar os mocks para simular banco vazio
    (prisma.companySettings.findFirst as jest.Mock).mockResolvedValue({
      defaultHourlyRate: 100,
    });
    (prisma.product.findMany as jest.Mock).mockResolvedValue([]);

    const result = await estimateServicePrice({
      category: 'Hidráulica',
      description: 'Troca de torneira comum',
      estimatedTime: 60, // 1 hora
    });

    expect(result.success).toBe(true);
    expect(result.suggestedPrice).toBe(100);
    expect(result.basis).toBe('hourly_rate');
    expect(result.confidence).toBe('low');
    expect(result.sampleSize).toBe(0);
  });

  it('deve estimar preço com base nos serviços do histórico quando disponíveis', async () => {
    (prisma.companySettings.findFirst as jest.Mock).mockResolvedValue({
      defaultHourlyRate: 80,
    });
    // Simular que existem 3 produtos correspondentes cadastrados
    (prisma.product.findMany as jest.Mock).mockResolvedValue([
      { id: 'prod1', estimatedTime: 60 },
    ]);
    // Simular 2 orçamentos anteriores aprovados com preços de 120 e 180 reais
    (prisma.quotationItem.findMany as jest.Mock).mockResolvedValue([
      { unitPrice: 120, product: { estimatedTime: 60 } },
      { unitPrice: 180, product: { estimatedTime: 60 } },
    ]);

    const result = await estimateServicePrice({
      category: 'Elétrica',
      description: 'Instalação de disjuntor',
      estimatedTime: 60, // 1 hora
    });

    expect(result.success).toBe(true);
    // Média de preço unitário por hora: (120/1 + 180/1) / 2 = 150/h. Estimativa para 1h = 150.
    expect(result.suggestedPrice).toBe(150);
    expect(result.basis).toBe('historical');
    expect(result.confidence).toBe('medium'); // < 5 amostras
    expect(result.sampleSize).toBe(2);
  });

  it('deve aplicar acréscimo de urgência quando a descrição contiver termos de urgência', async () => {
    (prisma.companySettings.findFirst as jest.Mock).mockResolvedValue({
      defaultHourlyRate: 100,
    });
    (prisma.product.findMany as jest.Mock).mockResolvedValue([]);

    const result = await estimateServicePrice({
      category: 'Hidráulica',
      description: 'Vazamento urgente na cozinha',
      estimatedTime: 60, // 1 hora
    });

    expect(result.success).toBe(true);
    // Preço base = 100. Acréscimo urgência +25% = 125.
    expect(result.suggestedPrice).toBe(125);
    expect(result.explanation).toContain('urgência');
  });

  it('deve aplicar acréscimo de altura e risco quando a descrição contiver termos de risco', async () => {
    (prisma.companySettings.findFirst as jest.Mock).mockResolvedValue({
      defaultHourlyRate: 100,
    });
    (prisma.product.findMany as jest.Mock).mockResolvedValue([]);

    const result = await estimateServicePrice({
      category: 'Pintura',
      description: 'Pintura de fachada alta com escada',
      estimatedTime: 60, // 1 hora
    });

    expect(result.success).toBe(true);
    // Preço base = 100. Acréscimo risco/altura +15% = 115.
    expect(result.suggestedPrice).toBe(115);
    expect(result.explanation).toContain('altura');
  });

  it('deve aplicar desconto para serviços declarados simples ou rápidos', async () => {
    (prisma.companySettings.findFirst as jest.Mock).mockResolvedValue({
      defaultHourlyRate: 100,
    });
    (prisma.product.findMany as jest.Mock).mockResolvedValue([]);

    const result = await estimateServicePrice({
      category: 'Limpeza',
      description: 'Apenas ajuste simples e rápido de parafuso',
      estimatedTime: 60, // 1 hora
    });

    expect(result.success).toBe(true);
    // Preço base = 100. Desconto simples -10% = 90.
    expect(result.suggestedPrice).toBe(90);
    expect(result.explanation.toLowerCase()).toContain('desconto');
  });
});
