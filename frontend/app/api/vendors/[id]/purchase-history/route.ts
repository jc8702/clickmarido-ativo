import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prisma';
import { validateToken } from '@/lib/auth';

type RouteParams = { params: Promise<{ id: string }> };

// GET /api/vendors/[id]/purchase-history - Obter histórico de compras do fornecedor
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  try {
    if (!validateToken(request)) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    const vendorExists = await prisma.vendor.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!vendorExists) {
      return NextResponse.json({ error: 'Fornecedor não encontrado' }, { status: 404 });
    }

    // Buscar pedidos e calcular estatísticas básicas
    const [purchaseOrders, totalCount, aggregations] = await Promise.all([
      prisma.purchaseOrder.findMany({
        where: { vendorId: id },
        orderBy: { issueDate: 'desc' },
        skip,
        take: limit,
      }),
      prisma.purchaseOrder.count({
        where: { vendorId: id },
      }),
      prisma.purchaseOrder.aggregate({
        where: { vendorId: id },
        _sum: {
          totalAmount: true,
        },
        _count: {
          id: true,
        },
      }),
    ]);

    return NextResponse.json({
      data: purchaseOrders,
      meta: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
      stats: {
        totalSpent: aggregations._sum.totalAmount || 0,
        ordersCount: aggregations._count.id || 0,
      },
    });
  } catch (error) {
    console.error('GET /api/vendors/[id]/purchase-history error:', error);
    return NextResponse.json({ error: 'Erro ao processar histórico de compras' }, { status: 500 });
  }
}
