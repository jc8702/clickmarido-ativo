import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
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

    // Permitir edição apenas se estiver em rascunho ou emitida
    if (existingOrder.status !== 'rascunho' && existingOrder.status !== 'emitida') {
      return NextResponse.json(
        { error: 'Não é possível editar ordem de compra que já foi aprovada, recebida ou cancelada' },
        { status: 400 }
      );
    }

    const updateData: any = {};
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

      // Registrar evento de alteração
      await tx.purchaseOrderEvent.create({
        data: {
          purchaseOrderId: id,
          type: 'edicao',
          description: 'Ordem de compra atualizada.',
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

    // Só permitir exclusão de rascunhos ou canceladas
    if (order.status !== 'rascunho' && order.status !== 'cancelada') {
      return NextResponse.json(
        { error: 'Não é possível excluir ordens de compra em trânsito (aprovadas/emitidas/recebidas)' },
        { status: 400 }
      );
    }

    await prisma.purchaseOrder.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: 'Ordem de compra excluída' });
  } catch (error) {
    console.error('DELETE /api/purchase-orders/[id] error:', error);
    return NextResponse.json({ error: 'Erro ao excluir ordem de compra' }, { status: 500 });
  }
}
