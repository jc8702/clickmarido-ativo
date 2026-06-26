import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // Autenticação obrigatória
    const auth = await verifyAuth(request);
    if (!auth.success) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId é obrigatório' },
        { status: 400 }
      );
    }

    // Usuário só pode ver contagem das próprias notificações
    const tokenUserId = (auth.user as any)?.userId;
    if (tokenUserId && tokenUserId !== userId) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const unreadCount = await prisma.notification.count({
      where: {
        userId,
        isRead: false,
      },
    });

    return NextResponse.json({ unreadCount });
  } catch (error) {
    console.error('Error counting unread notifications:', error);
    return NextResponse.json(
      { error: 'Erro ao contar notificações não lidas' },
      { status: 500 }
    );
  }
}
