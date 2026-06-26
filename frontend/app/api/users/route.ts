import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import * as jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
const JWT_SECRET = process.env.JWT_SECRET;

function decodeToken(request: NextRequest): { userId: string; email: string; role: string } | null {
  if (!JWT_SECRET) return null;
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  try {
    return jwt.verify(authHeader.substring(7), JWT_SECRET) as any;
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest): Promise<Response> {
  try {
    const user = decodeToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    // Apenas admins ou managers podem gerenciar usuários
    if (user.role !== 'admin' && user.role !== 'manager') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const usersList = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        active: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(usersList);
  } catch (error) {
    console.error('GET /api/users error:', error);
    return NextResponse.json({ error: 'Erro ao listar usuários' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

export async function POST(request: NextRequest): Promise<Response> {
  try {
    const user = decodeToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    // Apenas admins ou managers podem gerenciar usuários
    if (user.role !== 'admin' && user.role !== 'manager') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const body = await request.json();
    const { name, email, password, role, active } = body;

    if (!name || !email || !password || !role) {
      return NextResponse.json({ error: 'Nome, e-mail, senha e cargo são obrigatórios' }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (existingUser) {
      return NextResponse.json({ error: 'Este e-mail já está em uso' }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        name,
        email: email.toLowerCase().trim(),
        passwordHash,
        role: role.toLowerCase(),
        active: active !== undefined ? active : true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        active: true,
        createdAt: true,
      },
    });

    // Registrar auditoria
    try {
      const { logAudit } = await import('@/lib/audit');
      await logAudit({
        request,
        entity: 'user',
        entityId: newUser.id,
        action: 'created',
        newValue: { name: newUser.name, email: newUser.email, role: newUser.role, active: newUser.active },
      });
    } catch (auditErr) {
      console.error('Audit failed:', auditErr);
    }

    return NextResponse.json(newUser, { status: 201 });
  } catch (error) {
    console.error('POST /api/users error:', error);
    return NextResponse.json({ error: 'Erro ao criar usuário' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
