import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import * as jwt from 'jsonwebtoken';

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

// POST /api/invoices/[id]/pay - Registrar pagamento da fatura e dar baixa
export async function POST(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  try {
    if (!validateToken(request)) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const body = await request.json();
    const { method = 'pix', paidAt = new Date(), notes = '' } = body;

    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: { payments: true }
    });

    if (!invoice) {
      return NextResponse.json({ error: 'Fatura não encontrada' }, { status: 404 });
    }

    if (invoice.status === 'paga') {
      return NextResponse.json({ error: 'Fatura já está paga' }, { status: 400 });
    }

    const payDate = new Date(paidAt);

    // Executar alterações transacionais
    const result = await prisma.$transaction(async (tx) => {
      // 1. Atualizar status da fatura para paga
      const updatedInvoice = await tx.invoice.update({
        where: { id },
        data: { status: 'paga' }
      });

      // 2. Verificar se já existe um pagamento pendente para essa fatura
      const existingPendingPayment = invoice.payments.find(p => p.status === 'pendente');

      let payment;
      if (existingPendingPayment) {
        // Atualiza pagamento existente para confirmado
        payment = await tx.payment.update({
          where: { id: existingPendingPayment.id },
          data: {
            status: 'confirmado',
            paidAt: payDate,
            method: method,
            description: notes ? `${existingPendingPayment.description} - ${notes}` : existingPendingPayment.description
          }
        });
      } else {
        // Cria um novo pagamento confirmado
        payment = await tx.payment.create({
          data: {
            invoiceId: invoice.id,
            customerId: invoice.customerId,
            quotationId: invoice.quotationId,
            amount: invoice.totalAmount,
            method: method,
            status: 'confirmado',
            paidAt: payDate,
            description: `Baixa manual da Fatura #${invoice.invoiceNumber}. ${notes}`
          }
        });
      }

      // 3. Criar transação financeira
      await tx.financialTransaction.create({
        data: {
          type: 'PAYMENT_RECEIVED',
          invoiceId: invoice.id,
          paymentId: payment.id,
          credit: invoice.totalAmount,
          debit: 0,
          description: `Recebimento de Fatura #${invoice.invoiceNumber} (${method.toUpperCase()})`,
          notes: notes,
          transactionDate: payDate
        }
      });

      // 4. Se tiver Quotation vinculada, atualizar para aceito
      if (invoice.quotationId) {
        await tx.quotation.update({
          where: { id: invoice.quotationId },
          data: { status: 'aceito' }
        });
      }

      // 5. Registrar log de auditoria
      await tx.auditLog.create({
        data: {
          entity: 'payment',
          entityId: payment.id,
          action: 'automation_triggered',
          newValue: { invoiceId: invoice.id, amount: invoice.totalAmount, method }
        }
      });

      return updatedInvoice;
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    console.error('POST /api/invoices/[id]/pay error:', error);
    return NextResponse.json({ error: 'Erro ao registrar baixa da fatura' }, { status: 500 });
  } finally {
  }
}
