import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateToken } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!validateToken(request)) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const { id } = await params;

    const technician = await prisma.technician.findUnique({
      where: { id },
      select: { id: true, name: true },
    });

    if (!technician) {
      return NextResponse.json({ error: 'Técnico não encontrado' }, { status: 404 });
    }

    // Buscar todas as OS do técnico
    const serviceOrders = await prisma.serviceOrder.findMany({
      where: { technicianId: id },
      select: {
        id: true,
        status: true,
        finalTotal: true,
        createdAt: true,
        completedAt: true,
        startedAt: true,
      },
    });

    // Timeline mensal — últimos 6 meses
    const now = new Date();
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

    const monthlyData: { month: string; concluidas: number; receita: number }[] = [];
    for (let i = 0; i < 6; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
      const nextMonth = new Date(d.getFullYear(), d.getMonth() + 1, 1);
      const label = d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });

      const monthOrders = serviceOrders.filter((o) => {
        const created = new Date(o.createdAt);
        return created >= d && created < nextMonth;
      });

      const completed = monthOrders.filter((o) => o.status === 'concluida');

      monthlyData.push({
        month: label.charAt(0).toUpperCase() + label.slice(1),
        concluidas: completed.length,
        receita: Math.round(completed.reduce((sum, o) => sum + Number(o.finalTotal), 0) * 100) / 100,
      });
    }

    // Estatísticas de status
    const statusCounts: Record<string, number> = {};
    serviceOrders.forEach((o) => {
      statusCounts[o.status] = (statusCounts[o.status] || 0) + 1;
    });

    // Top clientes atendidos
    const customerOrders = await prisma.serviceOrder.findMany({
      where: { technicianId: id, status: 'concluida' },
      select: {
        customer: { select: { id: true, name: true } },
        finalTotal: true,
      },
    });

    const customerMap: Record<string, { name: string; count: number; total: number }> = {};
    customerOrders.forEach((o) => {
      const cId = o.customer.id;
      if (!customerMap[cId]) {
        customerMap[cId] = { name: o.customer.name, count: 0, total: 0 };
      }
      customerMap[cId].count += 1;
      customerMap[cId].total += Number(o.finalTotal);
    });

    const topCustomers = Object.entries(customerMap)
      .map(([id, data]) => ({ id, ...data, total: Math.round(data.total * 100) / 100 }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return NextResponse.json({
      technicianId: id,
      technicianName: technician.name,
      monthlyTimeline: monthlyData,
      statusBreakdown: statusCounts,
      topCustomers,
      summary: {
        totalOrders: serviceOrders.length,
        completed: serviceOrders.filter((o) => o.status === 'concluida').length,
        inProgress: serviceOrders.filter((o) => o.status === 'em_execucao').length,
        scheduled: serviceOrders.filter((o) => o.status === 'agendada').length,
      },
    });
  } catch (error) {
    console.error('GET /api/technicians/[id]/performance error:', error);
    return NextResponse.json({ error: 'Erro ao buscar performance' }, { status: 500 });
  }
}
