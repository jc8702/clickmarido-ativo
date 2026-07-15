import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateToken } from '@/lib/auth';

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
    const { currentBalance, notes } = body;

    if (currentBalance === undefined) {
      return NextResponse.json({ error: 'Saldo não informado' }, { status: 400 });
    }

    const account = await prisma.bankAccount.update({
      where: { id },
      data: {
        currentBalance,
        notes: notes || undefined,
      },
    });

    // Registrar transação de ajuste
    await prisma.financialTransaction.create({
      data: {
        type: 'ADJUSTMENT',
        description: `Ajuste de saldo - ${account.bankName} (${account.accountNumber})`,
        credit: currentBalance > 0 ? currentBalance : 0,
        debit: currentBalance < 0 ? Math.abs(currentBalance) : 0,
        balance: currentBalance,
        notes,
      },
    });

    return NextResponse.json(account);
  } catch (error) {
    console.error('Erro ao ajustar saldo:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
