import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';
import { z } from 'zod';

const updateItemSchema = z.object({
  quantity: z.number().positive('Quantidade deve ser positiva').optional(),
  unitPrice: z.number().positive('Preço deve ser positivo').optional(),
  notes: z.string().optional(),
});

async function recalculateTotal(quotationId: string) {
  const total = await prisma.quotationItem.aggregate({
    where: { quotationId },
    _sum: { subtotal: true },
  });

  await prisma.quotation.update({
    where: { id: quotationId },
    data: { total: total._sum.subtotal || 0 },
  });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await verifyAuth(request);
    if (!authResult.success) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const parsed = updateItemSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const existingItem = await prisma.quotationItem.findUnique({
      where: { id },
    });

    if (!existingItem) {
      return NextResponse.json(
        { error: 'Item não encontrado' },
        { status: 404 }
      );
    }

    const updateData: any = { ...parsed.data };

    if (parsed.data.quantity !== undefined || parsed.data.unitPrice !== undefined) {
      const quantity = parsed.data.quantity ?? existingItem.quantity;
      const unitPrice = parsed.data.unitPrice ?? existingItem.unitPrice;
      updateData.subtotal = quantity * unitPrice;
    }

    const item = await prisma.quotationItem.update({
      where: { id },
      data: updateData,
      include: {
        product: true,
      },
    });

    await recalculateTotal(existingItem.quotationId);

    return NextResponse.json(item);
  } catch (error) {
    console.error('Error updating quotation item:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await verifyAuth(request);
    if (!authResult.success) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const existingItem = await prisma.quotationItem.findUnique({
      where: { id },
    });

    if (!existingItem) {
      return NextResponse.json(
        { error: 'Item não encontrado' },
        { status: 404 }
      );
    }

    await prisma.quotationItem.delete({
      where: { id },
    });

    await recalculateTotal(existingItem.quotationId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting quotation item:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
