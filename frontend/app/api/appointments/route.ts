import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // Autenticação obrigatória
    const auth = await verifyAuth(request);
    if (!auth.success) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const technicianId = searchParams.get('technicianId');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const where: any = {};

    if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    if (technicianId) {
      where.technicianId = technicianId;
    }

    if (status) {
      where.status = status;
    }

    const [appointments, total] = await Promise.all([
      prisma.appointment.findMany({
        where,
        include: {
          serviceOrder: {
            select: {
              id: true,
              number: true,
              status: true,
            },
          },
          technician: {
            select: {
              id: true,
              name: true,
              specialty: true,
            },
          },
          customer: {
            select: {
              id: true,
              name: true,
              phone: true,
            },
          },
        },
        orderBy: { date: 'asc' },
        take: limit,
        skip: offset,
      }),
      prisma.appointment.count({ where }),
    ]);

    return NextResponse.json({
      data: appointments,
      total,
      page: Math.floor(offset / limit) + 1,
      pageSize: limit,
    });
  } catch (error) {
    console.error('Error fetching appointments:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar agendamentos' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Autenticação obrigatória
    const auth = await verifyAuth(request);
    if (!auth.success) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { serviceOrderId, technicianId, customerId, date, duration, location, notes } = body;

    // Validar dados obrigatórios
    if (!serviceOrderId || !technicianId || !customerId || !date || !duration || !location) {
      return NextResponse.json(
        { error: 'Dados obrigatórios não fornecidos' },
        { status: 400 }
      );
    }

    // Verificar se o técnico já tem agendamento no mesmo horário
    const appointmentDate = new Date(date);
    const endDate = new Date(appointmentDate.getTime() + duration * 60000);

    const conflictingAppointment = await prisma.appointment.findFirst({
      where: {
        technicianId,
        date: {
          lt: endDate,
        },
        status: {
          notIn: ['cancelada', 'nao_compareceu'],
        },
      },
    });

    if (conflictingAppointment) {
      return NextResponse.json(
        { error: 'Técnico já possui agendamento neste horário' },
        { status: 400 }
      );
    }

    const appointment = await prisma.appointment.create({
      data: {
        serviceOrderId,
        technicianId,
        customerId,
        date: appointmentDate,
        duration,
        location,
        notes,
        status: 'agendada',
      },
      include: {
        serviceOrder: true,
        technician: true,
        customer: true,
      },
    });

    return NextResponse.json(appointment, { status: 201 });
  } catch (error) {
    console.error('Error creating appointment:', error);
    return NextResponse.json(
      { error: 'Erro ao criar agendamento' },
      { status: 500 }
    );
  }
}
