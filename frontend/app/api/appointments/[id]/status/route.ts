import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateToken } from '@/lib/auth';

// Transições válidas de status
const validTransitions: Record<string, string[]> = {
  agendada: ['confirmada', 'cancelada'],
  confirmada: ['em_andamento', 'cancelada'],
  em_andamento: ['concluida', 'nao_compareceu'],
  concluida: [],
  cancelada: [],
  nao_compareceu: [],
};

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
    const { status } = body;

    if (!status) {
      return NextResponse.json(
        { error: 'Status é obrigatório' },
        { status: 400 }
      );
    }

    const appointment = await prisma.appointment.findUnique({
      where: { id },
    });

    if (!appointment) {
      return NextResponse.json(
        { error: 'Agendamento não encontrado' },
        { status: 404 }
      );
    }

    // Verificar se a transição é válida
    const allowedTransitions = validTransitions[appointment.status] || [];
    if (!allowedTransitions.includes(status)) {
      return NextResponse.json(
        { error: `Transição de status inválida: ${appointment.status} → ${status}` },
        { status: 400 }
      );
    }

    // Dados para atualização
    const updateData: any = { status };

    // Adicionar timestamps baseado no status
    if (status === 'em_andamento') {
      updateData.startedAt = new Date();
    } else if (status === 'concluida') {
      updateData.completedAt = new Date();
    }

    const updatedAppointment = await prisma.appointment.update({
      where: { id },
      data: updateData,
      include: {
        serviceOrder: true,
        technician: true,
        customer: true,
      },
    });

    return NextResponse.json(updatedAppointment);
  } catch (error) {
    console.error('Error updating appointment status:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar status do agendamento' },
      { status: 500 }
    );
  }
}
