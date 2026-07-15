import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateToken } from '@/lib/auth';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!validateToken(request)) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const { amount, paymentMethod, bankAccountId, paymentDate, notes } = body;

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'Valor inválido' }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx) => {
      const account = await tx.accountReceivable.findUnique({
        where: { id },
        select: { totalAmount: true, paidAmount: true, status: true, title: true, invoiceId: true },
      });

      if (!account) {
        throw new Error('Conta não encontrada');
      }

      if (account.status === 'baixado' || account.status === 'cancelado') {
        throw new Error('Conta já foi baixada ou cancelada');
      }

      const newPaidAmount = Number(account.paidAmount) + Number(amount);
      const totalAmount = Number(account.totalAmount);

      // Determinar novo status
      let newStatus: string;
      if (newPaidAmount >= totalAmount) {
        newStatus = 'baixado';
      } else {
        newStatus = 'parcial';
      }

      const paidDate = newStatus === 'baixado' ? new Date(paymentDate || Date.now()) : null;

      // Atualizar conta
      const updatedAccount = await tx.accountReceivable.update({
        where: { id },
        data: {
          paidAmount: newPaidAmount,
          status: newStatus,
          paidDate,
          paymentMethod,
          bankAccountId,
        },
      });

      // Atualizar saldo da conta bancária (entrada)
      if (bankAccountId) {
        await tx.bankAccount.update({
          where: { id: bankAccountId },
          data: {
            currentBalance: {
              increment: Number(amount),
            },
          },
        });
      }

      // Buscar saldo atual da conta bancária para o balance
      let currentBalance = 0;
      if (bankAccountId) {
        const bankAccount = await tx.bankAccount.findUnique({
          where: { id: bankAccountId },
          select: { currentBalance: true },
        });
        currentBalance = Number(bankAccount?.currentBalance || 0);
      }

      // Registrar transação financeira
      await tx.financialTransaction.create({
        data: {
          type: 'PAYMENT_RECEIVED',
          invoiceId: account.invoiceId || null,
          description: `Recebimento - ${account.title || 'Conta a receber'}`,
          credit: Number(amount),
          debit: 0,
          balance: currentBalance,
          notes: notes || `Recebimento via ${paymentMethod || 'manual'}`,
          transactionDate: paidDate || new Date(),
        },
      });

      // Atualizar Invoice vinculada se existir
      if (account.invoiceId && newStatus === 'baixado') {
        const invoice = await tx.invoice.findUnique({
          where: { id: account.invoiceId },
          select: { totalAmount: true },
        });

        if (invoice) {
          const totalPaid = await tx.accountReceivable.aggregate({
            where: { invoiceId: account.invoiceId, status: 'baixado' },
            _sum: { paidAmount: true },
          });

          const totalPaidAmount = Number(totalPaid._sum.paidAmount || 0) + Number(amount);
          if (totalPaidAmount >= Number(invoice.totalAmount)) {
            await tx.invoice.update({
              where: { id: account.invoiceId },
              data: { status: 'paga' },
            });
          }
        }
      }

      // Criar registro de conciliação bancária
      if (bankAccountId) {
        await tx.bankReconciliation.create({
          data: {
            bankAccountId,
            transactionDate: paidDate || new Date(),
            description: `Recebimento - ${account.title || 'Conta a receber'}`,
            amount: Number(amount),
            type: 'ENTRADA',
            isReconciled: true,
            reconciledAt: new Date(),
          },
        });
      }

      return {
        account: updatedAccount,
        payment: {
          amount,
          method: paymentMethod,
          date: paidDate || new Date(),
          newStatus,
          remaining: totalAmount - newPaidAmount,
        },
      };
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Erro ao baixar conta a receber:', error);
    const message = error.message || 'Erro interno';
    const status = message.includes('não encontrada') ? 404
      : message.includes('já foi baixada') ? 400
      : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
