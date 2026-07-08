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
    const expense = await prisma.recurringExpense.findUnique({
      where: { id: params.id },
      select: { isActive: true },
    });

    if (!expense) {
      return NextResponse.json({ error: 'Despesa fixa não encontrada' }, { status: 404 });
    }

    const updated = await prisma.recurringExpense.update({
      where: { id: params.id },
      data: { isActive: !expense.isActive },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Erro ao alternar despesa fixa:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
