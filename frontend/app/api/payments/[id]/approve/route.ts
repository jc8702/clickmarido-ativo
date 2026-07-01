import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateToken } from '@/lib/auth';

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

      let currentInvoiceId = payment.invoiceId;

      // P0-1: Só marcar invoice como paga se total dos pagamentos >= total da invoice
      if (currentInvoiceId) {
        const invoice = await tx.invoice.findUnique({ where: { id: currentInvoiceId } });
        if (invoice && invoice.status !== 'paga') {
          const totalPaid = await tx.payment.aggregate({
            where: { invoiceId: currentInvoiceId, status: 'confirmado' },
            _sum: { amount: true },
          });
          const paidAmount = Number(totalPaid._sum.amount || 0) + Number(payment.amount);

          if (paidAmount >= Number(invoice.totalAmount)) {
            await tx.invoice.update({
              where: { id: currentInvoiceId },
              data: { status: 'paga' },
            });
          }
        }
      } else {
        // Criar uma nova Invoice (Fatura) para este pagamento avulso
        const invoiceCount = await tx.invoice.count();
        const invoiceNumber = `INV-${now.getFullYear()}-${String(invoiceCount + 1).padStart(4, '0')}-${Math.floor(Math.random() * 1000)}`;
        
        const newInvoice = await tx.invoice.create({
          data: {
            customerId: payment.customerId,
            invoiceNumber,
            issueDate: now,
            dueDate: now,
            subtotal: payment.amount,
            totalAmount: payment.amount,
            status: 'paga',
            description: payment.description || 'Fatura gerada automaticamente por pagamento avulso',
          }
        });

        await tx.payment.update({
          where: { id },
          data: { invoiceId: newInvoice.id }
        });
        
        currentInvoiceId = newInvoice.id;
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
            invoiceId: currentInvoiceId || null,
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
