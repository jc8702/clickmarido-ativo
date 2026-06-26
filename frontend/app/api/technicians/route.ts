import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import * as jwt from 'jsonwebtoken';
const JWT_SECRET = process.env.JWT_SECRET;

function validateToken(request: NextRequest) {
  if (!JWT_SECRET) return null;
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  try {
    jwt.verify(authHeader.substring(7), JWT_SECRET);
    return true;
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    if (!validateToken(request)) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';

    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { specialty: { contains: search, mode: 'insensitive' } },
      ];
    }

    const technicians = await prisma.technician.findMany({
      where,
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({ data: technicians });

  } catch (error) {
    console.error('GET /api/technicians error:', error);
    return NextResponse.json({ error: 'Erro ao listar técnicos' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!validateToken(request)) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const body = await request.json();
    const { name, email, phone, specialty } = body;

    if (!name) {
      return NextResponse.json({ error: 'Nome é obrigatório' }, { status: 400 });
    }

    const technician = await prisma.technician.create({
      data: {
        name,
        email: email || '',
        phone: phone || '',
        specialty: specialty || '',
      },
    });

    return NextResponse.json(technician, { status: 201 });

  } catch (error: any) {
    console.error('POST /api/technicians error:', error);
    return NextResponse.json({ error: 'Erro ao criar técnico' }, { status: 500 });
}
}