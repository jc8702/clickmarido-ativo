import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateToken } from '@/lib/auth';
import { LeadEventType, AppointmentStatus } from '@prisma/client';
import { createCalendarEvent, updateCalendarEvent, deleteCalendarEvent } from '@/lib/google-calendar';

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
    const { scheduledAt, notes, technicianId } = body;

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

    // 2. Buscar técnico se fornecido
    let technicianName = '';
    let technicianEmail = '';
    if (technicianId) {
      const technician = await prisma.technician.findUnique({
        where: { id: technicianId },
      });
      if (technician) {
        technicianName = technician.name;
        technicianEmail = technician.email;
      }
    }

    // 3. Criar o agendamento no banco
    const appointment = await prisma.leadAppointment.create({
      data: {
        leadId,
        scheduledAt: scheduledDate,
        status: AppointmentStatus.AGENDADO,
        notes: notes?.trim() || null,
        technicianId: technicianId || null,
      },
    });

    // 4. Integrar com o Google Calendar
    let googleEventId: string | null = null;
    let calendarErrorMsg = '';
    try {
      const endDateTime = new Date(scheduledDate.getTime() + 60 * 60 * 1000); // +1 hora por padrão
      const descriptionParts = [
        `Cliente/Lead: ${lead.name}`,
        lead.phone ? `Telefone: ${lead.phone}` : null,
        lead.email ? `E-mail: ${lead.email}` : null,
        technicianName ? `Técnico Responsável: ${technicianName}` : null,
        notes ? `Observações: ${notes}` : null,
      ].filter(Boolean);

      const attendees = [];
      if (technicianEmail && technicianEmail.includes('@')) {
        attendees.push({ email: technicianEmail });
      }

      const calResult = await createCalendarEvent({
        summary: `Visita Técnica (Click Marido) - Lead: ${lead.name}`,
        description: descriptionParts.join('\n'),
        startDateTime: scheduledDate,
        endDateTime,
        attendees,
      });

      if (calResult.success && calResult.eventId) {
        googleEventId = calResult.eventId;
        // Salva o googleEventId no agendamento
        await prisma.leadAppointment.update({
          where: { id: appointment.id },
          data: { googleEventId },
        });
        appointment.googleEventId = googleEventId;
      } else {
        calendarErrorMsg = calResult.error || 'Erro ao criar evento no Calendar';
      }
    } catch (calErr: any) {
      console.error('[Google Calendar] Falha na integração ao criar evento:', calErr);
      calendarErrorMsg = calErr.message || 'Erro inesperado na integração';
    }

    // 5. Registrar o evento de histórico
    const techText = technicianName ? `com o técnico ${technicianName}` : 'sem técnico atribuído';
    const calText = googleEventId 
      ? ' (Integrado ao Google Agenda)' 
      : ` (Falha ao sincronizar com Google Agenda: ${calendarErrorMsg || 'credenciais inválidas'})`;
      
    await prisma.leadEvent.create({
      data: {
        leadId,
        type: LeadEventType.APPOINTMENT_SCHEDULED,
        newValue: scheduledDate.toISOString(),
        userId: decoded.userId,
        notes: `Reunião comercial/visita agendada para ${scheduledDate.toLocaleDateString('pt-BR')} às ${scheduledDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} ${techText}.${calText} Obs: ${notes || 'Sem observações'}`,
      },
    });

    // 6. Atualizar o timestamp de alteração do lead
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

export async function PUT(
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
    const { appointmentId, scheduledAt, notes, technicianId } = body;

    // 1. Verificar se o lead existe
    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
    });

    if (!lead) {
      return NextResponse.json({ error: 'Lead não encontrado' }, { status: 404 });
    }

    // 2. Localizar o agendamento a ser atualizado
    let appointment;
    if (appointmentId) {
      appointment = await prisma.leadAppointment.findFirst({
        where: { id: appointmentId, leadId },
      });
    } else {
      // Pega o agendamento ativo (AGENDADO) mais recente
      appointment = await prisma.leadAppointment.findFirst({
        where: { leadId, status: AppointmentStatus.AGENDADO },
        orderBy: { createdAt: 'desc' },
      });
    }

    if (!appointment) {
      return NextResponse.json({ error: 'Nenhum agendamento ativo encontrado para atualizar' }, { status: 404 });
    }

    const scheduledDate = scheduledAt ? new Date(scheduledAt) : appointment.scheduledAt;
    if (scheduledAt && isNaN(scheduledDate.getTime())) {
      return NextResponse.json({ error: 'Data de agendamento inválida' }, { status: 400 });
    }

    // 3. Buscar técnico se fornecido
    let technicianName = '';
    let technicianEmail = '';
    const activeTechId = technicianId !== undefined ? technicianId : appointment.technicianId;
    if (activeTechId) {
      const technician = await prisma.technician.findUnique({
        where: { id: activeTechId },
      });
      if (technician) {
        technicianName = technician.name;
        technicianEmail = technician.email;
      }
    }

    // 4. Atualizar no banco de dados
    const updatedAppointment = await prisma.leadAppointment.update({
      where: { id: appointment.id },
      data: {
        scheduledAt: scheduledDate,
        notes: notes !== undefined ? (notes?.trim() || null) : appointment.notes,
        technicianId: activeTechId || null,
      },
    });

    // 5. Atualizar no Google Calendar
    let googleEventId = updatedAppointment.googleEventId;
    let calendarErrorMsg = '';
    try {
      const endDateTime = new Date(scheduledDate.getTime() + 60 * 60 * 1000); // +1 hora
      const descriptionParts = [
        `Cliente/Lead: ${lead.name}`,
        lead.phone ? `Telefone: ${lead.phone}` : null,
        lead.email ? `E-mail: ${lead.email}` : null,
        technicianName ? `Técnico Responsável: ${technicianName}` : null,
        notes !== undefined ? (notes ? `Observações: ${notes}` : null) : (appointment.notes ? `Observações: ${appointment.notes}` : null),
      ].filter(Boolean);

      const attendees = [];
      if (technicianEmail && technicianEmail.includes('@')) {
        attendees.push({ email: technicianEmail });
      }

      const eventData = {
        summary: `Visita Técnica (Click Marido) - Lead: ${lead.name}`,
        description: descriptionParts.join('\n'),
        startDateTime: scheduledDate,
        endDateTime,
        attendees,
      };

      if (googleEventId) {
        const calResult = await updateCalendarEvent(googleEventId, eventData);
        if (!calResult.success) {
          calendarErrorMsg = calResult.error || 'Erro ao atualizar evento no Calendar';
        }
      } else {
        const calResult = await createCalendarEvent(eventData);
        if (calResult.success && calResult.eventId) {
          googleEventId = calResult.eventId;
          await prisma.leadAppointment.update({
            where: { id: updatedAppointment.id },
            data: { googleEventId },
          });
          updatedAppointment.googleEventId = googleEventId;
        } else {
          calendarErrorMsg = calResult.error || 'Erro ao criar evento no Calendar';
        }
      }
    } catch (calErr: any) {
      console.error('[Google Calendar] Falha na integração ao atualizar evento:', calErr);
      calendarErrorMsg = calErr.message || 'Erro inesperado na atualização';
    }

    // 6. Registrar evento de histórico do lead
    const techText = technicianName ? `com o técnico ${technicianName}` : 'sem técnico atribuído';
    const calText = googleEventId 
      ? ' (Sincronizado no Google Agenda)' 
      : ` (Falha ao sincronizar com Google Agenda: ${calendarErrorMsg || 'credenciais inválidas'})`;
      
    await prisma.leadEvent.create({
      data: {
        leadId,
        type: LeadEventType.APPOINTMENT_RESCHEDULED,
        newValue: scheduledDate.toISOString(),
        userId: decoded.userId,
        notes: `Agendamento comercial atualizado para ${scheduledDate.toLocaleDateString('pt-BR')} às ${scheduledDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} ${techText}.${calText}`,
      },
    });

    // 7. Atualizar timestamp do lead
    await prisma.lead.update({
      where: { id: leadId },
      data: { updatedAt: new Date() },
    });

    return NextResponse.json(updatedAppointment);
  } catch (error) {
    console.error('Error updating lead appointment:', error);
    return NextResponse.json({ error: 'Erro ao atualizar agendamento' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const decoded = validateToken(request);
    if (!decoded) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const { id: leadId } = await params;
    const { searchParams } = new URL(request.url);
    const appointmentId = searchParams.get('appointmentId');

    if (!appointmentId) {
      return NextResponse.json({ error: 'ID do agendamento é obrigatório' }, { status: 400 });
    }

    // 1. Verificar se o agendamento existe e pertence a este lead
    const appointment = await prisma.leadAppointment.findFirst({
      where: { id: appointmentId, leadId },
    });

    if (!appointment) {
      return NextResponse.json({ error: 'Agendamento não encontrado' }, { status: 404 });
    }

    // 2. Se houver integração com o Google Calendar, deletar o evento
    const googleEventId = appointment.googleEventId;
    if (googleEventId) {
      try {
        await deleteCalendarEvent(googleEventId);
      } catch (calErr) {
        console.error('[Google Calendar] Falha ao deletar evento:', calErr);
      }
    }

    // 3. Deletar do banco de dados
    await prisma.leadAppointment.delete({
      where: { id: appointmentId },
    });

    // 4. Registrar evento de histórico do lead
    await prisma.leadEvent.create({
      data: {
        leadId,
        type: LeadEventType.LEAD_UPDATED,
        newValue: 'Cancelado',
        userId: decoded.userId,
        notes: `Agendamento comercial do dia ${appointment.scheduledAt.toLocaleDateString('pt-BR')} foi cancelado/excluído.`,
      },
    });

    // 5. Atualizar timestamp do lead
    await prisma.lead.update({
      where: { id: leadId },
      data: { updatedAt: new Date() },
    });

    return NextResponse.json({ success: true, message: 'Agendamento cancelado com sucesso' });
  } catch (error) {
    console.error('Error deleting lead appointment:', error);
    return NextResponse.json({ error: 'Erro ao cancelar agendamento' }, { status: 500 });
  }
}
