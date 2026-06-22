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

// POST /api/purchase-orders/[id]/cancel - Cancelar ordem de compra
export async function POST(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  try {
    if (!validateToken(request)) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const body = await request.json();
    const { reason = 'Cancelamento solicitado pelo usuário.' } = body;

    const purchaseOrder = await prisma.purchaseOrder.findUnique({
      where: { id },
      include: { expense: true },
    });

    if (!purchaseOrder) {
      return NextResponse.json({ error: 'Ordem de compra não encontrada' }, { status: 404 });
    }

    if (purchaseOrder.status === 'recebida') {
      return NextResponse.json(
        { error: 'Não é possível cancelar uma ordem de compra que já foi totalmente recebida' },
        { status: 400 }
      );
    }

    if (purchaseOrder.status === 'cancelada') {
      return NextResponse.json(
        { error: 'A ordem de compra já se encontra cancelada' },
        { status: 400 }
      );
    }

    const updatedOrder = await prisma.$transaction(async (tx) => {
      // 1. Atualizar despesa vinculada se ela existir e não estiver paga
      if (purchaseOrder.expenseId && purchaseOrder.expense) {
        if (purchaseOrder.expense.status === 'pendente') {
          await tx.expense.update({
            where: { id: purchaseOrder.expenseId },
            data: {
              status: 'cancelada',
              notes: `${purchaseOrder.expense.notes || ''}\nCancelada automaticamente devido ao cancelamento da Ordem de Compra ${purchaseOrder.number}.`,
            },
          });
        }
      }

      // 2. Registrar evento de histórico
      await tx.purchaseOrderEvent.create({
        data: {
          purchaseOrderId: id,
          type: 'cancelamento',
          description: `Ordem de compra cancelada. Motivo: ${reason}`,
          oldValue: { status: purchaseOrder.status },
          newValue: { status: 'cancelada' },
        },
      });

      // 3. Cancelar itens pendentes
      await tx.purchaseOrderItem.updateMany({
        where: {
          purchaseOrderId: id,
          status: 'pendente',
        },
        data: {
          status: 'cancelado',
        },
      });

      // 4. Atualizar cabeçalho da OC
      return tx.purchaseOrder.update({
        where: { id },
        data: {
          status: 'cancelada',
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
    console.error('POST /api/purchase-orders/[id]/cancel error:', error);
    return NextResponse.json({ error: 'Erro ao cancelar ordem de compra' }, { status: 500 });
  }
}
