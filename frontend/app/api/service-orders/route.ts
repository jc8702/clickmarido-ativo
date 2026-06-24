import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import * as jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
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

async function generateOSNumber(): Promise<string> {
  const last = await prisma.serviceOrder.findFirst({
    orderBy: { number: 'desc' },
    select: { number: true },
  });

  if (!last) return 'OS-0001';

  const match = last.number.match(/(\d+)$/);
  if (!match) return 'OS-0001';

  const next = parseInt(match[1], 10) + 1;
  return `OS-${String(next).padStart(4, '0')}`;
}

export async function GET(request: NextRequest): Promise<Response> {
  try {
    if (!validateToken(request)) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status') || '';
    const search = searchParams.get('search') || '';
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { number: { contains: search, mode: 'insensitive' } },
        { customer: { name: { contains: search, mode: 'insensitive' } } },
        { address: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [orders, total] = await Promise.all([
      prisma.serviceOrder.findMany({
        where,
        include: { customer: true, technician: true, quotation: true },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.serviceOrder.count({ where }),
    ]);

    return NextResponse.json({
      data: orders,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });

  } catch (error) {
    console.error('GET /api/service-orders error:', error);
    return NextResponse.json({ error: 'Erro ao listar ordens de serviço' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

export async function POST(request: NextRequest): Promise<Response> {
  try {
    if (!validateToken(request)) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const body = await request.json();
    const { quotationId, customerId, technicianId, scheduledTime, address, notes } = body;

    if (!quotationId || !customerId) {
      return NextResponse.json({ error: 'Orçamento e cliente são obrigatórios' }, { status: 400 });
    }

    const quotation = await prisma.quotation.findUnique({ where: { id: quotationId } });
    if (!quotation) {
      return NextResponse.json({ error: 'Orçamento não encontrado' }, { status: 404 });
    }

    const existing = await prisma.serviceOrder.findUnique({ where: { quotationId } });
    if (existing) {
      return NextResponse.json({ error: 'Já existe OS para este orçamento' }, { status: 400 });
    }

    const number = await generateOSNumber();

    const order = await prisma.serviceOrder.create({
      data: {
        number,
        quotationId,
        customerId,
        technicianId: technicianId || null,
        scheduledTime: scheduledTime ? new Date(scheduledTime) : null,
        status: 'agendada',
        address: address || '',
        notes: notes || '',
        finalTotal: quotation.total,
      },
      include: { customer: true, technician: true, quotation: true },
    });

    // Registrar log de auditoria
    const { logAudit } = await import('@/lib/audit');
    await logAudit({
      request,
      entity: 'service_order',
      entityId: order.id,
      action: 'created',
      newValue: {
        id: order.id,
        number: order.number,
        quotationId: order.quotationId,
        customerId: order.customerId,
        technicianId: order.technicianId,
        status: order.status,
        finalTotal: order.finalTotal,
      },
    });

    return NextResponse.json(order, { status: 201 });

  } catch (error: any) {
    console.error('POST /api/service-orders error:', error);
    return NextResponse.json({ error: 'Erro ao criar ordem de serviço' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
