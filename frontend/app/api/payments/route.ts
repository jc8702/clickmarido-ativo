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

    // Busca orçamentos que já foram enviados ou aceitos/aprovados
    const quotations = await prisma.quotation.findMany({
      where: {
        status: {
          in: ['enviado', 'aceito', 'aprovado'],
        },
      },
      include: { customer: true },
      orderBy: { updatedAt: 'desc' },
    });

    const payments = quotations.map(q => {
      const isApproved = q.status === 'aceito' || q.status === 'aprovado';
      return {
        id: q.id,
        service_order_id: q.id,
        customerId: q.customerId,
        customer_name: q.customer?.name || 'Cliente',
        customer_phone: q.customer?.phone || '',
        amount: q.total,
        status: isApproved ? 'aprovado' : 'pendente',
      };
    });

    return NextResponse.json({
      success: true,
      data: payments,
    });

  } catch (error) {
    console.error('GET /api/payments error:', error);
    return NextResponse.json(
      { error: 'Erro ao listar pagamentos' },
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
    const { customerId, description, amount, status } = body;

    if (!customerId || !description || amount === undefined || !status) {
      return NextResponse.json({ error: 'Campos obrigatórios faltando' }, { status: 400 });
    }

    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
    });

    if (!customer) {
      return NextResponse.json({ error: 'Cliente não encontrado' }, { status: 404 });
    }

    const quotationStatus = status === 'aprovado' ? 'aceito' : 'enviado';

    const quotation = await prisma.quotation.create({
      data: {
        customerId,
        total: Number(amount),
        status: quotationStatus,
        notes: 'Lançamento de pagamento manual avulso',
      },
      include: { customer: true },
    });

    // Criar item do orçamento se houver produto selecionado
    if (description) {
      // Buscar ou criar um produto padrão para pagamentos avulsos
      let product = await prisma.product.findFirst({
        where: { name: description, type: 'SERVICO' },
      });

      if (!product) {
        product = await prisma.product.create({
          data: {
            name: description,
            sku: `PAY-${Date.now()}`,
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
          notes: 'Lançamento de pagamento manual avulso',
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        id: quotation.id,
        service_order_id: quotation.id,
        customerId: quotation.customerId,
        customer_name: customer.name,
        customer_phone: customer.phone,
        amount: quotation.total,
        status: status,
      },
    }, { status: 201 });

  } catch (error: any) {
    console.error('POST /api/payments error:', error);
    return NextResponse.json({ error: 'Erro ao criar pagamento' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

