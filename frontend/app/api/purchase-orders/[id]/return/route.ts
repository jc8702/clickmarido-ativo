import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prisma';
import { validateToken } from '@/lib/auth';

type RouteParams = { params: Promise<{ id: string }> };

// POST /api/purchase-orders/[id]/return - Registrar devolução de itens
export async function POST(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  try {
    const decoded = validateToken(request);
    if (!decoded) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }
    const userEmail = (decoded as any).email || 'admin';

    const body = await request.json();
    const { items: returnedItems = [], bankAccountId } = body;

    if (!returnedItems || returnedItems.length === 0) {
      return NextResponse.json({ error: 'Nenhum item informado para devolução' }, { status: 400 });
    }

    const purchaseOrder = await prisma.purchaseOrder.findUnique({
      where: { id },
      include: { items: { include: { product: true } } },
    });

    if (!purchaseOrder) {
      return NextResponse.json({ error: 'Ordem de compra não encontrada' }, { status: 404 });
    }

    if (purchaseOrder.status !== 'recebida' && purchaseOrder.status !== 'parcialmente_recebida') {
      return NextResponse.json(
        { error: 'Apenas ordens de compra recebidas ou parcialmente recebidas podem ter itens devolvidos' },
        { status: 400 }
      );
    }

    const updatedOrder = await prisma.$transaction(async (tx) => {
      let totalRefunded = 0;
      const detailsReturned: any[] = [];

      // 1. Processar cada item devolvido
      for (const rx of returnedItems) {
        const dbItem = purchaseOrder.items.find(i => i.id === rx.itemId);
        if (!dbItem) continue;

        const qtyToReturn = parseFloat(rx.quantityReturned);
        if (isNaN(qtyToReturn) || qtyToReturn <= 0) continue;

        if (qtyToReturn > Number(dbItem.receivedQuantity)) {
          throw new Error(`Quantidade de devolução (${qtyToReturn}) excede a quantidade recebida (${dbItem.receivedQuantity}) para o item "${dbItem.description}"`);
        }

        // Nova quantidade recebida acumulada
        const newReceivedQuantity = Number(dbItem.receivedQuantity) - qtyToReturn;
        let itemStatus = 'recebido_parcial';
        if (newReceivedQuantity === 0) {
          itemStatus = 'pendente';
        } else if (newReceivedQuantity >= Number(dbItem.quantity)) {
          itemStatus = 'recebido_total';
        }

        await tx.purchaseOrderItem.update({
          where: { id: rx.itemId },
          data: {
            receivedQuantity: newReceivedQuantity,
            status: itemStatus,
          },
        });

        // Decrementar o estoque físico do produto se for do tipo 'PECA'
        const qtyToDecrement = Math.round(qtyToReturn) || 0;
        if (dbItem.productId && dbItem.product?.type === 'PECA' && qtyToDecrement > 0) {
          // Validar estoque atual para não deixar negativo por acidente (opcional, mas recomendável)
          await tx.product.update({
            where: { id: dbItem.productId },
            data: {
              quantity: {
                decrement: qtyToDecrement,
              },
            },
          });
        }

        // Calcular valor proporcional do estorno
        // subtotal / quantity = valor unitário efetivo (com descontos e impostos aplicados)
        const originalQty = Number(dbItem.quantity) || 1;
        const itemSubtotal = Number(dbItem.subtotal) || 0;
        const unitRefundAmount = itemSubtotal / originalQty;
        const itemRefundTotal = qtyToReturn * unitRefundAmount;
        totalRefunded += itemRefundTotal;

        detailsReturned.push({
          itemId: rx.itemId,
          description: dbItem.description,
          quantityReturned: qtyToReturn,
          refundAmount: itemRefundTotal,
        });
      }

      // 2. Buscar itens atualizados para recalcular o status global da OC
      const updatedItems = await tx.purchaseOrderItem.findMany({
        where: { purchaseOrderId: id },
      });

      const allZero = updatedItems.every(i => Number(i.receivedQuantity) === 0);
      const anyReceived = updatedItems.some(i => Number(i.receivedQuantity) > 0);

      let newOrderStatus = purchaseOrder.status;
      let deliveredAt = purchaseOrder.deliveredAt;

      if (allZero) {
        newOrderStatus = 'devolvida'; // Novo status canônico de devolução total
        deliveredAt = null; // Limpa data de entrega completa
      } else if (anyReceived) {
        newOrderStatus = 'parcialmente_recebida';
      }

      // 3. Tratar reversão financeira se houver valor estornado e despesa vinculada
      if (totalRefunded > 0 && purchaseOrder.expenseId) {
        const existingExpense = await tx.expense.findUnique({
          where: { id: purchaseOrder.expenseId },
        });

        if (existingExpense) {
          const formattedRefund = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalRefunded);
          const refundNote = `\n[DEVOLUÇÃO EM ${new Date().toLocaleDateString('pt-BR')}] Reembolso de ${formattedRefund} gerado via devolução de itens da OC ${purchaseOrder.number}.`;

          if (newOrderStatus === 'devolvida') {
            // Devolution total: Cancela a despesa e anexa nota
            await tx.expense.update({
              where: { id: purchaseOrder.expenseId },
              data: {
                status: 'cancelada',
                notes: (existingExpense.notes || '') + refundNote,
              },
            });
          } else {
            // Devolution parcial: Mantém despesa como paga mas anexa nota informando o estorno parcial
            await tx.expense.update({
              where: { id: purchaseOrder.expenseId },
              data: {
                notes: (existingExpense.notes || '') + refundNote,
              },
            });
          }

          // Se a despesa estava paga, gera a transação de entrada (crédito) no livro caixa
          if (existingExpense.status === 'paga') {
            // Localizar conta de reembolso
            let refundAccount = null;
            if (bankAccountId) {
              refundAccount = await tx.bankAccount.findUnique({
                where: { id: bankAccountId }
              });
            }
            if (!refundAccount) {
              refundAccount = await tx.bankAccount.findFirst({
                where: { isDefault: true, status: 'ativa' }
              }) || await tx.bankAccount.findFirst({
                where: { status: 'ativa' }
              });
            }

            if (refundAccount) {
              // Atualizar saldo da conta
              await tx.bankAccount.update({
                where: { id: refundAccount.id },
                data: {
                  currentBalance: {
                    increment: totalRefunded
                  }
                }
              });
            }

            const lastTransaction = await tx.financialTransaction.findFirst({
              orderBy: { createdAt: 'desc' },
              select: { balance: true },
            });

            const prevBalance = lastTransaction?.balance ? Number(lastTransaction.balance) : 0;
            const newBalance = prevBalance + totalRefunded;

            const accountName = refundAccount ? (refundAccount.nickname || refundAccount.bankName) : 'Não especificada';

            await tx.financialTransaction.create({
              data: {
                type: 'EXPENSE_REFUND',
                expenseId: purchaseOrder.expenseId,
                credit: totalRefunded,
                debit: 0,
                balance: newBalance,
                description: `Estorno Parcial/Total de Compra (Reembolso OC): ${purchaseOrder.number}`,
                notes: `Devolução de itens do pedido. Categoria original: ${existingExpense.category} | Reembolso enviado para: ${accountName}`,
                transactionDate: new Date(),
              },
            });

            // Se for devolução total (devolvida), cancelar o Contas a Pagar vinculado à despesa
            if (newOrderStatus === 'devolvida') {
              await tx.accountPayable.updateMany({
                where: { expenseId: purchaseOrder.expenseId },
                data: {
                  status: 'cancelado',
                  notes: `Cancelado automaticamente via devolução total da ordem de compra.`
                }
              });
            }
          }

          // Registrar no log de auditoria da despesa
          await tx.auditLog.create({
            data: {
              entity: 'expense',
              entityId: purchaseOrder.expenseId,
              action: 'refunded',
              oldValue: { status: existingExpense.status, notes: existingExpense.notes },
              newValue: { 
                status: newOrderStatus === 'devolvida' ? 'cancelada' : existingExpense.status, 
                refundedAmount: totalRefunded 
              },
              createdBy: userEmail,
            },
          });
        }
      }

      // 4. Registrar evento de histórico na OC
      const formattedRefundTotal = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalRefunded);
      await tx.purchaseOrderEvent.create({
        data: {
          purchaseOrderId: id,
          type: 'devolucao',
          description: `Registrada devolução de itens. Valor estornado: ${formattedRefundTotal}. Novo status da ordem: ${newOrderStatus}.`,
          newValue: { 
            status: newOrderStatus, 
            itemsReturned: detailsReturned, 
            refundedAmount: totalRefunded 
          },
          createdBy: userEmail,
        },
      });

      // 5. Registrar log de auditoria global da OC
      await tx.auditLog.create({
        data: {
          entity: 'purchase_order',
          entityId: id,
          action: 'items_returned',
          oldValue: { status: purchaseOrder.status },
          newValue: { status: newOrderStatus, refundedAmount: totalRefunded },
          createdBy: userEmail,
        },
      });

      // 6. Atualizar cabeçalho da OC
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
  } catch (error: any) {
    console.error('POST /api/purchase-orders/[id]/return error:', error);
    return NextResponse.json({ error: error.message || 'Erro ao processar devolução' }, { status: 500 });
  }
}
