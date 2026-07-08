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
    const reconciliation = await prisma.bankReconciliation.findUnique({
      where: { id: params.id },
      select: { isReconciled: true },
    });

    if (!reconciliation) {
      return NextResponse.json({ error: 'Registro não encontrado' }, { status: 404 });
    }

    if (reconciliation.isReconciled) {
      return NextResponse.json({ error: 'Registro já conciliado' }, { status: 400 });
    }

    const updated = await prisma.bankReconciliation.update({
      where: { id: params.id },
      data: {
        isReconciled: true,
        reconciledAt: new Date(),
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Erro ao conciliar registro:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
