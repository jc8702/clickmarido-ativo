import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import * as jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

function validateToken(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;

  try {
    const token = authHeader.substring(7);
    jwt.verify(token, JWT_SECRET);
    return true;
  } catch {
    return null;
  }
}

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  const { id } = await params;
  try {
    if (!validateToken(request)) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const quotation = await prisma.quotation.findUnique({
      where: { id },
      include: { customer: true },
    });

    if (!quotation) {
      return NextResponse.json({ error: 'Pagamento não encontrado' }, { status: 404 });
    }

    // Código PIX Estático Simulado com valor dinâmico
    const formattedAmount = quotation.total.toFixed(2);
    const pixCode = `00020126580014br.gov.bcb.pix0136clickmarido-pix-chave-randomica0212PagamentoOS05204000053039865406${formattedAmount}5802BR5915ClickMaridoLtda6009SaoPaulo62070503***6304`;

    return NextResponse.json({
      success: true,
      data: {
        qr_code: pixCode,
        amount: quotation.total,
        customer_name: quotation.customer?.name || 'Cliente',
      },
    });

  } catch (error) {
    console.error('GET /api/payments/[id]/generate-pix error:', error);
    return NextResponse.json(
      { error: 'Erro ao gerar PIX' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
