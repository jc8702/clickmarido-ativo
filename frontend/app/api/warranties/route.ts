import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import * as jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

function validateToken(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;

  try {
    const token = authHeader.substring(7);
    jwt.verify(token, JWT_SECRET);
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
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      prisma.warranty.findMany({
        include: { quotation: true, customer: true },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.warranty.count(),
    ]);

    return NextResponse.json({
      data,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });

  } catch (error) {
    console.error('GET /api/warranties error:', error);
    return NextResponse.json({ error: 'Erro ao listar garantias' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!validateToken(request)) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const body = await request.json();
    const { quotationId, customerId, service_description, expiry_date } = body;

    if (!quotationId || !customerId || !service_description || !expiry_date) {
      return NextResponse.json({ error: 'Campos obrigatórios faltando' }, { status: 400 });
    }

    const warranty = await prisma.warranty.create({
      data: {
        quotationId,
        customerId,
        service_description,
        expiry_date: new Date(expiry_date),
      },
      include: { quotation: true, customer: true },
    });

    return NextResponse.json(warranty, { status: 201 });

  } catch (error: any) {
    console.error('POST /api/warranties error:', error);
    return NextResponse.json({ error: 'Erro ao criar garantia' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
