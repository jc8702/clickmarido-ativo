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

    // Mapear dados para o formato esperado pelo frontend público (com a diluição do deslocamento)
    const travelDistance = Number(quotation.travelDistance) || 0;
    const travelRate = Number(quotation.travelRate) || 0;
    const travelTotal = travelDistance * travelRate;
    const share = quotation.items.length > 0 ? (travelTotal / quotation.items.length) : 0;

    const items = quotation.items.map((item: any) => {
      const qty = Number(item.quantity) || 1;
      const unitPriceOriginal = Number(item.unitPrice);
      const unitPriceWithTravel = share > 0 ? (unitPriceOriginal + (share / qty)) : unitPriceOriginal;

      return {
        name: item.product?.name || item.name || '',
        sku: item.product?.sku || item.sku || '',
        description: item.product?.description || item.description || '',
        quantity: Number(item.quantity),
        unit_price: unitPriceWithTravel,
      };
    });


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
