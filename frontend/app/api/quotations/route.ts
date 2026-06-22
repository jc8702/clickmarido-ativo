import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import * as jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET;

function validateToken(request: NextRequest) {
  if (!JWT_SECRET) {
    return NextResponse.json({ error: 'Configuração inválida' }, { status: 500 });
  }

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

    // Aceitar ambos os formatos: customer_id (novo) e customerId (antigo)
    const customerId = body.customer_id || body.customerId;
    if (!customerId) {
      return NextResponse.json({ error: 'Cliente é obrigatório' }, { status: 400 });
    }

    const items = body.items;
    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Adicione pelo menos 1 item' }, { status: 400 });
    }

    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
    });

    if (!customer) {
      return NextResponse.json({ error: 'Cliente não encontrado' }, { status: 404 });
    }

    // Calcular total
    const total = items.reduce(
      (sum: number, item: any) => sum + (item.quantity || 1) * (item.unit_price || item.price || 0),
      0
    ) - (body.discount || 0);

    const notes = body.notes || '';

    const quotation = await prisma.quotation.create({
      data: {
        customerId,
        total,
        status: 'rascunho',
        notes,
      },
      include: { customer: true },
    });

    // Criar itens do orçamento
    for (const item of items) {
      const itemName = item.name || item.description || '';
      const itemPrice = item.unit_price || item.price || 0;
      const itemQuantity = item.quantity || 1;
      const itemProductId = item.product_id || null;

      // Se tem product_id, usar o produto existente
      let product = null;
      if (itemProductId) {
        product = await prisma.product.findUnique({
          where: { id: itemProductId },
        });
      }

      // Se não encontrou pelo ID, buscar por nome
      if (!product && itemName) {
        product = await prisma.product.findFirst({
          where: { name: itemName, type: 'SERVICO' },
        });
      }

      // Se ainda não encontrou, criar um novo produto
      if (!product && itemName) {
        const sku = item.sku || `SVC-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
        product = await prisma.product.create({
          data: {
            name: itemName,
            sku,
            type: 'SERVICO',
            price: itemPrice,
            unit: 'un',
          },
        });
      }

      if (product) {
        await prisma.quotationItem.create({
          data: {
            quotationId: quotation.id,
            productId: product.id,
            quantity: itemQuantity,
            unitPrice: itemPrice,
            subtotal: itemQuantity * itemPrice,
          },
        });
      }
    }

    return NextResponse.json(quotation, { status: 201 });

  } catch (error: any) {
    console.error('POST /api/quotations error:', error);
    return NextResponse.json({ error: 'Erro ao criar orçamento: ' + (error.message || 'Erro desconhecido') }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
