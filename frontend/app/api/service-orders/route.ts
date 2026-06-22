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

    // Busca orçamentos que não são rascunho
    const quotations = await prisma.quotation.findMany({
      where: {
        status: {
          not: 'rascunho',
        },
      },
      include: { customer: true },
      orderBy: { createdAt: 'desc' },
    });

    const orders = quotations.map(q => {
      let serviceStatus = 'agendada';
      if (q.status === 'aceito' || q.status === 'aprovado') {
        serviceStatus = 'concluida';
      } else if (q.status === 'enviado') {
        serviceStatus = 'em_progresso';
      } else if (q.status === 'rejeitado') {
        serviceStatus = 'cancelada';
      }

      return {
        id: q.id,
        customerId: q.customerId,
        customer_name: q.customer?.name || 'Cliente',
        customer_phone: q.customer?.phone || '',
        customer_email: q.customer?.email || '',
        scheduled_date: q.createdAt.toISOString(),
        status: serviceStatus,
        amount: q.total,
      };
    });

    return NextResponse.json({
      success: true,
      data: orders,
    });

  } catch (error) {
    console.error('GET /api/service-orders error:', error);
    return NextResponse.json(
      { error: 'Erro ao listar ordens de serviço' },
      { status: 500 }
    );
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
    const { customerId, description, amount, scheduled_date, notes } = body;

    if (!customerId || !description || amount === undefined || !scheduled_date) {
      return NextResponse.json({ error: 'Campos obrigatórios faltando' }, { status: 400 });
    }

    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
    });

    if (!customer) {
      return NextResponse.json({ error: 'Cliente não encontrado' }, { status: 404 });
    }

    // Criamos um Quotation com status 'agendada' (representando a OS)
    const quotation = await prisma.quotation.create({
      data: {
        customerId,
        total: Number(amount),
        status: 'agendada',
        notes: notes || 'OS criada manualmente',
        createdAt: new Date(scheduled_date),
      },
      include: { customer: true },
    });

    // Criar item do orçamento
    if (description) {
      let product = await prisma.product.findFirst({
        where: { name: description, type: 'SERVICO' },
      });

      if (!product) {
        product = await prisma.product.create({
          data: {
            name: description,
            sku: `OS-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            type: 'SERVICO',
            price: Number(amount),
            unit: 'un',
          },
        });
      }

      await prisma.quotationItem.create({
        data: {
          quotationId: quotation.id,
          productId: product.id,
          quantity: 1,
          unitPrice: Number(amount),
          subtotal: Number(amount),
          notes: notes || 'OS criada manualmente',
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        id: quotation.id,
        customer_name: customer.name,
        scheduled_date: quotation.createdAt.toISOString(),
        status: 'agendada',
        amount: quotation.total,
      },
    }, { status: 201 });

  } catch (error: any) {
    console.error('POST /api/service-orders error:', error);
    return NextResponse.json({ error: 'Erro ao criar ordem de serviço' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

