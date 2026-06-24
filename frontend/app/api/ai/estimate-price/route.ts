import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { estimateServicePrice } from '@/lib/ai/pricing-engine';

export async function POST(request: NextRequest): Promise<Response> {
  try {
    // 1. Validar autenticação
    const authResult = await verifyAuth(request);
    if (!authResult.success) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // 2. Extrair dados da requisição
    const body = await request.json();
    const { category, description, estimatedTime } = body;

    if (!category) {
      return NextResponse.json(
        { error: 'A categoria do serviço é obrigatória' },
        { status: 400 }
      );
    }

    if (!description) {
      return NextResponse.json(
        { error: 'A descrição do serviço é obrigatória para estimar o preço' },
        { status: 400 }
      );
    }

    // 3. Executar o motor de precificação da IA
    const result = await estimateServicePrice({
      category,
      description,
      estimatedTime: estimatedTime ? parseInt(estimatedTime, 10) : undefined,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('[API_ESTIMATE_PRICE_ERROR]', error);
    return NextResponse.json(
      { error: 'Erro interno ao processar estimativa de preço pela IA' },
      { status: 500 }
    );
  }
}
