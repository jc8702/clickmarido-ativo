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
    const expense = await prisma.recurringExpense.findUnique({
      where: { id },
      include: {
        vendor: true,
        bankAccount: true,
        chartOfAccount: true,
        accountPayables: {
          orderBy: { createdAt: 'desc' },
          take: 12,
        },
      },
    });

    if (!expense) {
      return NextResponse.json({ error: 'Despesa fixa não encontrada' }, { status: 404 });
    }

    return NextResponse.json(expense);
  } catch (error) {
    console.error('Erro ao buscar despesa fixa:', error);
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
      description, amount, frequency, customFrequency,
      dayOfMonth, dayOfWeek, monthOfYear, startDate, endDate,
      isActive, chartOfAccountId, costCenter, vendorId, bankAccountId, notes
    } = body;

    const expense = await prisma.recurringExpense.update({
      where: { id },
      data: {
        description,
        amount,
        frequency,
        customFrequency,
        dayOfMonth,
        dayOfWeek,
        monthOfYear,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        isActive,
        chartOfAccountId,
        costCenter,
        vendorId,
        bankAccountId,
        notes,
      },
    });

    return NextResponse.json(expense);
  } catch (error) {
    console.error('Erro ao atualizar despesa fixa:', error);
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
    await prisma.recurringExpense.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao excluir despesa fixa:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
