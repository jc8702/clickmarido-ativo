import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
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

// GET /api/purchase-orders - Listar ordens de compra com filtros e paginação
export async function GET(request: NextRequest) {
  try {
    if (!validateToken(request)) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status');
    const vendorId = searchParams.get('vendorId');
    const quotationId = searchParams.get('quotationId');
    const serviceOrderId = searchParams.get('serviceOrderId');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const minTotal = parseFloat(searchParams.get('minTotal') || '');
    const maxTotal = parseFloat(searchParams.get('maxTotal') || '');
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status) where.status = status;
    if (vendorId) where.vendorId = vendorId;
    if (quotationId) where.quotationId = quotationId;
    if (serviceOrderId) where.serviceOrderId = serviceOrderId;

    if (dateFrom || dateTo) {
      where.issueDate = {};
      if (dateFrom) where.issueDate.gte = new Date(dateFrom);
      if (dateTo) where.issueDate.lte = new Date(dateTo);
    }

    if (!isNaN(minTotal) || !isNaN(maxTotal)) {
      where.totalAmount = {};
      if (!isNaN(minTotal)) where.totalAmount.gte = minTotal;
      if (!isNaN(maxTotal)) where.totalAmount.lte = maxTotal;
    }

    if (search) {
      where.OR = [
        { number: { contains: search, mode: 'insensitive' } },
        { vendor: { name: { contains: search, mode: 'insensitive' } } },
        { requestedBy: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [purchaseOrders, total] = await Promise.all([
      prisma.purchaseOrder.findMany({
        where,
        include: {
          vendor: { select: { id: true, name: true, classification: true } },
          _count: { select: { items: true } },
        },
        skip,
        take: limit,
        orderBy: { issueDate: 'desc' },
      }),
      prisma.purchaseOrder.count({ where }),
    ]);

    return NextResponse.json({
      data: purchaseOrders,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('GET /api/purchase-orders error:', error);
    return NextResponse.json({ error: 'Erro ao listar ordens de compra' }, { status: 500 });
  }
}

// POST /api/purchase-orders - Criar nova ordem de compra
export async function POST(request: NextRequest) {
  try {
    if (!validateToken(request)) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const body = await request.json();
    const {
      vendorId,
      quotationId,
      serviceOrderId,
      expectedDeliveryDate,
      paymentTerms,
      paymentMethod,
      costCenter,
      requestedBy,
      deliveryAddress,
      discountAmount = 0,
      freightAmount = 0,
      taxAmount = 0,
      internalNotes,
      supplierTerms,
      items = [],
      attachments,
      metadata,
    } = body;

    if (!vendorId) {
      return NextResponse.json({ error: 'Fornecedor é obrigatório' }, { status: 400 });
    }

    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'Ordem de compra precisa de ao menos um item' }, { status: 400 });
    }

    // Verificar se fornecedor existe e não está bloqueado
    const vendor = await prisma.vendor.findUnique({
      where: { id: vendorId },
    });

    if (!vendor) {
      return NextResponse.json({ error: 'Fornecedor não encontrado' }, { status: 404 });
    }

    if (vendor.isBlocked) {
      return NextResponse.json({ error: 'Fornecedor bloqueado não pode receber nova ordem de compra' }, { status: 400 });
    }

    // Resolver quotationId (pode ser ID ou number)
    let finalQuotationId = null;
    if (quotationId) {
      const quotation = await prisma.quotation.findFirst({
        where: { OR: [{ id: quotationId }, { number: quotationId }] }
      });
      if (!quotation) {
        return NextResponse.json({ error: 'Orçamento vinculado não encontrado' }, { status: 400 });
      }
      finalQuotationId = quotation.id;
    }

    // Resolver serviceOrderId (pode ser ID ou number)
    let finalServiceOrderId = null;
    if (serviceOrderId) {
      const serviceOrder = await prisma.serviceOrder.findFirst({
        where: { OR: [{ id: serviceOrderId }, { number: serviceOrderId }] }
      });
      if (!serviceOrder) {
        return NextResponse.json({ error: 'Ordem de Serviço vinculada não encontrada' }, { status: 400 });
      }
      finalServiceOrderId = serviceOrder.id;
    }

    // Calcular totais
    let subtotal = 0;
    const itemsData = items.map((item: any) => {
      const q = parseFloat(item.quantity) || 1;
      const price = parseFloat(item.unitPrice) || 0;
      const disc = parseFloat(item.discountAmount) || 0;
      const tax = parseFloat(item.taxAmount) || 0;
      const itemSubtotal = q * price - disc + tax;

      subtotal += itemSubtotal;

      return {
        productId: item.productId || null,
        description: item.description || '',
        quantity: q,
        unit: item.unit || 'un',
        unitPrice: price,
        discountAmount: disc,
        taxAmount: tax,
        subtotal: itemSubtotal,
        notes: item.notes || '',
      };
    });

    const totalAmount = subtotal - parseFloat(discountAmount) + parseFloat(freightAmount) + parseFloat(taxAmount);
    const orderNumber = await generateOrderNumber();

    // Criar ordem de compra em transação
    const purchaseOrder = await prisma.purchaseOrder.create({
      data: {
        number: orderNumber,
        vendorId,
        quotationId: finalQuotationId,
        serviceOrderId: finalServiceOrderId,
        status: 'rascunho',
        expectedDeliveryDate: expectedDeliveryDate ? new Date(expectedDeliveryDate) : null,
        paymentTerms: paymentTerms || '',
        paymentMethod: paymentMethod || '',
        costCenter: costCenter || '',
        requestedBy: requestedBy || '',
        deliveryAddress: deliveryAddress || '',
        subtotal,
        discountAmount: parseFloat(discountAmount),
        freightAmount: parseFloat(freightAmount),
        taxAmount: parseFloat(taxAmount),
        totalAmount,
        internalNotes: internalNotes || '',
        supplierTerms: supplierTerms || '',
        attachments: attachments || null,
        metadata: metadata || null,
        items: {
          create: itemsData,
        },
        events: {
          create: {
            type: 'criacao',
            description: 'Ordem de compra criada no status rascunho.',
            newValue: { status: 'rascunho', totalAmount },
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
    console.error('POST /api/purchase-orders error:', error);
    return NextResponse.json({ error: 'Erro ao criar ordem de compra' }, { status: 500 });
  }
}
