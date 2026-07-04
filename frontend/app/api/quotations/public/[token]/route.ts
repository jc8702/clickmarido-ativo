import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

type RouteParams = { params: Promise<{ token: string }> };

export async function GET(
  request: NextRequest,
  { params }: RouteParams
): Promise<Response> {
  const { token } = await params;
  try {
    const quotation = await prisma.quotation.findUnique({
      where: { id: token },
      include: {
        customer: true,
        items: {
          include: { product: true },
        },
      },
    });

    if (!quotation) {
      return NextResponse.json({ error: 'Orçamento não encontrado' }, { status: 404 });
    }

    // Mapear dados para o formato esperado pelo frontend público
    const items = quotation.items.map((item: any) => ({
      name: item.product?.name || '',
      sku: item.product?.sku || '',
      description: item.product?.description || '',
      quantity: Number(item.quantity),
      unit_price: Number(item.unitPrice),
    }));

    return NextResponse.json({
      id: quotation.id,
      number: quotation.number,
      customer_name: quotation.customer?.name || 'Cliente',
      customer_phone: quotation.customer?.phone || '',
      valid_until: quotation.updatedAt,
      status: quotation.status,
      total: Number(quotation.total),
      subtotal: Number(quotation.total),
      discountPercentage: Number(quotation.discountPercentage || 0),
      notes: quotation.notes,
      paymentMethods: quotation.paymentMethods || '',
      executionDeadline: quotation.executionDeadline || '',
      paymentMethod: quotation.paymentMethod || 'PIX',
      installments: quotation.installments || 1,
      marginPercentage: Number(quotation.marginPercentage || 0),
      items,
    });

  } catch (error) {
    console.error('GET /api/quotations/public/[token] error:', error);
    return NextResponse.json({ error: 'Erro ao carregar orçamento' }, { status: 500 });
  } finally {
  }
}
