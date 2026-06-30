import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateToken } from '@/lib/auth';

export async function GET(request: NextRequest): Promise<Response> {
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
        include: { 
          customer: true,
          items: {
            include: { product: true }
          }
        },
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
  }
}

export async function POST(request: NextRequest): Promise<Response> {
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

    // Calcular total com Folga de Venda e Desconto percentual
    const subtotal = items.reduce(
      (sum: number, item: any) => sum + (item.quantity || 1) * (item.unit_price || item.price || 0),
      0
    );
    const marginPercentage = body.margin_percentage || 0;
    const discountPercentage = body.discount_percentage || 0;
    
    // Folga de Venda: percentual adicionado ao subtotal
    const marginAmount = subtotal * (marginPercentage / 100);
    const subtotalWithMargin = subtotal + marginAmount;
    
    // Desconto: percentual aplicado sobre o subtotal com folga
    const discountAmount = subtotalWithMargin * (discountPercentage / 100);
    
    // Total final = subtotal + folga - desconto
    const total = subtotalWithMargin - discountAmount;

    const notes = body.notes || '';

    // Gerar número de orçamento PRO-DDMMYYYY-XXXX
    const today = new Date();
    const dateStr = `${String(today.getDate()).padStart(2, '0')}${String(today.getMonth() + 1).padStart(2, '0')}${today.getFullYear()}`;
    const prefix = `PRO-${dateStr}-`;

    const lastQuotation = await prisma.quotation.findFirst({
      where: { number: { startsWith: prefix } },
      orderBy: { number: 'desc' },
    });

    let sequence = 1;
    if (lastQuotation && lastQuotation.number) {
      const lastSeqStr = lastQuotation.number.replace(prefix, '');
      const lastSeq = parseInt(lastSeqStr, 10);
      if (!isNaN(lastSeq)) {
        sequence = lastSeq + 1;
      }
    }
    
    const generatedNumber = `${prefix}${String(sequence).padStart(4, '0')}`;

    const quotation = await prisma.quotation.create({
      data: {
        number: generatedNumber,
        customerId,
        total,
        status: 'rascunho',
        notes,
        paymentMethods: body.payment_methods || '',
        executionDeadline: body.execution_deadline || '',
        paymentMethod: body.payment_method || 'PIX',
        installments: body.installments || 1,
        marginPercentage: body.margin_percentage || 0,
        discountPercentage: body.discount_percentage || 0,
      },
      include: { customer: true },
    });

    // Criar itens do orçamento
    for (const item of items) {
      const itemName = item.name || item.description || '';
      const itemPrice = item.unit_price || item.price || 0;
      const itemQuantity = item.quantity || 1;
      const itemProductId = item.product_id || null;
      const itemType = item.type || 'SERVICO';

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
          where: { name: itemName, type: itemType },
        });
      }

      // Se ainda não encontrou, criar um novo produto
      if (!product && itemName) {
        const sku = item.sku || `SVC-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
        product = await prisma.product.create({
          data: {
            name: itemName,
            sku,
            type: itemType,
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
            quantity: Number(itemQuantity),
            unitPrice: Number(itemPrice),
            costPrice: Number(item.cost_price) || 0,
            markup: Number(item.markup) || 1,
            subtotal: Number(itemQuantity) * Number(itemPrice),
          },
        });
      }
    }
    // Registrar log de auditoria
    const { logAudit } = await import('@/lib/audit');
    await logAudit({
      request,
      entity: 'quotation',
      entityId: quotation.id,
      action: 'created',
      newValue: {
        id: quotation.id,
        number: quotation.number,
        customerId: quotation.customerId,
        total: quotation.total,
        status: quotation.status,
        notes: quotation.notes,
      },
    });

    return NextResponse.json(quotation, { status: 201 });

  } catch (error: any) {
    console.error('POST /api/quotations error:', error);
    return NextResponse.json({ error: 'Erro ao criar orçamento: ' + (error.message || 'Erro desconhecido') }, { status: 500 });
}
}