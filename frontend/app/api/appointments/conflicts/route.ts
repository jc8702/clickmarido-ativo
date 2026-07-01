import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    if (!validateToken(request)) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const technicianId = searchParams.get('technicianId');
    const date = searchParams.get('date');
    const time = searchParams.get('time');
    const duration = searchParams.get('duration');

    if (!technicianId || !date || !time || !duration) {
      return NextResponse.json(
        { error: 'Parâmetros obrigatórios não fornecidos' },
        { status: 400 }
      );
    }

    // Converter date e time para DateTime
    const [hours, minutes] = time.split(':').map(Number);
    const appointmentDate = new Date(date);
    appointmentDate.setHours(hours, minutes, 0, 0);
    
    const appointmentEnd = new Date(appointmentDate.getTime() + parseInt(duration) * 60000);

    // Buscar agendamentos do técnico no mesmo dia
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);

    const existingAppointments = await prisma.appointment.findMany({
      where: {
        technicianId,
        date: {
          gte: dayStart,
          lte: dayEnd,
        },
        status: {
          notIn: ['cancelada', 'nao_compareceu'],
        },
      },
      orderBy: { date: 'asc' },
    });

    // Verificar conflitos
    const conflictingAppointments = existingAppointments.filter((apt) => {
      const aptEnd = new Date(apt.date.getTime() + apt.duration * 60000);
      return appointmentDate < aptEnd && appointmentEnd > apt.date;
    });

    // Gerar slots disponíveis (horário comercial 8h-18h)
    const availableSlots: { time: string; duration: number }[] = [];
    const workStart = 8;
    const workEnd = 18;

    for (let hour = workStart; hour < workEnd; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const slotStart = new Date(date);
        slotStart.setHours(hour, minute, 0, 0);
        
        const slotEnd = new Date(slotStart.getTime() + parseInt(duration) * 60000);
        
        // Verificar se o slot cabe no horário comercial
        if (slotEnd.getHours() >= workEnd) continue;
        
        // Verificar se há conflito com agendamentos existentes
        const hasConflict = existingAppointments.some((apt) => {
          const aptEnd = new Date(apt.date.getTime() + apt.duration * 60000);
          return slotStart < aptEnd && slotEnd > apt.date;
        });
        
        if (!hasConflict) {
          availableSlots.push({
            time: `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`,
            duration: parseInt(duration),
          });
        }
      }
    }

    return NextResponse.json({
      hasConflict: conflictingAppointments.length > 0,
      conflictingAppointments: conflictingAppointments.map((apt) => ({
        id: apt.id,
        date: apt.date,
        duration: apt.duration,
        status: apt.status,
      })),
      availableSlots,
    });
  } catch (error) {
    console.error('Error checking conflicts:', error);
    return NextResponse.json(
      { error: 'Erro ao verificar conflitos' },
      { status: 500 }
    );
  }
}
