import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/components/whatsapp/utils/prisma';
import { getUserId } from '@/components/whatsapp/utils/auth';

// POST - Atribuir/remover etiqueta de uma conversa (toggle)
export async function POST(request: NextRequest) {
  const userId = getUserId(request);
  if (!userId) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { phone, labelId } = body;

    if (!phone || !labelId) {
      return NextResponse.json({ error: 'phone e labelId são obrigatórios' }, { status: 400 });
    }

    // Verificar se a etiqueta pertence ao usuário
    const label = await prisma.whatsAppLabel.findFirst({
      where: { id: labelId, userId },
    });

    if (!label) {
      return NextResponse.json({ error: 'Etiqueta não encontrada' }, { status: 404 });
    }

    // Verificar se já está atribuída
    const existing = await prisma.whatsAppConversationLabel.findUnique({
      where: { phone_labelId_userId: { phone, labelId, userId } },
    });

    if (existing) {
      // Remover
      await prisma.whatsAppConversationLabel.delete({
        where: { id: existing.id },
      });
      return NextResponse.json({ action: 'removed', phone, labelId });
    } else {
      // Atribuir
      await prisma.whatsAppConversationLabel.create({
        data: { phone, labelId, userId },
      });
      return NextResponse.json({ action: 'assigned', phone, labelId });
    }
  } catch (error) {
    console.error('Error toggling label assignment:', error);
    return NextResponse.json({ error: 'Erro ao atualizar atribuição' }, { status: 500 });
  }
}
