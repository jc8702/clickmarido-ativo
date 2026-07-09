import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
  if (!validateToken(request)) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const bankAccountId = searchParams.get('bankAccountId');
    const isReconciled = searchParams.get('isReconciled');

    const where: any = {};
    if (bankAccountId) where.bankAccountId = bankAccountId;
    if (isReconciled !== null && isReconciled !== undefined) {
      where.isReconciled = isReconciled === 'true';
    } else {
      // Por padrão, mostrar todos mas ordenar pendentes primeiro
      where.isReconciled = undefined;
    }

    const reconciliations = await prisma.bankReconciliation.findMany({
      where,
      include: {
        bankAccount: { select: { id: true, bankName: true, nickname: true, accountNumber: true } },
      },
      orderBy: [{ isReconciled: 'asc' }, { transactionDate: 'desc' }],
    });

    // Resumo - total por conta
    const summary = await prisma.bankReconciliation.groupBy({
      by: ['bankAccountId'],
      _sum: { amount: true },
      _count: true,
    });

    // Pendentes (não conciliados)
    const pendingSummary = await prisma.bankReconciliation.groupBy({
      by: ['bankAccountId'],
      where: { isReconciled: false },
      _sum: { amount: true },
      _count: true,
    });

    return NextResponse.json({ data: reconciliations, summary, pendingSummary });
  } catch (error) {
    console.error('Erro ao buscar conciliações:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!validateToken(request)) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const {
      bankAccountId, transactionDate, description, amount,
      type, referenceType, referenceId, documentNumber, notes
    } = body;

    if (!bankAccountId || !transactionDate || !description || !amount || !type) {
      return NextResponse.json({ error: 'Dados obrigatórios não informados' }, { status: 400 });
    }

    const reconciliation = await prisma.bankReconciliation.create({
      data: {
        bankAccountId,
        transactionDate: new Date(transactionDate),
        description,
        amount,
        type,
        referenceType,
        referenceId,
        documentNumber,
        notes,
      },
    });

    return NextResponse.json(reconciliation, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar conciliação:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  if (!validateToken(request)) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id, isReconciled, notes } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID não informado' }, { status: 400 });
    }

    const reconciliation = await prisma.bankReconciliation.update({
      where: { id },
      data: {
        isReconciled: isReconciled,
        reconciledAt: isReconciled ? new Date() : null,
        notes: notes || undefined,
      },
    });

    return NextResponse.json(reconciliation);
  } catch (error) {
    console.error('Erro ao atualizar conciliação:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
