import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateToken } from '@/lib/auth';

// DELETE - Deletar etiqueta
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = validateToken(request);
  const userId = auth?.userId;
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
  const auth = validateToken(request);
  const userId = auth?.userId;
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
