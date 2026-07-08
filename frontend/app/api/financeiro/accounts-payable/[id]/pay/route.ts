import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateToken } from '@/lib/auth';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!validateToken(request)) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { amount, paymentMethod, bankAccountId, paymentDate, notes } = body;

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'Valor inválido' }, { status: 400 });
    }

    const account = await prisma.accountPayable.findUnique({
      where: { id: params.id },
      select: { totalAmount: true, paidAmount: true, status: true, title: true },
    });

    if (!account) {
      return NextResponse.json({ error: 'Conta não encontrada' }, { status: 404 });
    }

    if (account.status === 'pago' || account.status === 'cancelado') {
      return NextResponse.json({ error: 'Conta já foi paga ou cancelada' }, { status: 400 });
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

    // Atualizar conta
    const updatedAccount = await prisma.accountPayable.update({
      where: { id: params.id },
      data: {
        paidAmount: newPaidAmount,
        status: newStatus,
        paidDate: newStatus === 'pago' ? new Date(paymentDate || Date.now()) : null,
        paymentMethod,
        bankAccountId,
      },
    });

    // Atualizar saldo da conta bancária (saída)
    if (bankAccountId) {
      await prisma.bankAccount.update({
        where: { id: bankAccountId },
        data: {
          currentBalance: {
            decrement: Number(amount),
          },
        },
      });
    }

    // Registrar transação financeira
    await prisma.financialTransaction.create({
      data: {
        type: 'EXPENSE_RECORDED',
        description: `Pagamento - ${account.title || 'Conta a pagar'}`,
        debit: Number(amount),
        balance: -newPaidAmount,
        notes,
      },
    });

    return NextResponse.json({
      account: updatedAccount,
      payment: {
        amount,
        method: paymentMethod,
        date: paymentDate || new Date().toISOString(),
        newStatus,
        remaining: totalAmount - newPaidAmount,
      },
    });
  } catch (error) {
    console.error('Erro ao baixar conta a pagar:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
