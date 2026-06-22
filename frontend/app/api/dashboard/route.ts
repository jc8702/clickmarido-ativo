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

    // 1. Total de Clientes
    const customersTotal = await prisma.customer.count();

    // 2. Todos os Orçamentos
    const allQuotations = await prisma.quotation.findMany({
      include: {
        customer: true,
        items: {
          include: { product: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // 3. Datas para filtro mensal
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // 4. Receita este mês (orçamentos aceitos/aprovados criados este mês)
    const receivedThisMonth = allQuotations
      .filter(q => 
        (q.status === 'aceito' || q.status === 'aprovado') && 
        new Date(q.createdAt) >= startOfMonth
      )
      .reduce((sum, q) => sum + q.total, 0);

    // 5. Faturamento Pendente (orçamentos enviados/pendentes)
    const pendingAmount = allQuotations
      .filter(q => q.status === 'enviado' || q.status === 'pendente')
      .reduce((sum, q) => sum + q.total, 0);

    // 6. Ordens / Serviços Em Progresso (orçamentos enviados ou pendentes)
    const ordersInProgress = allQuotations.filter(
      q => q.status === 'enviado' || q.status === 'pendente'
    ).length;

    // 7. Taxa de Conversão ((Aceitos / Total) * 100)
    const totalQuotations = allQuotations.length;
    const approvedQuotations = allQuotations.filter(
      q => q.status === 'aceito' || q.status === 'aprovado'
    ).length;
    const conversionRate = totalQuotations > 0 
      ? Math.round((approvedQuotations / totalQuotations) * 100) 
      : 0;

    // 8. Últimas Ordens (Mapeando os últimos 5 orçamentos para o formato do dashboard)
    const lastOrders = allQuotations.slice(0, 5).map(q => {
      // Mapear status do orçamento para status do serviço/ordem
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
        amount: q.total,
        status: serviceStatus,
      };
    });

    // 9. Top Serviços mais requisitados (Agregando itens dos orçamentos)
    const serviceCounts: Record<string, number> = {};
    allQuotations.forEach(q => {
      if (q.items && Array.isArray(q.items)) {
        q.items.forEach((item: any) => {
          const name = item.product?.name || item.name;
          if (name) {
            serviceCounts[name.trim()] = (serviceCounts[name.trim()] || 0) + (item.quantity || 1);
          }
        });
      }
    });

    const aggregatedServices = Object.entries(serviceCounts).map(([name, count]) => ({
      name,
      count,
    }));

    // Ordena de forma decrescente por quantidade de pedidos
    aggregatedServices.sort((a, b) => b.count - a.count);

    // Mocks padrão caso não haja serviços cadastrados, para manter a fidelidade visual
    const defaultServices = [
      { name: 'Manutenção Elétrica', count: 12 },
      { name: 'Instalação de Ar Cond.', count: 8 },
      { name: 'Reparo Hidráulico', count: 5 },
    ];

    const topServices = aggregatedServices.length > 0 
      ? aggregatedServices.slice(0, 5) 
      : defaultServices;

    return NextResponse.json({
      success: true,
      data: {
        receivedThisMonth,
        pendingAmount,
        ordersInProgress,
        conversionRate,
        customersTotal,
        lastOrders,
        topServices,
      },
    });

  } catch (error) {
    console.error('GET /api/dashboard error:', error);
    return NextResponse.json(
      { error: 'Erro ao carregar dados do dashboard' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
