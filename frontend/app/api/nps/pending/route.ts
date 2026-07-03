import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    if (!validateToken(request)) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    // --- AUTOCORREÇÃO E SANEAMENTO DO BANCO DE DADOS ---
    // 1. Garantir que todas as OSs marcadas como concluídas tenham o completedAt preenchido (usa a data do updatedAt se null)
    const nullCompletedAtOS = await prisma.serviceOrder.findMany({
      where: {
        status: 'concluida',
        completedAt: null
      },
      select: { id: true, updatedAt: true }
    });

    for (const os of nullCompletedAtOS) {
      await prisma.serviceOrder.update({
        where: { id: os.id },
        data: { completedAt: os.updatedAt || new Date() }
      });
    }

    // 2. Garantir que qualquer OS vinculada a orçamento pago esteja marcada como concluída e com data de conclusão
    const confirmedPayments = await prisma.payment.findMany({
      where: {
        status: 'confirmado',
        quotationId: { not: null }
      },
      select: { quotationId: true, confirmedAt: true }
    });

    const quotationIds = confirmedPayments
      .map(p => p.quotationId)
      .filter((id): id is string => id !== null);

    if (quotationIds.length > 0) {
      const pendingOS = await prisma.serviceOrder.findMany({
        where: {
          quotationId: { in: quotationIds },
          status: { in: ['agendada', 'em_andamento'] }
        },
        select: { id: true }
      });

      for (const os of pendingOS) {
        await prisma.serviceOrder.update({
          where: { id: os.id },
          data: {
            status: 'concluida',
            completedAt: new Date()
          }
        });
      }
    }
    // ----------------------------------------------------

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
