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

    const now = new Date();

    const result = await prisma.$transaction(async (tx) => {
      // Verificar e atualizar status dentro da transaction para evitar race condition
      const payment = await tx.payment.findUnique({ where: { id } });

      if (!payment) {
        throw new Error('Pagamento não encontrado');
      }

      if (payment.status === 'confirmado') {
        throw new Error('Pagamento já está confirmado/pago');
      }

      // Validar transição de status: só permite pendente → confirmado
      if (payment.status !== 'pendente') {
        throw new Error(`Transição de "${payment.status}" para "confirmado" não é permitida`);
      }

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

      // P0-1: Só marcar invoice como paga se total dos pagamentos >= total da invoice
      if (payment.invoiceId) {
        const invoice = await tx.invoice.findUnique({ where: { id: payment.invoiceId } });
        if (invoice && invoice.status !== 'paga') {
          const totalPaid = await tx.payment.aggregate({
            where: { invoiceId: payment.invoiceId, status: 'confirmado' },
            _sum: { amount: true },
          });
          const paidAmount = Number(totalPaid._sum.amount || 0) + Number(payment.amount);

          if (paidAmount >= Number(invoice.totalAmount)) {
            await tx.invoice.update({
              where: { id: payment.invoiceId },
              data: { status: 'paga' },
            });
          }
        }
      }

      // Prevenir duplicidade: verificar se já existe transação financeira para este pagamento
      const existingTransaction = await tx.financialTransaction.findFirst({
        where: { paymentId: payment.id },
      });

      if (!existingTransaction) {
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
      }

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
    const message = error.message === 'Pagamento não encontrado'
      ? error.message
      : error.message === 'Pagamento já está confirmado/pago'
        ? error.message
        : 'Erro ao aprovar pagamento';
    const status = error.message === 'Pagamento não encontrado' ? 404
      : error.message === 'Pagamento já está confirmado/pago' ? 400
        : 500;
    return NextResponse.json({ error: message }, { status });
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
