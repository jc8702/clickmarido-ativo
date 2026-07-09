import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
  if (!validateToken(request)) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    const where: any = {};
    if (status) where.status = status;

    const accounts = await prisma.bankAccount.findMany({
      where,
      orderBy: [{ isDefault: 'desc' }, { bankName: 'asc' }],
    });

    const totalBalance = accounts
      .filter(a => a.status === 'ativa')
      .reduce((sum, a) => sum + Number(a.currentBalance), 0);

    return NextResponse.json({
      data: accounts,
      totalBalance,
      count: accounts.length,
    });
  } catch (error) {
    console.error('Erro ao buscar contas bancárias:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!validateToken(request)) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { bankName, agency, accountNumber, accountType, nickname, initialBalance, color, isDefault, notes } = body;

    if (!bankName) {
      return NextResponse.json({ error: 'Dados obrigatórios não informados' }, { status: 400 });
    }

    if (accountType !== 'PAGAMENTO' && (!agency || !accountNumber)) {
      return NextResponse.json({ error: 'Agência e Conta são obrigatórias para este tipo de conta' }, { status: 400 });
    }

    // Se for definida como padrão, remover padrão das outras
    if (isDefault) {
      await prisma.bankAccount.updateMany({
        where: { isDefault: true },
        data: { isDefault: false },
      });
    }

    const account = await prisma.bankAccount.create({
      data: {
        bankName,
        agency: agency || '',
        accountNumber: accountNumber || '',
        accountType: accountType || 'CORRENTE',
        nickname,
        initialBalance: initialBalance || 0,
        currentBalance: initialBalance || 0,
        color,
        isDefault: isDefault || false,
        notes,
      },
    });

    return NextResponse.json(account, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar conta bancária:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
