import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prisma';
import { validateToken } from '@/lib/auth';

type RouteParams = { params: Promise<{ id: string }> };

// POST /api/purchase-orders/[id]/emit - Emitir ordem de compra (enviar ao fornecedor)
export async function POST(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  try {
    if (!validateToken(request)) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const purchaseOrder = await prisma.purchaseOrder.findUnique({
      where: { id },
      include: { vendor: true, items: true },
    });

    if (!purchaseOrder) {
      return NextResponse.json({ error: 'Ordem de compra não encontrada' }, { status: 404 });
    }

    if (purchaseOrder.status !== 'rascunho') {
      return NextResponse.json(
        { error: 'Apenas ordens de compra em status "rascunho" podem ser emitidas' },
        { status: 400 }
      );
    }

    if (purchaseOrder.vendor.isBlocked) {
      return NextResponse.json(
        { error: 'O fornecedor desta ordem de compra está bloqueado' },
        { status: 400 }
      );
    }

    if (purchaseOrder.items.length === 0) {
      return NextResponse.json(
        { error: 'A ordem de compra precisa de ao menos um item para ser emitida' },
        { status: 400 }
      );
    }

    const updatedOrder = await prisma.$transaction(async (tx) => {
      // Criar evento de histórico
      await tx.purchaseOrderEvent.create({
        data: {
          purchaseOrderId: id,
          type: 'emissao',
          description: 'Ordem de compra emitida e enviada ao fornecedor.',
          oldValue: { status: purchaseOrder.status },
          newValue: { status: 'emitida' },
        },
      });

      return tx.purchaseOrder.update({
        where: { id },
        data: {
          status: 'emitida',
          issueDate: new Date(),
        },
      });
    });

    return NextResponse.json(updatedOrder);
  } catch (error) {
    console.error('POST /api/purchase-orders/[id]/emit error:', error);
    return NextResponse.json({ error: 'Erro ao emitir ordem de compra' }, { status: 500 });
  }
}
