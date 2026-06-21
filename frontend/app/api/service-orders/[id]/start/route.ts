import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import * as jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

function validateToken(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;

  try {
    const token = authHeader.substring(7);
    jwt.verify(token, JWT_SECRET);
    return true;
  } catch {
    return null;
  }
}

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

    // Atualiza status do orçamento para "enviado" (representando em progresso)
    const updated = await prisma.quotation.update({
      where: { id },
      data: { status: 'enviado' },
    });

    return NextResponse.json({
      success: true,
      data: updated,
    });

  } catch (error: any) {
    console.error('PATCH /api/service-orders/[id]/start error:', error);
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Ordem de serviço não encontrada' }, { status: 404 });
    }
    return NextResponse.json(
      { error: 'Erro ao iniciar ordem de serviço' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
