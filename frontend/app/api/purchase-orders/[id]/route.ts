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

    // Permitir edição se estiver em rascunho, emitida, aprovada ou parcialmente_recebida
    const editableStatuses = ['rascunho', 'emitida', 'aprovada', 'parcialmente_recebida'];
    if (!editableStatuses.includes(existingOrder.status)) {
      return NextResponse.json(
        { error: 'Não é possível editar ordem de compra que já foi totalmente recebida ou cancelada' },
        { status: 400 }
      );
    }

    // Se for aprovada, verificar se a despesa correspondente não está paga
    if (existingOrder.status === 'aprovada' && existingOrder.expenseId) {
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

    // Validar e atualizar fornecedor se fornecido
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

      // Se houver despesa vinculada, atualizar o valor e descrição para manter a integridade
      if (existingOrder.expenseId) {
        const vendorForDesc = vendorId && vendorId !== existingOrder.vendorId
          ? await tx.vendor.findUnique({ where: { id: vendorId }, select: { name: true } })
          : null;
        const vendorName = vendorForDesc?.name || null;
        await tx.expense.update({
          where: { id: existingOrder.expenseId },
          data: {
            amount: totalAmount,
            description: `Ordem de Compra ${existingOrder.number}${vendorName ? ` - ${vendorName}` : ''} (Atualizada)`,
          }
        });
      }

      // Registrar evento de alteração
      await tx.purchaseOrderEvent.create({
        data: {
          purchaseOrderId: id,
          type: 'edicao',
          description: `Ordem de compra atualizada. Novo total: R$ ${Number(totalAmount).toFixed(2)}.`,
          oldValue: { totalAmount: existingOrder.totalAmount },
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
    });

    if (!order) {
      return NextResponse.json({ error: 'Ordem de compra não encontrada' }, { status: 404 });
    }

    // Permitir exclusão de rascunho, emitida, cancelada e aprovada (desde que a despesa não esteja paga)
    const deletableStatuses = ['rascunho', 'emitida', 'cancelada', 'aprovada'];
    if (!deletableStatuses.includes(order.status)) {
      return NextResponse.json(
        { error: 'Não é possível excluir ordens de compra que já foram total ou parcialmente recebidas' },
        { status: 400 }
      );
    }

    // Se for aprovada, verificar se a despesa correspondente está paga
    if (order.status === 'aprovada' && order.expenseId) {
      const associatedExpense = await prisma.expense.findUnique({
        where: { id: order.expenseId }
      });
      if (associatedExpense && associatedExpense.status === 'paga') {
        return NextResponse.json(
          { error: 'Não é possível excluir uma ordem de compra aprovada cujo faturamento financeiro já foi pago' },
          { status: 400 }
        );
      }
    }

    // Excluir em transação (deleta itens, eventos e despesa vinculada se houver)
    await prisma.$transaction(async (tx) => {
      // 1. Deletar os itens da OC
      await tx.purchaseOrderItem.deleteMany({
        where: { purchaseOrderId: id }
      });

      // 2. Deletar os eventos da OC
      await tx.purchaseOrderEvent.deleteMany({
        where: { purchaseOrderId: id }
      });

      // 3. Deletar a OC
      await tx.purchaseOrder.delete({
        where: { id }
      });

      // 4. Deletar despesa vinculada pendente (se houver)
      if (order.expenseId) {
        await tx.expense.delete({
          where: { id: order.expenseId }
        });
      }
    });

    return NextResponse.json({ success: true, message: 'Ordem de compra excluída' });
  } catch (error) {
    console.error('DELETE /api/purchase-orders/[id] error:', error);
    return NextResponse.json({ error: 'Erro ao excluir ordem de compra' }, { status: 500 });
  }
}
