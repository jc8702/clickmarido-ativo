import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prisma';
import { validateToken } from '@/lib/auth';
import { syncExpensePaid } from '@/lib/finance-sync';

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
      include: { items: { include: { product: true } } },
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

        // Incrementar o estoque físico do produto se for do tipo 'PECA'
        const qtyToAdd = Math.round(parseFloat(rx.quantityReceived)) || 0;
        if (dbItem.productId && dbItem.product?.type === 'PECA' && qtyToAdd > 0) {
          await tx.product.update({
            where: { id: dbItem.productId },
            data: {
              quantity: {
                increment: qtyToAdd,
              },
            },
          });
        }
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

      // Se a OC foi recebida totalmente e tem uma despesa vinculada que ainda não foi paga, baixá-la
      if (newOrderStatus === 'recebida' && purchaseOrder.expenseId) {
        const existingExpense = await tx.expense.findUnique({
          where: { id: purchaseOrder.expenseId },
        });

        if (existingExpense && existingExpense.status !== 'paga') {
          const payDate = new Date();

          // 1. Atualizar o status da despesa para 'paga'
          const updatedExpense = await tx.expense.update({
            where: { id: purchaseOrder.expenseId },
            data: {
              status: 'paga',
              paidAt: payDate,
            },
          });

          // 2. Registrar transação de pagamento no Livro Caixa (FinancialTransaction)
          const lastTransaction = await tx.financialTransaction.findFirst({
            orderBy: { createdAt: 'desc' },
            select: { balance: true },
          });

          const prevBalance = lastTransaction?.balance ? Number(lastTransaction.balance) : 0;
          const newBalance = prevBalance - Number(updatedExpense.amount);

          await tx.financialTransaction.create({
            data: {
              type: 'EXPENSE_PAID',
              expenseId: purchaseOrder.expenseId,
              credit: 0,
              debit: updatedExpense.amount,
              balance: newBalance,
              description: `Pagamento de Despesa (Automático via Recebimento OC): ${updatedExpense.description}`,
              notes: `Categoria: ${updatedExpense.category}${updatedExpense.costCenter ? ` | Centro de Custo: ${updatedExpense.costCenter}` : ''}`,
              transactionDate: payDate,
            },
          });

          // Sincronizar com contas bancárias e contas a pagar
          await syncExpensePaid(purchaseOrder.expenseId, tx);

          // 3. Registrar no log de auditoria
          await tx.auditLog.create({
            data: {
              entity: 'expense',
              entityId: purchaseOrder.expenseId,
              action: 'status_changed',
              oldValue: { status: existingExpense.status },
              newValue: { status: 'paga', paidAt: payDate },
            },
          });
        }
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
