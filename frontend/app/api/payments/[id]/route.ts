import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import * as jwt from 'jsonwebtoken';

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

// GET /api/payments/[id] - Detalhes do pagamento
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  try {
    if (!validateToken(request)) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const payment = await prisma.payment.findUnique({
      where: { id },
      include: {
        customer: true,
        quotation: {
          include: {
            serviceOrder: true,
            items: { include: { product: true } },
          },
        },
        invoice: true,
      },
    });

    if (!payment) {
      return NextResponse.json({ error: 'Pagamento não encontrado' }, { status: 404 });
    }

    return NextResponse.json(payment);
  } catch (error) {
    console.error('GET /api/payments/[id] error:', error);
    return NextResponse.json({ error: 'Erro ao buscar pagamento' }, { status: 500 });
  }
}

// DELETE /api/payments/[id] - Excluir pagamento e dados vinculados
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  try {
    if (!validateToken(request)) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const existingPayment = await prisma.payment.findUnique({
      where: { id },
      include: { invoice: true, quotation: true },
    });

    if (!existingPayment) {
      return NextResponse.json({ error: 'Pagamento não encontrado' }, { status: 404 });
    }

    // Executar exclusão em transação para manter consistência
    await prisma.$transaction(async (tx) => {
      // 1. Excluir transações financeiras vinculadas
      await tx.financialTransaction.deleteMany({
        where: { paymentId: id },
      });

      // 2. Excluir logs de auditoria vinculados
      await tx.auditLog.deleteMany({
        where: { entityId: id, entity: 'payment' },
      });

      // 3. Reverter status da fatura (paga → emitida) se aplicável
      if (existingPayment.invoiceId && existingPayment.invoice?.status === 'paga') {
        await tx.invoice.update({
          where: { id: existingPayment.invoiceId },
          data: { status: 'emitida' },
        });
      }

      // 4. Reverter status da proposta (aceito → enviada) se aplicável
      if (existingPayment.quotationId && existingPayment.quotation?.status === 'aceito') {
        await tx.quotation.update({
          where: { id: existingPayment.quotationId },
          data: { status: 'enviada' },
        });
      }

      // 5. Excluir o pagamento
      await tx.payment.delete({
        where: { id },
      });
    });

    // Registrar log de auditoria (após exclusão bem-sucedida)
    const { logAudit } = await import('@/lib/audit');
    await logAudit({
      request,
      entity: 'payment',
      entityId: id,
      action: 'deleted',
      oldValue: {
        id: existingPayment.id,
        customerId: existingPayment.customerId,
        amount: existingPayment.amount,
        status: existingPayment.status,
        invoiceId: existingPayment.invoiceId,
        quotationId: existingPayment.quotationId,
      },
    });

    return NextResponse.json({ message: 'Pagamento excluído com sucesso' });
  } catch (error) {
    console.error('DELETE /api/payments/[id] error:', error);
    return NextResponse.json({ error: 'Erro ao excluir pagamento' }, { status: 500 });
  }
}
