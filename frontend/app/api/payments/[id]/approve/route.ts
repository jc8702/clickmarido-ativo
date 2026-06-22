import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import * as jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET;

function validateToken(request: NextRequest) {
  if (!JWT_SECRET) {
    return NextResponse.json({ error: 'Configuração inválida' }, { status: 500 });
  }

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

    // Atualiza status do orçamento para "aceito" (que significa aprovado / pago)
    const updated = await prisma.quotation.update({
      where: { id },
      data: { status: 'aceito' },
    });

    return NextResponse.json({
      success: true,
      data: updated,
    });

  } catch (error: any) {
    console.error('PATCH /api/payments/[id]/approve error:', error);
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Pagamento não encontrado' }, { status: 404 });
    }
    return NextResponse.json(
      { error: 'Erro ao aprovar pagamento' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
