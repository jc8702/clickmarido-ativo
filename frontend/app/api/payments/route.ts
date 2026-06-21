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

    // Busca orçamentos que já foram enviados ou aceitos/aprovados
    const quotations = await prisma.quotation.findMany({
      where: {
        status: {
          in: ['enviado', 'aceito', 'aprovado'],
        },
      },
      include: { customer: true },
      orderBy: { updatedAt: 'desc' },
    });

    const payments = quotations.map(q => {
      const isApproved = q.status === 'aceito' || q.status === 'aprovado';
      return {
        id: q.id,
        service_order_id: q.id,
        amount: q.total,
        status: isApproved ? 'aprovado' : 'pendente',
      };
    });

    return NextResponse.json({
      success: true,
      data: payments,
    });

  } catch (error) {
    console.error('GET /api/payments error:', error);
    return NextResponse.json(
      { error: 'Erro ao listar pagamentos' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
