import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import * as jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;

function validateToken(request: NextRequest) {
  if (!JWT_SECRET) return null;
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

// GET /api/purchase-orders/history - Log de eventos global do módulo de compras
export async function GET(request: NextRequest) {
  try {
    if (!validateToken(request)) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '30');
    const purchaseOrderId = searchParams.get('purchaseOrderId');
    const type = searchParams.get('type');
    const skip = (page - 1) * limit;

    const where: any = {};
    if (purchaseOrderId) where.purchaseOrderId = purchaseOrderId;
    if (type) where.type = type;

    const [events, total] = await Promise.all([
      prisma.purchaseOrderEvent.findMany({
        where,
        include: {
          purchaseOrder: {
            select: { id: true, number: true, status: true, vendor: { select: { name: true } } },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.purchaseOrderEvent.count({ where }),
    ]);

    return NextResponse.json({
      data: events,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('GET /api/purchase-orders/history error:', error);
    return NextResponse.json({ error: 'Erro ao listar histórico de compras' }, { status: 500 });
  }
}
