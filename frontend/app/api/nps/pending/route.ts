import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    if (!validateToken(request)) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Encontrar ordens de serviço concluídas nos últimos 30 dias
    const recentOrders = await prisma.serviceOrder.findMany({
      where: {
        status: 'concluida',
        completedAt: {
          gte: thirtyDaysAgo,
        },
      },
      include: {
        customer: {
          include: {
            nps: {
              where: {
                createdAt: {
                  gte: thirtyDaysAgo,
                },
              },
            },
          },
        },
        technician: true,
      },
      orderBy: {
        completedAt: 'desc',
      },
    });

    // Filtrar clientes que NÃO responderam/receberam NPS recentemente
    const pendingCustomersMap = new Map();

    for (const order of recentOrders) {
      if (!order.customer) continue;
      
      // Se o cliente já tem um NPS nos últimos 30 dias, ignorar
      if (order.customer.nps && order.customer.nps.length > 0) {
        continue;
      }

      // Evitar duplicidade de cliente na lista (pega a mais recente)
      if (!pendingCustomersMap.has(order.customerId)) {
        pendingCustomersMap.set(order.customerId, {
          paymentId: order.id, // Manteve nome para compatibilidade com o hook atual
          customerId: order.customer.id,
          customerName: order.customer.name,
          customerPhone: order.customer.phone,
          paymentAmount: Number(order.totalValue), // Manteve nome
          paymentDate: order.completedAt, // Manteve nome
          osId: order.id,
          technicianId: order.technicianId
        });
      }
    }

    const pendingSurveys = Array.from(pendingCustomersMap.values());

    return NextResponse.json({
      success: true,
      data: pendingSurveys,
    });
  } catch (error) {
    console.error('GET /api/nps/pending error:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar pendências de NPS' },
      { status: 500 }
    );
  }
}
