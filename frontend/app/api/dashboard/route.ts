import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import * as jwt from 'jsonwebtoken';
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

export async function GET(request: NextRequest) {
  try {
    if (!validateToken(request)) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // 1. Clientes Totais
    const customersTotal = await prisma.customer.count();

    // 2. Faturamento Real Recebido este mês (da tabela de Pagamentos confirmados)
    const paymentsThisMonth = await prisma.payment.aggregate({
      where: {
        status: 'confirmado',
        createdAt: { gte: startOfMonth }
      },
      _sum: { amount: true }
    });
    const receivedThisMonth = paymentsThisMonth._sum.amount || 0;

    // 3. Faturamento Pendente (da tabela de Pagamentos pendentes)
    const paymentsPending = await prisma.payment.aggregate({
      where: {
        status: 'pendente'
      },
      _sum: { amount: true }
    });
    const pendingAmount = paymentsPending._sum.amount || 0;

    // 4. Ordens / Serviços Em Progresso (agendadas e em progresso)
    const ordersInProgress = await prisma.serviceOrder.count({
      where: {
        status: { in: ['agendada', 'em_progresso'] }
      }
    });

    // 5. Técnicos disponíveis ativos
    const availableTechnicians = await prisma.technician.count({
      where: { active: true }
    });

    // 6. Taxa de Conversão de Orçamentos ((Aprovados / Total) * 100)
    const totalQuotations = await prisma.quotation.count();
    const approvedQuotations = await prisma.quotation.count({
      where: {
        status: { in: ['aceito', 'aprovado'] }
      }
    });
    const conversionRate = totalQuotations > 0 
      ? Math.round((approvedQuotations / totalQuotations) * 100) 
      : 0;

    // 7. Últimas 5 Ordens de Serviço reais
    const lastOrdersDb = await prisma.serviceOrder.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: { customer: true }
    });
    const lastOrders = lastOrdersDb.map(so => ({
      id: so.id,
      customer_name: so.customer?.name || 'Cliente',
      amount: so.finalTotal,
      status: so.status,
    }));

    // 8. Histórico de faturamento semanal (últimas 8 semanas)
    const eightWeeksAgo = new Date(now.getTime() - 56 * 24 * 60 * 60 * 1000);
    const recentPayments = await prisma.payment.findMany({
      where: {
        status: 'confirmado',
        createdAt: { gte: eightWeeksAgo }
      },
      select: { amount: true, createdAt: true }
    });

    const revenueHistory = [];
    for (let i = 7; i >= 0; i--) {
      const start = new Date(now.getTime() - (i + 1) * 7 * 24 * 60 * 60 * 1000);
      const end = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000);
      
      const sum = recentPayments
        .filter(p => p.createdAt >= start && p.createdAt < end)
        .reduce((acc, p) => acc + Number(p.amount), 0);

      const label = `${start.getDate().toString().padStart(2, '0')}/${(start.getMonth() + 1).toString().padStart(2, '0')}`;
      revenueHistory.push({ name: label, receita: sum });
    }

    // 9. Distribuição de Serviços por Categoria (receita de serviços por categoria nos últimos 6 meses)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const approvedQuotationsWithItems = await prisma.quotation.findMany({
      where: {
        status: { in: ['aceito', 'aprovado'] },
        createdAt: { gte: sixMonthsAgo }
      },
      include: {
        items: {
          include: { product: true }
        }
      }
    });

    const categoryRevenue: Record<string, number> = {};
    const serviceCounts: Record<string, number> = {};

    approvedQuotationsWithItems.forEach(q => {
      if (q.items && Array.isArray(q.items)) {
        q.items.forEach((item) => {
          if (item.product?.type === 'SERVICO') {
            const cat = item.product.category || 'Geral';
            const value = Number(item.quantity) * Number(item.unitPrice);
            categoryRevenue[cat] = (categoryRevenue[cat] || 0) + value;

            const name = item.product.name || 'Serviço';
            serviceCounts[name.trim()] = (serviceCounts[name.trim()] || 0) + Number(item.quantity);
          }
        });
      }
    });

    const servicesDistribution = Object.entries(categoryRevenue).map(([name, value]) => ({
      name,
      value: Number(value.toFixed(2))
    }));

    const topServices = Object.entries(serviceCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // 10. Performance do Técnico (receita de OS concluídas agrupadas por técnico)
    const completedOrders = await prisma.serviceOrder.findMany({
      where: { status: 'concluida' },
      include: { technician: true }
    });

    const techRevenue: Record<string, number> = {};
    completedOrders.forEach(order => {
      const techName = order.technician?.name || 'Sem Técnico';
      techRevenue[techName] = (techRevenue[techName] || 0) + Number(order.finalTotal);
    });

    const technicianPerformance = Object.entries(techRevenue).map(([name, valor]) => ({
      name,
      valor: Number(valor.toFixed(2))
    }));

    // 11. Distribuição de Ordens por Status
    const ordersStatusDb = await prisma.serviceOrder.groupBy({
      by: ['status'],
      _count: { id: true }
    });

    const ordersStatusDistribution = ordersStatusDb.map(item => ({
      status: item.status,
      count: item._count.id
    }));

    return NextResponse.json({
      success: true,
      data: {
        receivedThisMonth,
        pendingAmount,
        ordersInProgress,
        conversionRate,
        customersTotal,
        availableTechnicians,
        lastOrders,
        topServices,
        revenueHistory,
        servicesDistribution,
        technicianPerformance,
        ordersStatusDistribution
      },
    });

  } catch (error) {
    console.error('GET /api/dashboard error:', error);
    return NextResponse.json(
      { error: 'Erro ao carregar dados do dashboard' },
      { status: 500 }
    );
}
}