import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateToken } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!validateToken(request)) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const account = await prisma.accountReceivable.findUnique({
      where: { id },
      include: {
        customer: true,
        bankAccount: true,
        chartOfAccount: true,
        invoice: true,
      },
    });

    if (!account) {
      return NextResponse.json({ error: 'Conta não encontrada' }, { status: 404 });
    }

    return NextResponse.json(account);
  } catch (error) {
    console.error('Erro ao buscar conta a receber:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!validateToken(request)) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const {
      title, description, totalAmount, dueDate, status,
      paymentMethod, bankAccountId, customerId, chartOfAccountId,
      costCenter, discount, interest, fine, notes
    } = body;

    const account = await prisma.accountReceivable.update({
      where: { id },
      data: {
        title,
        description,
        totalAmount,
        dueDate: dueDate ? new Date(dueDate) : undefined,
        status,
        paymentMethod,
        bankAccountId,
        customerId,
        chartOfAccountId,
        costCenter,
        discount,
        interest,
        fine,
        notes,
      },
    });

    return NextResponse.json(account);
  } catch (error) {
    console.error('Erro ao atualizar conta a receber:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!validateToken(request)) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const account = await prisma.accountReceivable.findUnique({
      where: { id },
      include: {
        invoice: {
          include: {
            payments: true,
          },
        },
      },
    });

    if (!account) {
      return NextResponse.json({ error: 'Conta não encontrada' }, { status: 404 });
    }

    await prisma.$transaction(async (tx) => {
      const amountToRevert = Number(account.paidAmount);

      // 1. Reverter saldo da conta bancária
      if (account.bankAccountId && amountToRevert > 0) {
        await tx.bankAccount.update({
          where: { id: account.bankAccountId },
          data: {
            currentBalance: {
              decrement: amountToRevert,
            },
          },
        });
      }

      // 2. Excluir conciliação bancária relacionada
      await tx.bankReconciliation.deleteMany({
        where: {
          OR: [
            { referenceType: 'ACCOUNT_RECEIVABLE', referenceId: id },
            {
              bankAccountId: account.bankAccountId || '',
              amount: amountToRevert,
              type: 'ENTRADA',
              transactionDate: account.paidDate || account.dueDate,
            },
          ],
        },
      });

      // 3. Excluir pagamentos e faturas relacionadas
      if (account.invoiceId) {
        const paymentIds = account.invoice.payments.map((p) => p.id);

        if (paymentIds.length > 0) {
          // Deletar transações financeiras dos pagamentos
          await tx.financialTransaction.deleteMany({
            where: {
              paymentId: { in: paymentIds },
            },
          });

          // Deletar pagamentos
          await tx.payment.deleteMany({
            where: {
              id: { in: paymentIds },
            },
          });
        }

        // Deletar transações financeiras da fatura
        await tx.financialTransaction.deleteMany({
          where: {
            invoiceId: account.invoiceId,
          },
        });

        // Deletar fatura
        await tx.invoice.delete({
          where: { id: account.invoiceId },
        });
      }

      // 4. Se a conta foi criada a partir de um pagamento avulso direto
      const payIdFromNotes = account.notes?.match(/Pagamento ID:\s*([a-zA-Z0-9]+)/)?.[1]
        || account.description?.match(/Pagamento ID:\s*([a-zA-Z0-9]+)/)?.[1];

      if (payIdFromNotes) {
        await tx.financialTransaction.deleteMany({
          where: { paymentId: payIdFromNotes },
        });
        await tx.payment.deleteMany({
          where: { id: payIdFromNotes },
        });
      }

      // 5. Excluir a conta a receber
      await tx.accountReceivable.delete({
        where: { id },
      });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao excluir conta a receber:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
