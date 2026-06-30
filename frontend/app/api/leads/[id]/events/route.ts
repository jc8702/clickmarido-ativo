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

    const { id: leadId } = await params;

    // Verificar se o lead existe
    const leadExists = await prisma.lead.findUnique({
      where: { id: leadId },
      select: { id: true },
    });

    if (!leadExists) {
      return NextResponse.json({ error: 'Lead não encontrado' }, { status: 404 });
    }

    // Buscar eventos
    const events = await prisma.leadEvent.findMany({
      where: { leadId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(events);
  } catch (error) {
    console.error('Error fetching lead events:', error);
    return NextResponse.json({ error: 'Erro ao buscar eventos do lead' }, { status: 500 });
  }
}
