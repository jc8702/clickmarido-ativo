import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prisma';
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

async function generateOrderNumber() {
  const currentYear = new Date().getFullYear();
  const yearStr = currentYear.toString();

  const lastOrder = await prisma.purchaseOrder.findFirst({
    where: {
      number: {
        startsWith: `OC-${yearStr}-`,
      },
    },
    orderBy: {
      number: 'desc',
    },
    select: { number: true },
  });

  let nextSequence = 1;
  if (lastOrder) {
    const parts = lastOrder.number.split('-');
    if (parts.length === 3) {
      const lastSeq = parseInt(parts[2], 10);
      if (!isNaN(lastSeq)) {
        nextSequence = lastSeq + 1;
      }
    }
  }

  const seqStr = nextSequence.toString().padStart(6, '0');
  return `OC-${yearStr}-${seqStr}`;
}

type RouteParams = { params: Promise<{ quotationId: string }> };

// POST /api/purchase-orders/from-quotation/[quotationId] - Criar OC a partir de Orçamento
export async function POST(request: NextRequest, { params }: RouteParams) {
  const { quotationId } = await params;
  try {
    if (!validateToken(request)) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const body = await request.json();
    const { vendorId } = body;

    if (!vendorId) {
      return NextResponse.json({ error: 'Fornecedor é obrigatório' }, { status: 400 });
    }

    // Buscar orçamento e seus itens
    const quotation = await prisma.quotation.findUnique({
      where: { id: quotationId },
      include: {
        customer: true,
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!quotation) {
      return NextResponse.json({ error: 'Orçamento não encontrado' }, { status: 404 });
    }

    // Verificar fornecedor
    const vendor = await prisma.vendor.findUnique({
      where: { id: vendorId },
    });

    if (!vendor) {
      return NextResponse.json({ error: 'Fornecedor não encontrado' }, { status: 404 });
    }

    if (vendor.isBlocked) {
      return NextResponse.json({ error: 'Fornecedor bloqueado não pode receber nova ordem de compra' }, { status: 400 });
    }

    // Filtrar apenas peças do orçamento
    const pieceItems = quotation.items.filter(item => item.product.type === 'PECA');

    if (pieceItems.length === 0) {
      return NextResponse.json(
        { error: 'Este orçamento não possui itens do tipo "PEÇA" cadastrados.' },
        { status: 400 }
      );
    }

    // Mapear itens para a Ordem de Compra
    let subtotal = 0;
    const itemsData = pieceItems.map((item) => {
      const q = Number(item.quantity);
      // Preço unitário da compra pode iniciar igual ao preço do produto ou 0
      const price = Number(item.product.price || 0);
      const itemSubtotal = q * price;
      subtotal += itemSubtotal;

      return {
        productId: item.productId,
        description: item.product.name,
        quantity: q,
        unit: item.product.unit || 'un',
        unitPrice: price,
        discountAmount: 0,
        taxAmount: 0,
        subtotal: itemSubtotal,
        notes: `Importado do orçamento ${quotation.number || quotation.id}`,
      };
    });

    const orderNumber = await generateOrderNumber();

    // Obter endereço de entrega a partir do endereço do cliente
    let deliveryAddress = '';
    try {
      const addresses = quotation.customer.addresses as any[];
      if (Array.isArray(addresses) && addresses.length > 0) {
        const addr = addresses[0];
        deliveryAddress = `${addr.street || ''}, ${addr.number || ''} - ${addr.city || ''}/${addr.state || ''}`;
      }
    } catch {
      // Ignorar erros de parse de endereço
    }

    // Criar Ordem de Compra
    const purchaseOrder = await prisma.purchaseOrder.create({
      data: {
        number: orderNumber,
        vendorId,
        quotationId,
        status: 'rascunho',
        deliveryAddress,
        requestedBy: 'Importação Automática',
        subtotal,
        totalAmount: subtotal,
        internalNotes: `Ordem de compra gerada automaticamente a partir do Orçamento ID ${quotation.number || quotation.id}.`,
        items: {
          create: itemsData,
        },
        events: {
          create: {
            type: 'criacao',
            description: `Ordem de compra criada a partir do Orçamento ID ${quotation.number || quotation.id}.`,
            newValue: { status: 'rascunho', totalAmount: subtotal },
          },
        },
      },
      include: {
        items: true,
        events: true,
      },
    });

    return NextResponse.json(purchaseOrder, { status: 201 });
  } catch (error) {
    console.error('POST /api/purchase-orders/from-quotation error:', error);
    return NextResponse.json({ error: 'Erro ao criar ordem de compra a partir do orçamento' }, { status: 500 });
  }
}
