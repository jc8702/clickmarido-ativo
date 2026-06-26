import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import * as jwt from 'jsonwebtoken';
const JWT_SECRET = process.env.JWT_SECRET;

function validateToken(request: NextRequest) {
  if (!JWT_SECRET) return null;
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

export async function GET(request: NextRequest): Promise<Response> {
  try {
    if (!validateToken(request)) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status') || '';
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status) where.status = status;

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        include: { customer: true, quotation: true },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.payment.count({ where }),
    ]);

    return NextResponse.json({
      data: payments,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });

  } catch (error) {
    console.error('GET /api/payments error:', error);
    return NextResponse.json({ error: 'Erro ao listar pagamentos' }, { status: 500 });
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
    const { quotationId, customerId, amount, method, description, status } = body;

    if (!customerId || amount === undefined) {
      return NextResponse.json({ error: 'Campos obrigatórios faltando' }, { status: 400 });
    }

    // Normalizar status: 'aprovado' do front vira 'confirmado' no banco
    const normalizedStatus = status === 'aprovado' ? 'confirmado' : (status || 'pendente');

    const payment = await prisma.payment.create({
      data: {
        quotationId: quotationId || null,
        customerId,
        amount: Number(amount),
        method: method || 'pix',
        status: normalizedStatus,
        description: description || '',
      },
      include: { customer: true },
    });

    // Registrar log de auditoria
    const { logAudit } = await import('@/lib/audit');
    await logAudit({
      request,
      entity: 'payment',
      entityId: payment.id,
      action: 'created',
      newValue: {
        id: payment.id,
        customerId: payment.customerId,
        quotationId: payment.quotationId,
        amount: payment.amount,
        status: payment.status,
        method: payment.method,
      },
    });

    return NextResponse.json(payment, { status: 201 });

  } catch (error: any) {
    console.error('POST /api/payments error:', error);
    return NextResponse.json({ error: 'Erro ao criar pagamento' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
