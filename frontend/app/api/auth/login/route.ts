import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import * as jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
const JWT_EXPIRATION = '7d';

export async function POST(request: NextRequest) {
  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) return NextResponse.json({ error: 'JWT_SECRET não configurado' }, { status: 500 });

    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email e senha são obrigatórios' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!user || !user.active) {
      return NextResponse.json(
        { error: 'Email ou senha inválidos' },
        { status: 401 }
      );
    }

    const passwordValid = await bcrypt.compare(password, user.passwordHash);

    if (!passwordValid) {
      return NextResponse.json(
        { error: 'Email ou senha inválidos' },
        { status: 401 }
      );
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      secret,
      { expiresIn: JWT_EXPIRATION }
    );

    let technicianId: string | null = null;
    const tech = await prisma.technician.findFirst({
      where: { email: user.email, active: true },
      select: { id: true },
    });
    if (tech) {
      technicianId = tech.id;
    }

    return NextResponse.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        technicianId,
      },
    });

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Erro ao processar login' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
