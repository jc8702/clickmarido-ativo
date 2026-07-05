import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { validateToken } from '@/lib/auth';

type RouteParams = { params: Promise<{ id: string }> };

// GET /api/purchase-orders/[id] - Detalhes da Ordem de Compra
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  try {
    if (!validateToken(request)) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const purchaseOrder = await prisma.purchaseOrder.findUnique({
      where: { id },
      include: {
        vendor: true,
        quotation: { select: { id: true, total: true, status: true } },
        serviceOrder: { select: { id: true, number: true, status: true } },
        expense: { select: { id: true, category: true, amount: true, status: true } },
        items: {
          include: {
            product: { select: { id: true, name: true, sku: true, type: true } },
          },
        },
        events: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!purchaseOrder) {
      return NextResponse.json({ error: 'Ordem de compra não encontrada' }, { status: 404 });
    }

    return NextResponse.json(purchaseOrder);
  } catch (error) {
    console.error('GET /api/purchase-orders/[id] error:', error);
    return NextResponse.json({ error: 'Erro ao buscar ordem de compra' }, { status: 500 });
  }
}

// PUT /api/purchase-orders/[id] - Editar Ordem de Compra
export async function PUT(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  try {
    if (!validateToken(request)) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const body = await request.json();
    const {
      vendorId,
      expectedDeliveryDate,
      paymentTerms,
      paymentMethod,
      costCenter,
      requestedBy,
      deliveryAddress,
      discountAmount,
      freightAmount,
      taxAmount,
      internalNotes,
      supplierTerms,
      items,
      attachments,
      metadata,
    } = body;

    const existingOrder = await prisma.purchaseOrder.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!existingOrder) {
      return NextResponse.json({ error: 'Ordem de compra não encontrada' }, { status: 404 });
    }

    // Permitir edição em qualquer status exceto 'cancelada'
    if (existingOrder.status === 'cancelada') {
      return NextResponse.json(
        { error: 'Não é possível editar uma ordem de compra cancelada' },
        { status: 400 }
      );
    }

    // Verificar se a despesa correspondente não está paga (bloqueia edição apenas se paga)
    if (existingOrder.expenseId) {
      const associatedExpense = await prisma.expense.findUnique({
        where: { id: existingOrder.expenseId }
      });
      if (associatedExpense && associatedExpense.status === 'paga') {
        return NextResponse.json(
          { error: 'Não é possível editar uma ordem de compra cujo faturamento financeiro já foi pago' },
          { status: 400 }
        );
      }
    }

    // Validar fornecedor se fornecido e diferente do atual
    if (vendorId !== undefined && vendorId !== existingOrder.vendorId) {
      const vendor = await prisma.vendor.findUnique({ where: { id: vendorId } });
      if (!vendor) {
        return NextResponse.json({ error: 'Fornecedor não encontrado' }, { status: 400 });
      }
      if (vendor.isBlocked) {
        return NextResponse.json({ error: 'Fornecedor bloqueado não pode ser associado a uma ordem de compra' }, { status: 400 });
      }
    }

    const updateData: any = {};
    if (vendorId !== undefined) updateData.vendorId = vendorId;
    if (expectedDeliveryDate !== undefined) {
      updateData.expectedDeliveryDate = expectedDeliveryDate ? new Date(expectedDeliveryDate) : null;
    }
    if (paymentTerms !== undefined) updateData.paymentTerms = paymentTerms;
    if (paymentMethod !== undefined) updateData.paymentMethod = paymentMethod;
    if (costCenter !== undefined) updateData.costCenter = costCenter;
    if (requestedBy !== undefined) updateData.requestedBy = requestedBy;
    if (deliveryAddress !== undefined) updateData.deliveryAddress = deliveryAddress;
    if (internalNotes !== undefined) updateData.internalNotes = internalNotes;
    if (supplierTerms !== undefined) updateData.supplierTerms = supplierTerms;
    if (attachments !== undefined) updateData.attachments = attachments;
    if (metadata !== undefined) updateData.metadata = metadata;

    const disc = discountAmount !== undefined ? parseFloat(discountAmount) : Number(existingOrder.discountAmount);
    const freight = freightAmount !== undefined ? parseFloat(freightAmount) : Number(existingOrder.freightAmount);
    const tax = taxAmount !== undefined ? parseFloat(taxAmount) : Number(existingOrder.taxAmount);

    updateData.discountAmount = disc;
    updateData.freightAmount = freight;
    updateData.taxAmount = tax;

    // Transação para atualizar itens e cabeçalho
    const updatedOrder = await prisma.$transaction(async (tx) => {
      let subtotal = Number(existingOrder.subtotal);

      if (items !== undefined) {
        if (items.length === 0) {
          throw new Error('A ordem de compra precisa de ao menos um item');
        }

        // Deletar itens antigos
        await tx.purchaseOrderItem.deleteMany({
          where: { purchaseOrderId: id },
        });

        // Criar novos itens e calcular subtotal
        subtotal = 0;
        const newItemsData = items.map((item: any) => {
          const q = parseFloat(item.quantity) || 1;
          const price = parseFloat(item.unitPrice) || 0;
          const itemDisc = parseFloat(item.discountAmount) || 0;
          const itemTax = parseFloat(item.taxAmount) || 0;
          const itemSubtotal = q * price - itemDisc + itemTax;

          subtotal += itemSubtotal;

          return {
            purchaseOrderId: id,
            productId: item.productId || null,
            description: item.description || '',
            quantity: q,
            unit: item.unit || 'un',
            unitPrice: price,
            discountAmount: itemDisc,
            taxAmount: itemTax,
            subtotal: itemSubtotal,
            notes: item.notes || '',
          };
        });

        await tx.purchaseOrderItem.createMany({
          data: newItemsData,
        });
      }

      const totalAmount = subtotal - disc + freight + tax;
      updateData.subtotal = subtotal;
      updateData.totalAmount = totalAmount;

      // Integração financeira: criar ou atualizar despesa vinculada
      // Determinar o fornecedor atual (pode ter mudado)
      const currentVendorId = vendorId !== undefined ? vendorId : existingOrder.vendorId;
      const currentVendor = await tx.vendor.findUnique({
        where: { id: currentVendorId },
        select: { name: true, category: true },
      });

      // Status que devem ter despesa vinculada no financeiro
      const statusesWithExpense = ['aprovada', 'parcialmente_recebida', 'recebida'];
      const shouldHaveExpense = statusesWithExpense.includes(existingOrder.status);

      if (shouldHaveExpense) {
        let currentExpenseId = existingOrder.expenseId;

        // Verificar se a despesa ainda existe no banco (pode ter sido deletada manualmente)
        let expenseStillExists = false;
        if (currentExpenseId) {
          const existingExpense = await tx.expense.findUnique({ where: { id: currentExpenseId } });
          expenseStillExists = !!existingExpense;
        }

        if (expenseStillExists && currentExpenseId) {
          // ATUALIZAR despesa existente
          await tx.expense.update({
            where: { id: currentExpenseId },
            data: {
              amount: totalAmount,
              vendorId: currentVendorId,
              vendorName: currentVendor?.name || null,
              description: `Ordem de Compra ${existingOrder.number}${currentVendor?.name ? ` - ${currentVendor.name}` : ''} (Atualizada)`,
            },
          });
        } else {
          // CRIAR nova despesa (foi deletada ou nunca criada)
          const allowedCategories = ['MATERIAL', 'SERVICO', 'TRANSPORTE', 'OUTROS'];
          const expenseCategory = currentVendor?.category && allowedCategories.includes(currentVendor.category)
            ? currentVendor.category
            : 'MATERIAL';

          const isReceived = existingOrder.status === 'recebida';
          const payDate = new Date();

          const newExpense = await tx.expense.create({
            data: {
              category: expenseCategory,
              description: `Ordem de Compra ${existingOrder.number}${currentVendor?.name ? ` - ${currentVendor.name}` : ''} (Recriada na Edição)`,
              amount: totalAmount,
              vendorId: currentVendorId,
              vendorName: currentVendor?.name || null,
              expenseDate: new Date(),
              dueDate: existingOrder.expectedDeliveryDate || new Date(),
              status: isReceived ? 'paga' : 'pendente',
              paidAt: isReceived ? payDate : null,
              serviceOrderId: existingOrder.serviceOrderId || null,
              notes: `Despesa recriada automaticamente na edição da Ordem de Compra ${existingOrder.number}.`,
            },
          });
          currentExpenseId = newExpense.id;
          // Vincular nova despesa à OC
          updateData.expenseId = currentExpenseId;

          // Se a despesa foi recriada diretamente como paga (porque a OC já estava recebida), registrar no Livro Caixa
          if (isReceived) {
            const lastTransaction = await tx.financialTransaction.findFirst({
              orderBy: { createdAt: 'desc' },
              select: { balance: true },
            });

            const prevBalance = lastTransaction?.balance ? Number(lastTransaction.balance) : 0;
            const newBalance = prevBalance - Number(totalAmount);

            await tx.financialTransaction.create({
              data: {
                type: 'EXPENSE_PAID',
                expenseId: currentExpenseId,
                credit: 0,
                debit: totalAmount,
                balance: newBalance,
                description: `Pagamento de Despesa (Automático via Recriação de OC Recebida): ${newExpense.description}`,
                notes: `Categoria: ${newExpense.category}`,
                transactionDate: payDate,
              },
            });
          }
        }
      }

      // Registrar evento de alteração no histórico de auditoria
      await tx.purchaseOrderEvent.create({
        data: {
          purchaseOrderId: id,
          type: 'edicao',
          description: `Ordem de compra editada. Novo total: R$ ${Number(totalAmount).toFixed(2)}.`,
          oldValue: { totalAmount: existingOrder.totalAmount, status: existingOrder.status },
          newValue: { totalAmount },
        },
      });

      return tx.purchaseOrder.update({
        where: { id },
        data: updateData,
        include: { items: true },
      });
    });

    return NextResponse.json(updatedOrder);
  } catch (error: any) {
    console.error('PUT /api/purchase-orders/[id] error:', error);
    return NextResponse.json({ error: error.message || 'Erro ao atualizar ordem de compra' }, { status: 500 });
  }
}

// DELETE /api/purchase-orders/[id] - Excluir Ordem de Compra
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  try {
    if (!validateToken(request)) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const order = await prisma.purchaseOrder.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: { select: { id: true, type: true } },
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Ordem de compra não encontrada' }, { status: 404 });
    }

    // Verificar se a despesa correspondente está paga (único bloqueio absoluto)
    if (order.expenseId) {
      const associatedExpense = await prisma.expense.findUnique({
        where: { id: order.expenseId }
      });
      if (associatedExpense && associatedExpense.status === 'paga') {
        return NextResponse.json(
          { error: 'Não é possível excluir uma ordem de compra cujo faturamento financeiro já foi pago' },
          { status: 400 }
        );
      }
    }

    // Excluir em transação com estorno de estoque se necessário
    await prisma.$transaction(async (tx) => {
      // 1. Estornar estoque dos itens que foram recebidos (para ordens recebidas ou parcialmente recebidas)
      if (order.status === 'recebida' || order.status === 'parcialmente_recebida') {
        for (const item of order.items) {
          const receivedQty = Math.round(Number(item.receivedQuantity)) || 0;
          if (receivedQty > 0 && item.productId && item.product?.type === 'PECA') {
            await tx.product.update({
              where: { id: item.productId },
              data: {
                quantity: {
                  decrement: receivedQty,
                },
              },
            });
          }
        }
      }

      // 2. Deletar os itens da OC
      await tx.purchaseOrderItem.deleteMany({
        where: { purchaseOrderId: id }
      });

      // 3. Deletar os eventos da OC
      await tx.purchaseOrderEvent.deleteMany({
        where: { purchaseOrderId: id }
      });

      // 4. Deletar a OC
      await tx.purchaseOrder.delete({
        where: { id }
      });

      // 5. Deletar despesa vinculada (se houver e ainda existir no banco)
      if (order.expenseId) {
        await tx.expense.deleteMany({
          where: { id: order.expenseId }
        });
      }
    });

    return NextResponse.json({ success: true, message: 'Ordem de compra excluída com sucesso' });
  } catch (error) {
    console.error('DELETE /api/purchase-orders/[id] error:', error);
    return NextResponse.json({ error: 'Erro ao excluir ordem de compra' }, { status: 500 });
  }
}
