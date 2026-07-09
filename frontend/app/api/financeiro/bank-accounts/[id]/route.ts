import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateToken } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!validateToken(request)) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }

  try {
    const account = await prisma.bankAccount.findUnique({
      where: { id: params.id },
      include: {
        accountReceivables: {
          where: { status: { in: ['aberto', 'parcial', 'vencido'] } },
          take: 10,
          orderBy: { dueDate: 'asc' },
        },
        accountPayables: {
          where: { status: { in: ['aberto', 'parcial', 'vencido'] } },
          take: 10,
          orderBy: { dueDate: 'asc' },
        },
      },
    });

    if (!account) {
      return NextResponse.json({ error: 'Conta não encontrada' }, { status: 404 });
    }

    return NextResponse.json(account);
  } catch (error) {
    console.error('Erro ao buscar conta bancária:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!validateToken(request)) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { bankName, agency, accountNumber, accountType, nickname, initialBalance, currentBalance, status, color, isDefault, notes } = body;

    if (!bankName) {
      return NextResponse.json({ error: 'Dados obrigatórios não informados' }, { status: 400 });
    }

    if (accountType !== 'PAGAMENTO' && (!agency || !accountNumber)) {
      return NextResponse.json({ error: 'Agência e Conta são obrigatórias para este tipo de conta' }, { status: 400 });
    }

    // Se for definida como padrão, remover padrão das outras
    if (isDefault) {
      await prisma.bankAccount.updateMany({
        where: { isDefault: true, id: { not: params.id } },
        data: { isDefault: false },
      });
    }

    const account = await prisma.bankAccount.update({
      where: { id: params.id },
      data: {
        bankName,
        agency: agency || '',
        accountNumber: accountNumber || '',
        accountType: accountType || 'CORRENTE',
        nickname,
        initialBalance,
        currentBalance,
        status,
        color,
        isDefault,
        notes,
      },
    });

    return NextResponse.json(account);
  } catch (error) {
    console.error('Erro ao atualizar conta bancária:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!validateToken(request)) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }

  try {
    // Verificar se há movimentações vinculadas
    const hasMovements = await prisma.accountReceivable.findFirst({
      where: { bankAccountId: params.id },
    });

    if (hasMovements) {
      return NextResponse.json(
        { error: 'Não é possível excluir conta com movimentações' },
        { status: 400 }
      );
    }

    await prisma.bankAccount.delete({ where: { id: params.id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao excluir conta bancária:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
