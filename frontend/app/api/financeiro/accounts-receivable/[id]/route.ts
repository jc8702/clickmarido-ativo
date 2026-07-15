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
    const account = await prisma.accountReceivable.findUnique({
      where: { id },
      include: {
        customer: true,
        bankAccount: true,
        chartOfAccount: true,
        invoice: true,
      },
    });

    if (!account) {
      return NextResponse.json({ error: 'Conta não encontrada' }, { status: 404 });
    }

    return NextResponse.json(account);
  } catch (error) {
    console.error('Erro ao buscar conta a receber:', error);
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
      title, description, totalAmount, dueDate, status,
      paymentMethod, bankAccountId, customerId, chartOfAccountId,
      costCenter, discount, interest, fine, notes
    } = body;

    const account = await prisma.accountReceivable.update({
      where: { id },
      data: {
        title,
        description,
        totalAmount,
        dueDate: dueDate ? new Date(dueDate) : undefined,
        status,
        paymentMethod,
        bankAccountId,
        customerId,
        chartOfAccountId,
        costCenter,
        discount,
        interest,
        fine,
        notes,
      },
    });

    return NextResponse.json(account);
  } catch (error) {
    console.error('Erro ao atualizar conta a receber:', error);
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
    const account = await prisma.accountReceivable.findUnique({
      where: { id },
      select: { paidAmount: true, status: true },
    });

    if (!account) {
      return NextResponse.json({ error: 'Conta não encontrada' }, { status: 404 });
    }

    if (Number(account.paidAmount) > 0) {
      return NextResponse.json(
        { error: 'Não é possível excluir conta com valores recebidos' },
        { status: 400 }
      );
    }

    await prisma.accountReceivable.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao excluir conta a receber:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
