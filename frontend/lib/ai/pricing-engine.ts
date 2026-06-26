import { prisma } from '../prisma';

interface PricingParams {
  category: string;
  description: string;
  estimatedTime?: number; // em minutos
}

interface PricingResult {
  success: boolean;
  suggestedPrice: number;
  minPrice: number;
  maxPrice: number;
  confidence: 'high' | 'medium' | 'low';
  sampleSize: number;
  basis: 'historical' | 'hourly_rate';
  explanation: string;
}

export async function estimateServicePrice({
  category,
  description,
  estimatedTime,
}: PricingParams): Promise<PricingResult> {
  try {
    // 1. Obter configurações padrão da empresa
    const settings = await prisma.companySettings.findFirst();
    const defaultHourlyRate = Number(settings?.defaultHourlyRate ?? 80);

    // Tempo estimado padrão se não fornecido
    const timeInMinutes = estimatedTime ?? 60; // 1 hora padrão

    // 2. Buscar serviços (produtos do tipo SERVICO) da categoria fornecida
    const products = await prisma.product.findMany({
      where: {
        type: 'SERVICO',
        category: {
          equals: category,
          mode: 'insensitive',
        },
      },
      select: { id: true, estimatedTime: true },
    });

    const productIds = products.map((p) => p.id);

    // 3. Buscar orçamentos anteriores não cancelados para essa categoria de serviço
    let historyItems: any[] = [];
    if (productIds.length > 0) {
      historyItems = await prisma.quotationItem.findMany({
        where: {
          productId: { in: productIds },
          quotation: {
            status: { notIn: ['cancelado', 'rejeitado'] },
          },
        },
        select: {
          unitPrice: true,
          product: {
            select: {
              estimatedTime: true,
            },
          },
        },
      });
    }

    let suggestedPrice = 0;
    let minPrice = 0;
    let maxPrice = 0;
    let confidence: 'high' | 'medium' | 'low' = 'low';
    let basis: 'historical' | 'hourly_rate' = 'hourly_rate';
    let sampleSize = historyItems.length;
    let explanation = '';

    // Se temos dados históricos, calculamos com base no histórico
    if (sampleSize > 0) {
      const prices = historyItems.map((item) => Number(item.unitPrice));
      const sum = prices.reduce((a, b) => a + b, 0);
      const avgPrice = sum / sampleSize;

      // Calcular média ponderada por hora cobrada se houver estimativas de tempo
      let totalHourlyRates = 0;
      let itemsWithTime = 0;

      historyItems.forEach((item) => {
        const itemTime = item.product?.estimatedTime ?? 60;
        const itemHourlyRate = Number(item.unitPrice) / (itemTime / 60);
        if (itemHourlyRate > 0) {
          totalHourlyRates += itemHourlyRate;
          itemsWithTime++;
        }
      });

      const avgHourlyRate = itemsWithTime > 0 ? (totalHourlyRates / itemsWithTime) : Number(defaultHourlyRate);

      // Sugerir preço baseado na média ponderada do tempo solicitado
      suggestedPrice = avgHourlyRate * (timeInMinutes / 60);

      // Definir limites mínimo e máximo históricos
      const sortedPrices = [...prices].sort((a, b) => a - b);
      minPrice = sortedPrices[0] * (timeInMinutes / 60) / (avgPrice > 0 ? avgPrice : 1);
      maxPrice = sortedPrices[sortedPrices.length - 1] * (timeInMinutes / 60) / (avgPrice > 0 ? avgPrice : 1);

      // Normalizar limites se ficarem inválidos
      if (isNaN(minPrice) || minPrice <= 0) minPrice = suggestedPrice * 0.8;
      if (isNaN(maxPrice) || maxPrice <= 0) maxPrice = suggestedPrice * 1.3;

      basis = 'historical';
      confidence = sampleSize >= 5 ? 'high' : 'medium';
      explanation = `Calculado com base em ${sampleSize} serviço(s) anterior(es) da categoria "${category}".`;
    } else {
      // Sem histórico: basear estritamente na taxa de hora padrão da empresa
      suggestedPrice = defaultHourlyRate * (timeInMinutes / 60);
      minPrice = suggestedPrice * 0.85;
      maxPrice = suggestedPrice * 1.25;
      basis = 'hourly_rate';
      confidence = 'low';
      explanation = `Sem histórico de serviços para a categoria "${category}". Estimativa baseada na hora técnica padrão (R$ ${defaultHourlyRate.toFixed(2)}/h).`;
    }

    // 4. Heurísticas baseadas em análise do texto da descrição (NLP Básico)
    const text = description.toLowerCase();
    let modifier = 1.0;
    const notes: string[] = [];

    // Fator de Urgência / Plantão
    if (
      text.includes('urgente') ||
      text.includes('emergência') ||
      text.includes('imediato') ||
      text.includes('24h') ||
      text.includes('madrugada') ||
      text.includes('domingo') ||
      text.includes('feriado')
    ) {
      modifier += 0.25;
      notes.push('Acréscimo de 25% por urgência ou atendimento em plantão.');
    }

    // Fator de Altura / Risco
    if (
      text.includes('altura') ||
      text.includes('telhado') ||
      text.includes('andaime') ||
      text.includes('escada') ||
      text.includes('poste') ||
      text.includes('forro')
    ) {
      modifier += 0.15;
      notes.push('Acréscimo de 15% devido ao risco de trabalho em altura ou acesso restrito.');
    }

    // Fator de Facilidade / Simplicidade
    if (
      text.includes('simples') ||
      text.includes('rápido') ||
      text.includes('fácil') ||
      text.includes('pequeno') ||
      text.includes('ajuste') ||
      text.includes('apenas')
    ) {
      modifier -= 0.10;
      notes.push('Desconto de 10% por serviço de baixa complexidade ou ajuste rápido.');
    }

    // Aplicar o modificador
    suggestedPrice = parseFloat((suggestedPrice * modifier).toFixed(2));
    minPrice = parseFloat((minPrice * modifier).toFixed(2));
    maxPrice = parseFloat((maxPrice * modifier).toFixed(2));

    if (notes.length > 0) {
      explanation += ' Ajustes aplicados: ' + notes.join(' ');
    }

    return {
      success: true,
      suggestedPrice,
      minPrice,
      maxPrice,
      confidence,
      sampleSize,
      basis,
      explanation,
    };
  } catch (error) {
    console.error('[PRICING_ENGINE_ERROR]', error);
    return {
      success: false,
      suggestedPrice: 0,
      minPrice: 0,
      maxPrice: 0,
      confidence: 'low',
      sampleSize: 0,
      basis: 'hourly_rate',
      explanation: 'Erro interno ao processar a estimativa de preço.',
    };
  }
}
