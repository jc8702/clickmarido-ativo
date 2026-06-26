import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import * as jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();
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

type RouteParams = { params: Promise<{ id: string }> };

export async function PUT(
  request: NextRequest,
  { params }: RouteParams
): Promise<Response> {
  const { id } = await params;
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

    const existingUser = await prisma.user.findUnique({ where: { id } });
    if (!existingUser) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    const data: any = {};
    if (name) data.name = name;
    if (email) {
      // Verificar e-mail repetido
      const emailDup = await prisma.user.findFirst({
        where: { email: email.toLowerCase().trim(), NOT: { id } }
      });
      if (emailDup) {
        return NextResponse.json({ error: 'E-mail já cadastrado por outro usuário' }, { status: 400 });
      }
      data.email = email.toLowerCase().trim();
    }
    if (role) data.role = role.toLowerCase();
    if (active !== undefined) data.active = active;

    if (password && password.trim() !== '') {
      data.passwordHash = await bcrypt.hash(password, 10);
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        active: true,
        updatedAt: true,
      }
    });

    // Registrar auditoria
    try {
      const { logAudit } = await import('@/lib/audit');
      await logAudit({
        request,
        entity: 'user',
        entityId: id,
        action: 'updated',
        oldValue: { name: existingUser.name, email: existingUser.email, role: existingUser.role, active: existingUser.active },
        newValue: { name: updatedUser.name, email: updatedUser.email, role: updatedUser.role, active: updatedUser.active },
      });
    } catch (auditErr) {
      console.error('Audit failed:', auditErr);
    }

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error('PUT /api/users/[id] error:', error);
    return NextResponse.json({ error: 'Erro ao atualizar usuário' }, { status: 500 });
  } finally {
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
): Promise<Response> {
  const { id } = await params;
  try {
    const user = decodeToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    // Apenas admins ou managers podem gerenciar usuários
    if (user.role !== 'admin' && user.role !== 'manager') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    // O usuário logado não pode se auto-excluir
    if (user.userId === id) {
      return NextResponse.json({ error: 'Você não pode excluir sua própria conta' }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({ where: { id } });
    if (!existingUser) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    await prisma.user.delete({ where: { id } });

    // Registrar auditoria
    try {
      const { logAudit } = await import('@/lib/audit');
      await logAudit({
        request,
        entity: 'user',
        entityId: id,
        action: 'deleted',
        oldValue: { name: existingUser.name, email: existingUser.email, role: existingUser.role, active: existingUser.active },
      });
    } catch (auditErr) {
      console.error('Audit failed:', auditErr);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/users/[id] error:', error);
    return NextResponse.json({ error: 'Erro ao excluir usuário' }, { status: 500 });
  } finally {
  }
}
