import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
  if (!validateToken(request)) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }

  try {
    const transfers = await prisma.bankTransfer.findMany({
      include: {
        fromAccount: { select: { id: true, bankName: true, nickname: true, accountNumber: true } },
        toAccount: { select: { id: true, bankName: true, nickname: true, accountNumber: true } },
      },
      orderBy: { transferDate: 'desc' },
      take: 100,
    });

    return NextResponse.json({ data: transfers });
  } catch (error) {
    console.error('Erro ao buscar transferências:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!validateToken(request)) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { fromAccountId, toAccountId, amount, description, transferDate } = body;

    if (!fromAccountId || !toAccountId || !amount || !transferDate) {
      return NextResponse.json({ error: 'Dados obrigatórios não informados' }, { status: 400 });
    }

    if (fromAccountId === toAccountId) {
      return NextResponse.json({ error: 'Contas de origem e destino devem ser diferentes' }, { status: 400 });
    }

    // Verificar saldo da conta de origem
    const fromAccount = await prisma.bankAccount.findUnique({
      where: { id: fromAccountId },
      select: { currentBalance: true, bankName: true, accountNumber: true },
    });

    if (!fromAccount) {
      return NextResponse.json({ error: 'Conta de origem não encontrada' }, { status: 404 });
    }

    if (Number(fromAccount.currentBalance) < Number(amount)) {
      return NextResponse.json({ error: 'Saldo insuficiente na conta de origem' }, { status: 400 });
    }

    // Executar transferência em transação
    const [transfer] = await prisma.$transaction([
      // Criar registro de transferência
      prisma.bankTransfer.create({
        data: {
          fromAccountId,
          toAccountId,
          amount,
          description: description || `Transferência de ${fromAccount.bankName} para conta destino`,
          transferDate: new Date(transferDate),
          status: 'concluida',
        },
      }),
      // Debitar da conta de origem
      prisma.bankAccount.update({
        where: { id: fromAccountId },
        data: { currentBalance: { decrement: Number(amount) } },
      }),
      // Creditar na conta de destino
      prisma.bankAccount.update({
        where: { id: toAccountId },
        data: { currentBalance: { increment: Number(amount) } },
      }),
      // Registrar transações financeiras
      prisma.financialTransaction.create({
        data: {
          type: 'TRANSFER',
          description: `Transferência entre contas - ${description || ''}`,
          debit: Number(amount),
          balance: -Number(amount),
        },
      }),
    ]);

    return NextResponse.json(transfer, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar transferência:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
