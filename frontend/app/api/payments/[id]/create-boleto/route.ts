import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import * as jwt from 'jsonwebtoken';
import { createBoletoPayment } from '@/lib/mercadopago';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET;

function validateToken(request: NextRequest) {
  if (!JWT_SECRET) return null;
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

// POST /api/payments/[id]/create-boleto - Criar boleto via Mercado Pago
export async function POST(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const invoiceId = id;
  try {
    if (!validateToken(request)) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    // Buscar invoice
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { customer: true },
    });

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice não encontrada' }, { status: 404 });
    }

    if (invoice.status === 'cancelada') {
      return NextResponse.json({ error: 'Invoice cancelada' }, { status: 400 });
    }

    // Criar boleto via Mercado Pago
    const body = await request.json().catch(() => ({}));
    const expiresIn = body.expiresIn || 3; // 3 dias padrão

    const mpPayment = await createBoletoPayment({
      transactionAmount: Number(invoice.totalAmount),
      description: `Invoice #${invoice.invoiceNumber} - ${invoice.description || ''}`,
      externalReference: invoiceId,
      email: invoice.customer?.email || undefined,
      expiresIn,
    });

    // Salvar pagamento no banco
    const payment = await prisma.payment.create({
      data: {
        quotationId: invoice.quotationId,
        customerId: invoice.customerId,
        invoiceId,
        amount: invoice.totalAmount,
        method: 'boleto',
        status: 'pendente',
        mpPaymentId: String(mpPayment.mpPaymentId),
        mpStatus: mpPayment.status,
        boletoUrl: mpPayment.boletoUrl || '',
        boletoBarcode: mpPayment.barcode || '',
        description: `Boleto via Mercado Pago`,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        paymentId: payment.id,
        boletoUrl: mpPayment.boletoUrl,
        barcode: mpPayment.barcode,
        expiresAt: mpPayment.expiresAt,
        amount: invoice.totalAmount,
        mpPaymentId: mpPayment.mpPaymentId,
      },
    });
  } catch (error) {
    console.error('POST /api/payments/[invoiceId]/create-boleto error:', error);
    return NextResponse.json(
      { error: 'Erro ao criar boleto' },
      { status: 500 }
    );
  } finally {
  }
}
