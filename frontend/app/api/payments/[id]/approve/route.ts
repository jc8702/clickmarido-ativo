import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import * as jwt from 'jsonwebtoken';
const JWT_SECRET = process.env.JWT_SECRET;

function validateToken(request: NextRequest) {
  if (!JWT_SECRET) {
    return NextResponse.json({ error: 'Configuração inválida' }, { status: 500 });
  }

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

async function handleApprove(
  request: NextRequest,
  { params }: RouteParams
): Promise<Response> {
  const { id } = await params;
  try {
    if (!validateToken(request)) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const payment = await prisma.payment.findUnique({
      where: { id },
    });

    if (!payment) {
      return NextResponse.json({ error: 'Pagamento não encontrado' }, { status: 404 });
    }

    if (payment.status === 'confirmado') {
      return NextResponse.json({ error: 'Pagamento já está confirmado/pago' }, { status: 400 });
    }

    const now = new Date();

    const result = await prisma.$transaction(async (tx) => {
      const updatedPayment = await tx.payment.update({
        where: { id },
        data: {
          status: 'confirmado',
          paidAt: now,
          confirmedAt: now,
        },
      });

      if (payment.quotationId) {
        await tx.quotation.update({
          where: { id: payment.quotationId },
          data: { status: 'aceito' },
        });
      }

      if (payment.invoiceId) {
        await tx.invoice.update({
          where: { id: payment.invoiceId },
          data: { status: 'paga' },
        });
      }

      await tx.financialTransaction.create({
        data: {
          type: 'PAYMENT_RECEIVED',
          paymentId: payment.id,
          invoiceId: payment.invoiceId || null,
          credit: payment.amount,
          debit: 0,
          description: `Recebimento de Pagamento #${payment.id.slice(-6).toUpperCase()} (${payment.method.toUpperCase()})`,
          transactionDate: now,
        },
      });

      await tx.auditLog.create({
        data: {
          entity: 'payment',
          entityId: payment.id,
          action: 'updated',
          newValue: { status: 'confirmado', confirmedAt: now }
        }
      });

      return updatedPayment;
    });

    return NextResponse.json({
      success: true,
      data: result,
    });

  } catch (error: any) {
    console.error('POST /api/payments/[id]/approve error:', error);
    return NextResponse.json(
      { error: 'Erro ao aprovar pagamento' },
      { status: 500 }
    );
  } finally {
  }
}

export async function POST(
  request: NextRequest,
  { params }: RouteParams
): Promise<Response> {
  return handleApprove(request, { params });
}

export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
): Promise<Response> {
  return handleApprove(request, { params });
}
