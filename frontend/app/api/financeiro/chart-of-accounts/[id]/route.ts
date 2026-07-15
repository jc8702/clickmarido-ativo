import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateToken } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!validateToken(request)) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const account = await prisma.chartOfAccount.findUnique({
      where: { id },
      include: {
        parent: true,
        children: true,
      },
    });

    if (!account) {
      return NextResponse.json({ error: 'Conta não encontrada' }, { status: 404 });
    }

    return NextResponse.json(account);
  } catch (error) {
    console.error('Erro ao buscar conta do plano:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!validateToken(request)) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const { code, name, type, parentId, isActive } = body;

    const account = await prisma.chartOfAccount.update({
      where: { id },
      data: {
        code,
        name,
        type,
        parentId,
        isActive,
      },
    });

    return NextResponse.json(account);
  } catch (error) {
    console.error('Erro ao atualizar conta do plano:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!validateToken(request)) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }

  const { id } = await params;

  try {
    // Verificar se há subcontas
    const hasChildren = await prisma.chartOfAccount.findFirst({
      where: { parentId: id },
    });

    if (hasChildren) {
      return NextResponse.json(
        { error: 'Não é possível excluir conta com subcontas' },
        { status: 400 }
      );
    }

    // Verificar se há vínculos
    const hasLinks = await prisma.accountReceivable.findFirst({
      where: { chartOfAccountId: id },
    });

    if (hasLinks) {
      return NextResponse.json(
        { error: 'Não é possível excluir conta com vínculos financeiros' },
        { status: 400 }
      );
    }

    await prisma.chartOfAccount.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao excluir conta do plano:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
