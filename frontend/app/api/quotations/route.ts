import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { QuotationSchema } from '@/lib/schemas';
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
    const customerId = searchParams.get('customerId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const skip = (page - 1) * limit;

    const where = customerId ? { customerId } : {};

    const [data, total] = await Promise.all([
      prisma.quotation.findMany({
        where,
        include: { customer: true },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.quotation.count({ where }),
    ]);

    return NextResponse.json({
      data,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });

  } catch (error) {
    console.error('GET /api/quotations error:', error);
    return NextResponse.json({ error: 'Erro ao listar orçamentos' }, { status: 500 });
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
    const parsed = QuotationSchema.parse(body);

    const total = (parsed.items as any[]).reduce(
      (sum, item) => sum + item.quantity * item.price,
      0
    );

    const customer = await prisma.customer.findUnique({
      where: { id: parsed.customerId },
    });

    if (!customer) {
      return NextResponse.json({ error: 'Cliente não encontrado' }, { status: 404 });
    }

    const quotation = await prisma.quotation.create({
      data: {
        customerId: parsed.customerId,
        items: parsed.items,
        total,
        status: 'rascunho',
        notes: parsed.notes,
      },
      include: { customer: true },
    });

    return NextResponse.json(quotation, { status: 201 });

  } catch (error: any) {
    console.error('POST /api/quotations error:', error);

    if (error.name === 'ZodError') {
      return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 });
    }

    return NextResponse.json({ error: 'Erro ao criar orçamento' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
