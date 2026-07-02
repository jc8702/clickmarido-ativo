import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateToken } from '@/lib/auth';

// Campos permitidos para atualização (proteção contra mass-assignment)
const ALLOWED_FIELDS = [
  'name', 'email', 'phone', 'specialty', 'active', 'document',
  'address', 'avatarUrl', 'bio', 'hourlyRate', 'hireDate',
];

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
      include: {
        reviews: {
          include: {
            customer: { select: { id: true, name: true } },
            serviceOrder: { select: { id: true, number: true } },
          },
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
        serviceOrders: {
          select: {
            id: true,
            number: true,
            status: true,
            finalTotal: true,
            scheduledTime: true,
            startedAt: true,
            completedAt: true,
            createdAt: true,
            customer: { select: { id: true, name: true } },
          },
          orderBy: { createdAt: 'desc' },
          take: 50,
        },
        appointments: {
          where: {
            date: { gte: new Date() },
          },
          include: {
            customer: { select: { id: true, name: true, phone: true } },
            serviceOrder: { select: { id: true, number: true } },
          },
          orderBy: { date: 'asc' },
          take: 10,
        },
        _count: {
          select: {
            serviceOrders: true,
            appointments: true,
            reviews: true,
          },
        },
      },
    });

    if (!technician) {
      return NextResponse.json({ error: 'Técnico não encontrado' }, { status: 404 });
    }

    // Calcular estatísticas
    const avgRating =
      technician.reviews.length > 0
        ? Math.round(
            (technician.reviews.reduce((sum, r) => sum + r.rating, 0) / technician.reviews.length) * 10
          ) / 10
        : null;

    const ratingDistribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    technician.reviews.forEach((r) => {
      ratingDistribution[r.rating] = (ratingDistribution[r.rating] || 0) + 1;
    });

    const completedOrders = technician.serviceOrders.filter((o) => o.status === 'concluida');
    const totalRevenue = completedOrders.reduce((sum, o) => sum + Number(o.finalTotal), 0);
    const avgTicket = completedOrders.length > 0 ? totalRevenue / completedOrders.length : 0;

    // Tempo médio de conclusão (dias)
    const completionTimes = completedOrders
      .filter((o) => o.startedAt && o.completedAt)
      .map((o) => {
        const start = new Date(o.startedAt!).getTime();
        const end = new Date(o.completedAt!).getTime();
        return (end - start) / (1000 * 60 * 60 * 24);
      });
    const avgCompletionDays =
      completionTimes.length > 0
        ? Math.round((completionTimes.reduce((a, b) => a + b, 0) / completionTimes.length) * 10) / 10
        : null;

    return NextResponse.json({
      ...technician,
      hourlyRate: technician.hourlyRate ? Number(technician.hourlyRate) : null,
      serviceOrders: technician.serviceOrders.map((o) => ({
        ...o,
        finalTotal: Number(o.finalTotal),
      })),
      stats: {
        avgRating,
        ratingDistribution,
        totalOrders: technician._count.serviceOrders,
        completedOrders: completedOrders.length,
        inProgressOrders: technician.serviceOrders.filter((o) => o.status === 'em_execucao').length,
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        avgTicket: Math.round(avgTicket * 100) / 100,
        avgCompletionDays,
        totalReviews: technician._count.reviews,
        upcomingAppointments: technician.appointments.length,
      },
    });
  } catch (error) {
    console.error('GET /api/technicians/[id] error:', error);
    return NextResponse.json({ error: 'Erro ao buscar técnico' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!validateToken(request)) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    // Whitelist de campos
    const data: any = {};
    for (const key of ALLOWED_FIELDS) {
      if (body[key] !== undefined) {
        if (key === 'hourlyRate') {
          data[key] = body[key] !== null && body[key] !== '' ? parseFloat(body[key]) : null;
        } else if (key === 'hireDate') {
          data[key] = body[key] ? new Date(body[key]) : null;
        } else {
          data[key] = body[key];
        }
      }
    }

    if (data.name !== undefined && !data.name) {
      return NextResponse.json({ error: 'Nome é obrigatório' }, { status: 400 });
    }

    const technician = await prisma.technician.update({
      where: { id },
      data,
    });

    return NextResponse.json({ success: true, data: technician });
  } catch (error: any) {
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Técnico não encontrado' }, { status: 404 });
    }
    console.error('PUT /api/technicians/[id] error:', error);
    return NextResponse.json({ error: 'Erro ao atualizar técnico' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!validateToken(request)) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const { id } = await params;

    // Soft delete — apenas desativa
    const technician = await prisma.technician.update({
      where: { id },
      data: { active: false },
    });

    return NextResponse.json({ success: true, data: technician });
  } catch (error: any) {
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Técnico não encontrado' }, { status: 404 });
    }
    console.error('DELETE /api/technicians/[id] error:', error);
    return NextResponse.json({ error: 'Erro ao desativar técnico' }, { status: 500 });
  }
}
