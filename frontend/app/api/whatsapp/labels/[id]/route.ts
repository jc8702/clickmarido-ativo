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

// DELETE - Deletar etiqueta
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = getUserId(request);
  if (!userId) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const label = await prisma.whatsAppLabel.findFirst({
      where: { id, userId },
    });

    if (!label) {
      return NextResponse.json({ error: 'Etiqueta não encontrada' }, { status: 404 });
    }

    await prisma.whatsAppLabel.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting label:', error);
    return NextResponse.json({ error: 'Erro ao deletar etiqueta' }, { status: 500 });
  }
}

// PATCH - Atualizar etiqueta
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = getUserId(request);
  if (!userId) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const label = await prisma.whatsAppLabel.findFirst({
      where: { id, userId },
    });

    if (!label) {
      return NextResponse.json({ error: 'Etiqueta não encontrada' }, { status: 404 });
    }

    const body = await request.json();
    const { name, color } = body;

    const updated = await prisma.whatsAppLabel.update({
      where: { id },
      data: {
        ...(name && { name: name.trim() }),
        ...(color && { color }),
      },
    });

    return NextResponse.json({ data: updated });
  } catch (error) {
    console.error('Error updating label:', error);
    return NextResponse.json({ error: 'Erro ao atualizar etiqueta' }, { status: 500 });
  }
}
