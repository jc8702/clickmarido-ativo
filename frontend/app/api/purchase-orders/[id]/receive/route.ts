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

type RouteParams = { params: Promise<{ id: string }> };

// POST /api/purchase-orders/[id]/receive - Registrar recebimento de itens
export async function POST(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  try {
    if (!validateToken(request)) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const body = await request.json();
    const { items: receivedItems = [] } = body;

    if (!receivedItems || receivedItems.length === 0) {
      return NextResponse.json({ error: 'Nenhum item informado para recebimento' }, { status: 400 });
    }

    const purchaseOrder = await prisma.purchaseOrder.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!purchaseOrder) {
      return NextResponse.json({ error: 'Ordem de compra não encontrada' }, { status: 404 });
    }

    if (purchaseOrder.status !== 'aprovada' && purchaseOrder.status !== 'parcialmente_recebida') {
      return NextResponse.json(
        { error: 'Apenas ordens de compra em status "aprovada" ou "parcialmente_recebida" podem receber itens' },
        { status: 400 }
      );
    }

    const updatedOrder = await prisma.$transaction(async (tx) => {
      // 1. Atualizar cada item recebido
      for (const rx of receivedItems) {
        const dbItem = purchaseOrder.items.find(i => i.id === rx.itemId);
        if (!dbItem) continue;

        // Nova quantidade recebida acumulada
        const newReceivedQuantity = Number(dbItem.receivedQuantity) + parseFloat(rx.quantityReceived);
        let itemStatus = 'pendente';
        if (newReceivedQuantity >= Number(dbItem.quantity)) {
          itemStatus = 'recebido_total';
        } else if (newReceivedQuantity > 0) {
          itemStatus = 'recebido_parcial';
        }

        await tx.purchaseOrderItem.update({
          where: { id: rx.itemId },
          data: {
            receivedQuantity: newReceivedQuantity,
            status: itemStatus,
          },
        });
      }

      // 2. Buscar itens atualizados para recalcular o status global da OC
      const updatedItems = await tx.purchaseOrderItem.findMany({
        where: { purchaseOrderId: id },
      });

      const allTotal = updatedItems.every(i => i.status === 'recebido_total');
      const anyReceived = updatedItems.some(i => i.status === 'recebido_total' || i.status === 'recebido_parcial');

      let newOrderStatus = purchaseOrder.status;
      let deliveredAt = purchaseOrder.deliveredAt;

      if (allTotal) {
        newOrderStatus = 'recebida';
        deliveredAt = new Date();
      } else if (anyReceived) {
        newOrderStatus = 'parcialmente_recebida';
      }

      // 3. Registrar evento de histórico
      await tx.purchaseOrderEvent.create({
        data: {
          purchaseOrderId: id,
          type: 'recebimento',
          description: `Registrado recebimento de itens. Novo status da ordem: ${newOrderStatus}.`,
          newValue: { status: newOrderStatus, itemsReceived: receivedItems },
        },
      });

      // 4. Atualizar cabeçalho da OC
      return tx.purchaseOrder.update({
        where: { id },
        data: {
          status: newOrderStatus,
          deliveredAt,
        },
        include: {
          vendor: true,
          items: true,
          events: true,
        },
      });
    });

    return NextResponse.json(updatedOrder);
  } catch (error) {
    console.error('POST /api/purchase-orders/[id]/receive error:', error);
    return NextResponse.json({ error: 'Erro ao processar recebimento' }, { status: 500 });
  }
}
