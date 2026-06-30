import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateToken } from '@/lib/auth';
import { LeadEventType, AppointmentStatus } from '@prisma/client';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const decoded = validateToken(request);
    if (!decoded) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const { id: leadId } = await params;
    const body = await request.json();
    const { scheduledAt, notes } = body;

    if (!scheduledAt) {
      return NextResponse.json({ error: 'Data de agendamento é obrigatória' }, { status: 400 });
    }

    const scheduledDate = new Date(scheduledAt);
    if (isNaN(scheduledDate.getTime())) {
      return NextResponse.json({ error: 'Data de agendamento inválida' }, { status: 400 });
    }

    // 1. Verificar se o lead existe
    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
    });

    if (!lead) {
      return NextResponse.json({ error: 'Lead não encontrado' }, { status: 404 });
    }

    // 2. Criar o agendamento
    const appointment = await prisma.leadAppointment.create({
      data: {
        leadId,
        scheduledAt: scheduledDate,
        status: AppointmentStatus.AGENDADO,
        notes: notes?.trim() || null,
      },
    });

    // 3. Registrar o evento de histórico
    await prisma.leadEvent.create({
      data: {
        leadId,
        type: LeadEventType.APPOINTMENT_SCHEDULED,
        newValue: scheduledDate.toISOString(),
        userId: decoded.userId,
        notes: `Reunião comercial agendada para o dia ${scheduledDate.toLocaleDateString('pt-BR')} às ${scheduledDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}. Obs: ${notes || 'Sem observações'}`,
      },
    });

    // 4. Atualizar o timestamp de alteração do lead
    await prisma.lead.update({
      where: { id: leadId },
      data: { updatedAt: new Date() },
    });

    return NextResponse.json(appointment);
  } catch (error) {
    console.error('Error creating lead appointment:', error);
    return NextResponse.json({ error: 'Erro ao criar agendamento' }, { status: 500 });
  }
}
