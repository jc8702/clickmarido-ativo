import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
  if (!validateToken(request)) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const customerId = searchParams.get('customerId');
    const groupBy = searchParams.get('groupBy') || 'customer'; // customer, service, period

    // Definir período padrão: mês atual
    let start: Date, end: Date;
    const now = new Date();

    if (startDate && endDate) {
      start = new Date(startDate);
      end = new Date(endDate);
    } else {
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    }

    // Buscar ordens de serviço concluídas no período
    const serviceOrders = await prisma.serviceOrder.findMany({
      where: {
        OR: [
          { completedAt: { gte: start, lte: end } },
          { createdAt: { gte: start, lte: end } },
        ],
        status: 'concluida',
        ...(customerId ? { customerId } : {}),
      },
      include: {
        quotation: {
          select: {
            id: true,
            total: true,
            items: {
              select: {
                quantity: true,
                unitPrice: true,
                costPrice: true,
                product: { select: { name: true, type: true } },
              },
            },
          },
        },
        customer: { select: { id: true, name: true } },
        expenses: { select: { amount: true } },
        payments: { select: { amount: true, status: true } },
      },
    });

    // Buscar faturamento do período para complementar
    const invoices = await prisma.invoice.findMany({
      where: {
        issueDate: { gte: start, lte: end },
        status: { in: ['emitida', 'paga'] },
      },
      select: {
        id: true,
        totalAmount: true,
        customerId: true,
        customer: { select: { id: true, name: true } },
        quotation: {
          select: {
            serviceOrder: {
              select: { id: true },
            },
          },
        },
      },
    });

    // Calcular rentabilidade por OS
    const profitability = serviceOrders.map(so => {
      const revenue = Number(so.quotation?.total || so.finalTotal);
      const costOfGoods = so.quotation?.items?.reduce(
        (sum, item) => sum + Number(item.costPrice || 0) * Number(item.quantity), 0
      ) || 0;
      const directExpenses = so.expenses?.reduce((sum, e) => sum + Number(e.amount), 0) || 0;
      const totalCost = costOfGoods + directExpenses;
      const grossProfit = revenue - totalCost;
      const margin = revenue > 0 ? (grossProfit / revenue) * 100 : 0;

      return {
        id: so.id,
        number: so.number,
        customer: so.customer,
        revenue,
        costOfGoods,
        directExpenses,
        totalCost,
        grossProfit,
        margin,
        completedAt: so.completedAt || so.createdAt,
      };
    });

    // Adicionar faturas que não estão vinculadas a OS concluída
    const osIds = new Set(serviceOrders.map(so => so.id));
    const standaloneInvoices = invoices.filter(inv => {
      const osId = inv.quotation?.serviceOrder?.id;
      return !osId || !osIds.has(osId);
    });

    for (const inv of standaloneInvoices) {
      profitability.push({
        id: inv.id,
        number: inv.id.slice(-6).toUpperCase(),
        customer: inv.customer,
        revenue: Number(inv.totalAmount),
        costOfGoods: 0,
        directExpenses: 0,
        totalCost: 0,
        grossProfit: Number(inv.totalAmount),
        margin: 100,
        completedAt: inv.issueDate,
      });
    }

    // Agrupar por cliente
    const byCustomer = profitability.reduce((acc, p) => {
      const key = p.customer?.id || 'unknown';
      if (!acc[key]) {
        acc[key] = {
          customer: p.customer,
          orders: 0,
          totalRevenue: 0,
          totalCost: 0,
          totalProfit: 0,
        };
      }
      acc[key].orders += 1;
      acc[key].totalRevenue += p.revenue;
      acc[key].totalCost += p.totalCost;
      acc[key].totalProfit += p.grossProfit;
      return acc;
    }, {} as Record<string, any>);

    // Converter para array e calcular margem
    const customerAnalysis = Object.values(byCustomer).map((c: any) => ({
      ...c,
      margin: c.totalRevenue > 0 ? (c.totalProfit / c.totalRevenue) * 100 : 0,
    }));

    // Identificar operações mais e menos lucrativas
    const sortedByMargin = [...profitability].sort((a, b) => b.margin - a.margin);
    const mostProfitable = sortedByMargin.slice(0, 5);
    const leastProfitable = sortedByMargin.slice(-5).reverse();

    // Resumo geral
    const totalRevenue = profitability.reduce((sum, p) => sum + p.revenue, 0);
    const totalCost = profitability.reduce((sum, p) => sum + p.totalCost, 0);
    const totalProfit = profitability.reduce((sum, p) => sum + p.grossProfit, 0);
    const averageMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

    return NextResponse.json({
      period: { start, end },
      summary: {
        totalOrders: profitability.length,
        totalRevenue,
        totalCost,
        totalProfit,
        averageMargin,
      },
      customerAnalysis,
      mostProfitable,
      leastProfitable,
      allOperations: profitability,
      invoiceCount: standaloneInvoices.length,
    });
  } catch (error) {
    console.error('Erro ao buscar rentabilidade:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
