import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/components/whatsapp/utils/prisma';
import { getUserId } from '@/components/whatsapp/utils/auth';

// GET - Listar conversas arquivadas
export async function GET(request: NextRequest) {
  const userId = getUserId(request);
  if (!userId) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const archived = await prisma.whatsAppArchived.findMany({
      where: { userId },
      orderBy: { archivedAt: 'desc' },
    });

    return NextResponse.json({ data: archived });
  } catch (error) {
    console.error('Error fetching archived:', error);
    return NextResponse.json({ error: 'Erro ao buscar arquivadas' }, { status: 500 });
  }
}

// POST - Arquivar/desarquivar conversa (toggle)
export async function POST(request: NextRequest) {
  const userId = getUserId(request);
  if (!userId) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { phone } = body;

    if (!phone) {
      return NextResponse.json({ error: 'Telefone é obrigatório' }, { status: 400 });
    }

    // Verificar se já existe
    const existing = await prisma.whatsAppArchived.findUnique({
      where: { phone_userId: { phone, userId } },
    });

    if (existing) {
      // Desarquivar
      await prisma.whatsAppArchived.delete({
        where: { id: existing.id },
      });
      return NextResponse.json({ action: 'unarchived', phone });
    } else {
      // Arquivar
      await prisma.whatsAppArchived.create({
        data: { phone, userId },
      });
      return NextResponse.json({ action: 'archived', phone });
    }
  } catch (error) {
    console.error('Error toggling archive:', error);
    return NextResponse.json({ error: 'Erro ao atualizar arquivamento' }, { status: 500 });
  }
}
