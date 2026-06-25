import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/components/whatsapp/utils/prisma';
import { getUserId } from '@/components/whatsapp/utils/auth';

// GET - Listar favoritos do usuário
export async function GET(request: NextRequest) {
  const userId = getUserId(request);
  if (!userId) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const favorites = await prisma.whatsAppFavorite.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ data: favorites });
  } catch (error) {
    console.error('Error fetching favorites:', error);
    return NextResponse.json({ error: 'Erro ao buscar favoritos' }, { status: 500 });
  }
}

// POST - Adicionar/remover favorito (toggle)
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
    const existing = await prisma.whatsAppFavorite.findUnique({
      where: { phone_userId: { phone, userId } },
    });

    if (existing) {
      // Remover
      await prisma.whatsAppFavorite.delete({
        where: { id: existing.id },
      });
      return NextResponse.json({ action: 'removed', phone });
    } else {
      // Adicionar
      await prisma.whatsAppFavorite.create({
        data: { phone, userId },
      });
      return NextResponse.json({ action: 'added', phone });
    }
  } catch (error) {
    console.error('Error toggling favorite:', error);
    return NextResponse.json({ error: 'Erro ao atualizar favorito' }, { status: 500 });
  }
}
