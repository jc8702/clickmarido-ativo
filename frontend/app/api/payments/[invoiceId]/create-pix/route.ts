import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import * as jwt from 'jsonwebtoken';
import { createPixPayment } from '@/lib/mercadopago';

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

type RouteParams = { params: Promise<{ invoiceId: string }> };

// POST /api/payments/[invoiceId]/create-pix - Criar pagamento PIX via Mercado Pago
export async function POST(request: NextRequest, { params }: RouteParams) {
  const { invoiceId } = await params;
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

    // Verificar se já existe pagamento pendente
    const existingPayment = await prisma.payment.findFirst({
      where: {
        invoiceId,
        status: { in: ['pendente', 'confirmado'] },
        method: 'pix',
      },
    });

    if (existingPayment && existingPayment.status === 'confirmado') {
      return NextResponse.json({ error: 'Invoice já paga' }, { status: 400 });
    }

    // Se já tem pagamento pendente com PIX, retornar dados existentes
    if (existingPayment && existingPayment.pixQrCode) {
      return NextResponse.json({
        success: true,
        data: {
          paymentId: existingPayment.id,
          qrCode: existingPayment.pixQrCode,
          pixKey: existingPayment.pixCode,
          expiresAt: existingPayment.dueDateAt,
          amount: existingPayment.amount,
        },
      });
    }

    // Criar pagamento PIX via Mercado Pago
    const body = await request.json().catch(() => ({}));
    const expiresIn = body.expiresIn || 3600; // 1 hora padrão

    const mpPayment = await createPixPayment({
      transactionAmount: invoice.totalAmount,
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
        method: 'pix',
        status: 'pendente',
        mpPaymentId: String(mpPayment.mpPaymentId),
        mpStatus: mpPayment.status,
        pixQrCode: mpPayment.qrCodeBase64 || '',
        pixCode: mpPayment.pixKey || '',
        pixExpiration: mpPayment.expiresAt ? new Date(mpPayment.expiresAt) : null,
        description: `PIX via Mercado Pago`,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        paymentId: payment.id,
        qrCode: mpPayment.qrCodeBase64,
        pixKey: mpPayment.pixKey,
        expiresAt: mpPayment.expiresAt,
        amount: invoice.totalAmount,
        mpPaymentId: mpPayment.mpPaymentId,
      },
    });
  } catch (error) {
    console.error('POST /api/payments/[invoiceId]/create-pix error:', error);
    return NextResponse.json(
      { error: 'Erro ao criar pagamento PIX' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
