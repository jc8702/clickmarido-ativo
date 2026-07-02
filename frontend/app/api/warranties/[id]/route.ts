import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateToken } from '@/lib/auth';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    if (!validateToken(request)) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const { id } = params;

    // Verificar se existe
    const warranty = await prisma.warranty.findUnique({
      where: { id },
    });

    if (!warranty) {
      return NextResponse.json({ error: 'Garantia não encontrada' }, { status: 404 });
    }

    await prisma.warranty.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/warranties/[id] error:', error);
    return NextResponse.json({ error: 'Erro ao excluir garantia' }, { status: 500 });
  }
}
