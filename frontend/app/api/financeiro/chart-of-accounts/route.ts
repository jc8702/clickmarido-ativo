import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
  if (!validateToken(request)) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const isActive = searchParams.get('isActive');

    const where: any = {};
    if (type) where.type = type;
    if (isActive !== null) where.isActive = isActive === 'true';

    const accounts = await prisma.chartOfAccount.findMany({
      where,
      include: {
        children: true,
      },
      orderBy: { code: 'asc' },
    });

    // Construir árvore hierárquica
    const rootAccounts = accounts.filter(a => !a.parentId);
    const buildTree = (parentId: string): any[] => {
      return accounts
        .filter(a => a.parentId === parentId)
        .map(a => ({
          ...a,
          children: buildTree(a.id),
        }));
    };

    const tree = rootAccounts.map(a => ({
      ...a,
      children: buildTree(a.id),
    }));

    return NextResponse.json({ data: tree, flat: accounts });
  } catch (error) {
    console.error('Erro ao buscar plano de contas:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!validateToken(request)) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { code, name, type, parentId, isActive } = body;

    if (!code || !name || !type) {
      return NextResponse.json({ error: 'Dados obrigatórios não informados' }, { status: 400 });
    }

    // Verificar se o código já existe
    const existing = await prisma.chartOfAccount.findUnique({ where: { code } });
    if (existing) {
      return NextResponse.json({ error: 'Código já existente' }, { status: 400 });
    }

    // Calcular nível
    let level = 0;
    if (parentId) {
      const parent = await prisma.chartOfAccount.findUnique({ where: { id: parentId } });
      if (parent) level = parent.level + 1;
    }

    const account = await prisma.chartOfAccount.create({
      data: {
        code,
        name,
        type,
        parentId,
        level,
        isActive: isActive !== undefined ? isActive : true,
      },
    });

    return NextResponse.json(account, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar conta do plano:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
