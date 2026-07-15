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
    const transfer = await prisma.bankTransfer.findUnique({
      where: { id },
      include: {
        fromAccount: true,
        toAccount: true,
      },
    });

    if (!transfer) {
      return NextResponse.json({ error: 'Transferência não encontrada' }, { status: 404 });
    }

    return NextResponse.json(transfer);
  } catch (error) {
    console.error('Erro ao buscar transferência:', error);
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
    const transfer = await prisma.bankTransfer.findUnique({
      where: { id },
      select: { status: true },
    });

    if (!transfer) {
      return NextResponse.json({ error: 'Transferência não encontrada' }, { status: 404 });
    }

    if (transfer.status === 'cancelada') {
      return NextResponse.json({ error: 'Transferência já cancelada' }, { status: 400 });
    }

    // Cancelar transferência (não estornar automaticamente por segurança)
    await prisma.bankTransfer.update({
      where: { id },
      data: { status: 'cancelada' },
    });

    return NextResponse.json({ success: true, message: 'Transferência cancelada. Estorne manualmente se necessário.' });
  } catch (error) {
    console.error('Erro ao cancelar transferência:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
