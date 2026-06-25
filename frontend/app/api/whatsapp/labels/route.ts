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

// GET - Listar etiquetas do usuário
export async function GET(request: NextRequest) {
  const userId = getUserId(request);
  if (!userId) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const labels = await prisma.whatsAppLabel.findMany({
      where: { userId },
      include: {
        _count: {
          select: { conversations: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({ data: labels });
  } catch (error) {
    console.error('Error fetching labels:', error);
    return NextResponse.json({ error: 'Erro ao buscar etiquetas' }, { status: 500 });
  }
}

// POST - Criar etiqueta
export async function POST(request: NextRequest) {
  const userId = getUserId(request);
  if (!userId) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, color } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: 'Nome é obrigatório' }, { status: 400 });
    }

    // Verificar se já existe etiqueta com esse nome
    const existing = await prisma.whatsAppLabel.findUnique({
      where: { name_userId: { name: name.trim(), userId } },
    });

    if (existing) {
      return NextResponse.json({ error: 'Etiqueta já existe' }, { status: 409 });
    }

    const label = await prisma.whatsAppLabel.create({
      data: {
        name: name.trim(),
        color: color || '#00a884',
        userId,
      },
    });

    return NextResponse.json({ data: label }, { status: 201 });
  } catch (error) {
    console.error('Error creating label:', error);
    return NextResponse.json({ error: 'Erro ao criar etiqueta' }, { status: 500 });
  }
}
