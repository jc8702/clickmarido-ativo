import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
  if (!validateToken(request)) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const isActive = searchParams.get('isActive');

    const where: any = {};
    if (isActive !== null) where.isActive = isActive === 'true';

    const expenses = await prisma.recurringExpense.findMany({
      where,
      include: {
        vendor: { select: { id: true, name: true } },
        bankAccount: { select: { id: true, bankName: true, nickname: true } },
        chartOfAccount: { select: { id: true, code: true, name: true } },
      },
      orderBy: { nextDue: 'asc' },
    });

    // Calcular total mensal estimado
    const monthlyTotal = expenses
      .filter(e => e.isActive)
      .reduce((sum, e) => {
        const amount = Number(e.amount);
        switch (e.frequency) {
          case 'SEMANAL': return sum + (amount * 4.33);
          case 'MENSAL': return sum + amount;
          case 'ANUAL': return sum + (amount / 12);
          case 'PERSONALIZADO':
            if (e.customFrequency) return sum + (amount * (30 / e.customFrequency));
            return sum + amount;
          default: return sum + amount;
        }
      }, 0);

    return NextResponse.json({ data: expenses, monthlyTotal });
  } catch (error) {
    console.error('Erro ao buscar despesas fixas:', error);
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
      description, amount, frequency, customFrequency,
      dayOfMonth, dayOfWeek, monthOfYear, startDate, endDate,
      chartOfAccountId, costCenter, vendorId, bankAccountId, notes
    } = body;

    if (!description || !amount || !frequency || !startDate) {
      return NextResponse.json({ error: 'Dados obrigatórios não informados' }, { status: 400 });
    }

    // Calcular próxima data de vencimento
    const start = new Date(startDate);
    let nextDue = new Date(start);

    const expense = await prisma.recurringExpense.create({
      data: {
        description,
        amount,
        frequency,
        customFrequency,
        dayOfMonth,
        dayOfWeek,
        monthOfYear,
        startDate: start,
        endDate: endDate ? new Date(endDate) : null,
        nextDue,
        chartOfAccountId,
        costCenter,
        vendorId,
        bankAccountId,
        notes,
      },
    });

    return NextResponse.json(expense, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar despesa fixa:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
