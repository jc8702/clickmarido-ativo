import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import * as jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

function getUserId(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'clickmarido_secret') as { userId: string };
    return decoded.userId;
  } catch {
    return null;
  }
}

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
