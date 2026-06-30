import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { validateToken } from '@/lib/auth';

const prisma = new PrismaClient();

type RouteParams = { params: Promise<{ id: string }> };

export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
) {
  const { id } = await params;
  try {
    if (!validateToken(request)) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const order = await prisma.serviceOrder.update({
      where: { id },
      data: {
        status: 'em_execucao',
        startedAt: new Date(),
      },
      include: { customer: true, technician: true },
    });

    return NextResponse.json(order);

  } catch (error: any) {
    console.error('PATCH /api/service-orders/[id]/start error:', error);
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Ordem de serviço não encontrada' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Erro ao iniciar OS' }, { status: 500 });
  } finally {
  }
}
