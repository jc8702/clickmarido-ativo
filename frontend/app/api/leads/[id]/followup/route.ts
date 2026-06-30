import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateToken } from '@/lib/auth';
import { LeadEventType } from '@prisma/client';

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
    const { notes } = body;

    if (!notes || !notes.trim()) {
      return NextResponse.json({ error: 'Anotação do follow-up é obrigatória' }, { status: 400 });
    }

    // 1. Verificar se o lead existe
    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
    });

    if (!lead) {
      return NextResponse.json({ error: 'Lead não encontrado' }, { status: 404 });
    }

    // 2. Registrar o evento de follow-up
    const event = await prisma.leadEvent.create({
      data: {
        leadId,
        type: LeadEventType.FOLLOWUP_LOGGED,
        userId: decoded.userId,
        notes: notes.trim(),
      },
    });

    // 3. Atualizar o timestamp de alteração do lead
    await prisma.lead.update({
      where: { id: leadId },
      data: { updatedAt: new Date() },
    });

    return NextResponse.json(event);
  } catch (error) {
    console.error('Error logging follow-up:', error);
    return NextResponse.json({ error: 'Erro ao registrar follow-up' }, { status: 500 });
  }
}
