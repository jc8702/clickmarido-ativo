import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prisma';
import { validateToken } from '@/lib/auth';

type RouteParams = { params: Promise<{ id: string }> };

// POST /api/purchase-orders/[id]/approve - Aprovar ordem de compra e gerar despesa
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

    if (purchaseOrder.status !== 'rascunho' && purchaseOrder.status !== 'emitida') {
      return NextResponse.json(
        { error: 'Apenas ordens de compra em status "rascunho" ou "emitida" podem ser aprovadas' },
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
        { error: 'A ordem de compra precisa de ao menos um item para ser aprovada' },
        { status: 400 }
      );
    }

    // Definir categoria da despesa com base na categoria do fornecedor
    let expenseCategory = 'MATERIAL';
    const allowedCategories = ['MATERIAL', 'SERVICO', 'TRANSPORTE', 'OUTROS'];
    if (allowedCategories.includes(purchaseOrder.vendor.category)) {
      expenseCategory = purchaseOrder.vendor.category;
    }

    const updatedOrder = await prisma.$transaction(async (tx) => {
      // 1. Criar a Despesa no financeiro se ainda não houver uma vinculada
      let expenseId = purchaseOrder.expenseId;

      if (!expenseId) {
        const dueDate = purchaseOrder.expectedDeliveryDate || new Date();
        const expense = await tx.expense.create({
          data: {
            category: expenseCategory,
            description: `Ordem de Compra ${purchaseOrder.number}`,
            amount: purchaseOrder.totalAmount,
            vendorId: purchaseOrder.vendorId,
            vendorName: purchaseOrder.vendor.name,
            expenseDate: new Date(),
            dueDate,
            status: 'pendente',
            serviceOrderId: purchaseOrder.serviceOrderId || null,
            notes: `Gerada automaticamente na aprovação da Ordem de Compra ${purchaseOrder.number}.`,
          },
        });
        expenseId = expense.id;
      }

      // 2. Criar evento de histórico
      await tx.purchaseOrderEvent.create({
        data: {
          purchaseOrderId: id,
          type: 'aprovacao',
          description: `Ordem de compra aprovada. Despesa pendente gerada no financeiro (ID: ${expenseId}).`,
          oldValue: { status: purchaseOrder.status },
          newValue: { status: 'aprovada', expenseId },
        },
      });

      // 3. Atualizar a Ordem de Compra
      return tx.purchaseOrder.update({
        where: { id },
        data: {
          status: 'aprovada',
          expenseId,
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
    console.error('POST /api/purchase-orders/[id]/approve error:', error);
    return NextResponse.json({ error: 'Erro ao aprovar ordem de compra' }, { status: 500 });
  }
}
