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

    // Encontrar pagamentos confirmados nos últimos 30 dias
    const recentPayments = await prisma.payment.findMany({
      where: {
        status: 'confirmado',
        confirmedAt: {
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
      },
      orderBy: {
        confirmedAt: 'desc',
      },
    });

    // Filtrar clientes que NÃO responderam/receberam NPS recentemente
    const pendingCustomersMap = new Map();

    for (const payment of recentPayments) {
      if (!payment.customer) continue;
      
      // Se o cliente já tem um NPS nos últimos 30 dias, ignorar
      if (payment.customer.nps && payment.customer.nps.length > 0) {
        continue;
      }

      // Evitar duplicidade de cliente na lista
      if (!pendingCustomersMap.has(payment.customerId)) {
        pendingCustomersMap.set(payment.customerId, {
          paymentId: payment.id,
          customerId: payment.customer.id,
          customerName: payment.customer.name,
          customerPhone: payment.customer.phone,
          paymentAmount: Number(payment.amount),
          paymentDate: payment.confirmedAt,
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
