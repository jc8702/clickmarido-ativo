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
      const account = await tx.accountPayable.findUnique({
        where: { id },
        select: { totalAmount: true, paidAmount: true, status: true, title: true, expenseId: true },
      });

      if (!account) {
        throw new Error('Conta não encontrada');
      }

      if (account.status === 'pago' || account.status === 'cancelado') {
        throw new Error('Conta já foi paga ou cancelada');
      }

      const newPaidAmount = Number(account.paidAmount) + Number(amount);
      const totalAmount = Number(account.totalAmount);

      // Determinar novo status
      let newStatus: string;
      if (newPaidAmount >= totalAmount) {
        newStatus = 'pago';
      } else {
        newStatus = 'parcial';
      }

      const paidDate = newStatus === 'pago' ? new Date(paymentDate || Date.now()) : null;

      // Atualizar conta
      const updatedAccount = await tx.accountPayable.update({
        where: { id },
        data: {
          paidAmount: newPaidAmount,
          status: newStatus,
          paidDate,
          paymentMethod,
          bankAccountId,
        },
      });

      // Sincronizar saldo da conta bancária (saída)
      if (bankAccountId) {
        await tx.bankAccount.update({
          where: { id: bankAccountId },
          data: {
            currentBalance: {
              decrement: Number(amount),
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
          type: 'EXPENSE_PAID',
          expenseId: account.expenseId || null,
          description: `Pagamento - ${account.title || 'Conta a pagar'}`,
          debit: Number(amount),
          credit: 0,
          balance: currentBalance,
          notes: notes || `Pagamento via ${paymentMethod || 'manual'}`,
          transactionDate: paidDate || new Date(),
        },
      });

      // Atualizar Expense vinculada se existir
      if (account.expenseId && newStatus === 'pago') {
        await tx.expense.update({
          where: { id: account.expenseId },
          data: {
            status: 'paga',
            paidAt: paidDate,
          },
        });
      }

      // Criar registro de conciliação bancária
      if (bankAccountId) {
        await tx.bankReconciliation.create({
          data: {
            bankAccountId,
            transactionDate: paidDate || new Date(),
            description: `Pagamento - ${account.title || 'Conta a pagar'}`,
            amount: Number(amount),
            type: 'SAIDA',
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
    console.error('Erro ao baixar conta a pagar:', error);
    const message = error.message || 'Erro interno';
    const status = message.includes('não encontrada') ? 404
      : message.includes('já foi paga') ? 400
      : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
