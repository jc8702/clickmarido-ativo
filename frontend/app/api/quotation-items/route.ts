import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';
import { z } from 'zod';

const createItemSchema = z.object({
  quotationId: z.string().min(1, 'quotationId é obrigatório'),
  productId: z.string().min(1, 'productId é obrigatório'),
  quantity: z.number().positive('Quantidade deve ser positiva').default(1),
  notes: z.string().default(''),
});

export async function GET(request: NextRequest) {
  try {
    const authResult = await verifyAuth(request);
    if (!authResult.success) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const quotationId = searchParams.get('quotationId');

    const where: any = {};
    if (quotationId) {
      where.quotationId = quotationId;
    }

    const items = await prisma.quotationItem.findMany({
      where,
      include: {
        product: true,
        quotation: true,
      },
      orderBy: { id: 'asc' },
    });

    return NextResponse.json({ data: items });
  } catch (error) {
    console.error('Error listing quotation items:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await verifyAuth(request);
    if (!authResult.success) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = createItemSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { quotationId, productId, quantity, notes } = parsed.data;

    const quotation = await prisma.quotation.findUnique({
      where: { id: quotationId },
    });

    if (!quotation) {
      return NextResponse.json(
        { error: 'Orçamento não encontrado' },
        { status: 404 }
      );
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return NextResponse.json(
        { error: 'Produto não encontrado' },
        { status: 404 }
      );
    }

    if (!product.active) {
      return NextResponse.json(
        { error: 'Produto está inativo' },
        { status: 400 }
      );
    }

    const unitPrice = product.price;
    const subtotal = quantity * unitPrice;

    const item = await prisma.quotationItem.create({
      data: {
        quotationId,
        productId,
        quantity,
        unitPrice,
        subtotal,
        notes,
      },
      include: {
        product: true,
      },
    });

    const newTotal = await prisma.quotationItem.aggregate({
      where: { quotationId },
      _sum: { subtotal: true },
    });

    await prisma.quotation.update({
      where: { id: quotationId },
      data: { total: newTotal._sum.subtotal || 0 },
    });

    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    console.error('Error creating quotation item:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
