import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateToken } from '@/lib/auth';
import { APPOINTMENT_ALLOWED_FIELDS } from '@/lib/status-map';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!validateToken(request)) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const { id } = await params;

    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: {
        serviceOrder: {
          select: {
            id: true,
            number: true,
            status: true,
            finalTotal: true,
          },
        },
        technician: {
          select: {
            id: true,
            name: true,
            specialty: true,
            phone: true,
          },
        },
        customer: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
          },
        },
      },
    });

    if (!appointment) {
      return NextResponse.json(
        { error: 'Agendamento não encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json(appointment);
  } catch (error) {
    console.error('Error fetching appointment:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar agendamento' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!validateToken(request)) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    const appointment = await prisma.appointment.findUnique({
      where: { id },
    });

    if (!appointment) {
      return NextResponse.json(
        { error: 'Agendamento não encontrado' },
        { status: 404 }
      );
    }

    // Verificar se o agendamento pode ser atualizado
    if (['concluida', 'cancelada', 'nao_compareceu'].includes(appointment.status)) {
      return NextResponse.json(
        { error: 'Agendamento não pode ser atualizado' },
        { status: 400 }
      );
    }

    // Anti mass-assignment: aceitar apenas campos permitidos
    const safeData: Record<string, unknown> = {};
    for (const field of APPOINTMENT_ALLOWED_FIELDS) {
      if (body[field] !== undefined) {
        safeData[field] = body[field];
      }
    }

    if (Object.keys(safeData).length === 0) {
      return NextResponse.json(
        { error: 'Nenhum campo válido para atualizar' },
        { status: 400 }
      );
    }

    const updatedAppointment = await prisma.appointment.update({
      where: { id },
      data: safeData,
      include: {
        serviceOrder: true,
        technician: true,
        customer: true,
      },
    });

    return NextResponse.json(updatedAppointment);
  } catch (error) {
    console.error('Error updating appointment:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar agendamento' },
      { status: 500 }
    );
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

    const appointment = await prisma.appointment.findUnique({
      where: { id },
    });

    if (!appointment) {
      return NextResponse.json(
        { error: 'Agendamento não encontrado' },
        { status: 404 }
      );
    }

    // Verificar se o agendamento pode ser cancelado
    if (['concluida', 'cancelada', 'nao_compareceu'].includes(appointment.status)) {
      return NextResponse.json(
        { error: 'Agendamento não pode ser cancelado' },
        { status: 400 }
      );
    }

    const cancelledAppointment = await prisma.appointment.update({
      where: { id },
      data: { status: 'cancelada' },
    });

    return NextResponse.json(cancelledAppointment);
  } catch (error) {
    console.error('Error cancelling appointment:', error);
    return NextResponse.json(
      { error: 'Erro ao cancelar agendamento' },
      { status: 500 }
    );
  }
}

