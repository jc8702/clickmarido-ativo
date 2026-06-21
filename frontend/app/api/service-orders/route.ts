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

export async function GET(request: NextRequest) {
  try {
    if (!validateToken(request)) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    // Busca orçamentos que não são rascunho
    const quotations = await prisma.quotation.findMany({
      where: {
        status: {
          not: 'rascunho',
        },
      },
      include: { customer: true },
      orderBy: { createdAt: 'desc' },
    });

    const orders = quotations.map(q => {
      let serviceStatus = 'agendada';
      if (q.status === 'aceito' || q.status === 'aprovado') {
        serviceStatus = 'concluida';
      } else if (q.status === 'enviado') {
        serviceStatus = 'em_progresso';
      } else if (q.status === 'rejeitado') {
        serviceStatus = 'cancelada';
      }

      return {
        id: q.id,
        customer_name: q.customer?.name || 'Cliente',
        scheduled_date: q.createdAt.toISOString(),
        status: serviceStatus,
        amount: q.total,
      };
    });

    return NextResponse.json({
      success: true,
      data: orders,
    });

  } catch (error) {
    console.error('GET /api/service-orders error:', error);
    return NextResponse.json(
      { error: 'Erro ao listar ordens de serviço' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
