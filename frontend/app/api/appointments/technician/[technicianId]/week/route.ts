import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateToken } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ technicianId: string }> }
) {
  try {
    if (!validateToken(request)) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const { technicianId } = await params;
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: 'Datas de início e fim são obrigatórias' },
        { status: 400 }
      );
    }

    const technician = await prisma.technician.findUnique({
      where: { id: technicianId },
      select: { id: true, name: true },
    });

    if (!technician) {
      return NextResponse.json(
        { error: 'Técnico não encontrado' },
        { status: 404 }
      );
    }

    const appointments = await prisma.appointment.findMany({
      where: {
        technicianId,
        date: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
        status: {
          notIn: ['cancelada', 'nao_compareceu'],
        },
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
        serviceOrder: {
          select: {
            id: true,
            number: true,
            status: true,
          },
        },
      },
      orderBy: { date: 'asc' },
    });

    return NextResponse.json({
      technicianId,
      technicianName: technician.name,
      week: {
        startDate,
        endDate,
        appointments: appointments.map((apt) => ({
          id: apt.id,
          date: apt.date,
          duration: apt.duration,
          status: apt.status,
          location: apt.location,
          notes: apt.notes,
          customerName: apt.customer.name,
          customerPhone: apt.customer.phone,
          serviceOrderNumber: apt.serviceOrder.number,
          serviceOrderStatus: apt.serviceOrder.status,
        })),
      },
    });
  } catch (error) {
    console.error('Error fetching technician week:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar agenda do técnico' },
      { status: 500 }
    );
  }
}
