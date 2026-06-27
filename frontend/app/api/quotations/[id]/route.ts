import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import * as jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET;

function validateToken(request: NextRequest) {
  if (!JWT_SECRET) {
    return NextResponse.json({ error: 'Configuração inválida' }, { status: 500 });
  }

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

export async function GET(
  request: NextRequest,
  { params }: RouteParams
): Promise<Response> {
  const { id } = await params;
  try {
    if (!validateToken(request)) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const quotation = await prisma.quotation.findUnique({
      where: { id },
      include: {
        customer: true,
        items: {
          include: { product: true },
        },
        warranties: true,
      },
    });

    if (!quotation) {
      return NextResponse.json({ error: 'Orçamento não encontrado' }, { status: 404 });
    }

    return NextResponse.json(quotation);

  } catch (error) {
    console.error('GET /api/quotations/[id] error:', error);
    return NextResponse.json({ error: 'Erro ao carregar orçamento' }, { status: 500 });
  } finally {
  }
}

export async function PUT(
  request: NextRequest,
  { params }: RouteParams
): Promise<Response> {
  const { id } = await params;
  try {
    if (!validateToken(request)) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const oldValue = await prisma.quotation.findUnique({
      where: { id },
      select: { id: true, customerId: true, total: true, status: true, notes: true },
    });

    const body = await request.json();

    // Update quotation basic fields
    const updateData: any = {};
    if (body.status) updateData.status = body.status;
    if (body.notes !== undefined) updateData.notes = body.notes;
    if (body.total !== undefined) updateData.total = body.total;
    if (body.payment_methods !== undefined) updateData.paymentMethods = body.payment_methods;
    if (body.execution_deadline !== undefined) updateData.executionDeadline = body.execution_deadline;
    if (body.payment_method !== undefined) updateData.paymentMethod = body.payment_method;
    if (body.installments !== undefined) updateData.installments = body.installments;
    if (body.margin_percentage !== undefined) updateData.marginPercentage = body.margin_percentage;
    if (body.discount_percentage !== undefined) updateData.discountPercentage = body.discount_percentage;

    const quotation = await prisma.quotation.update({
      where: { id },
      data: updateData,
      include: { customer: true },
    });

    // If items were sent, replace all QuotationItem records
    if (body.items && Array.isArray(body.items)) {
      // Delete existing items
      await prisma.quotationItem.deleteMany({
        where: { quotationId: id },
      });

      // Calculate total from items with Folga de Venda and Desconto percentual
      const subtotal = body.items.reduce(
        (sum: number, item: any) => sum + (item.quantity || 1) * (item.unit_price || 0),
        0
      );
      const marginPercentage = body.margin_percentage || 0;
      const discountPercentage = body.discount_percentage || 0;
      
      // Folga de Venda: percentual adicionado ao subtotal
      const marginAmount = subtotal * (marginPercentage / 100);
      const subtotalWithMargin = subtotal + marginAmount;
      
      // Desconto: percentual aplicado sobre o subtotal com folga
      const discountAmount = subtotalWithMargin * (discountPercentage / 100);
      
      // Total final = subtotal + folga - desconto
      const total = subtotalWithMargin - discountAmount;

      // Update total
      await prisma.quotation.update({
        where: { id },
        data: { total },
      });

      // Create new items
      for (const item of body.items) {
        const itemName = item.name || '';
        const itemPrice = item.unit_price || 0;
        const itemQuantity = item.quantity || 1;
        const itemProductId = item.product_id || null;

        // Find or create product
        let product = null;
        if (itemProductId) {
          product = await prisma.product.findUnique({
            where: { id: itemProductId },
          });
        }

        if (!product && itemName) {
          product = await prisma.product.findFirst({
            where: { name: itemName },
          });
        }

        if (!product && itemName) {
          const sku = item.sku || `SVC-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
          product = await prisma.product.create({
            data: {
              name: itemName,
              sku,
              type: item.type || 'SERVICO',
              price: itemPrice,
              unit: 'un',
            },
          });
        }

        if (product) {
          await prisma.quotationItem.create({
            data: {
              quotationId: id,
              productId: product.id,
              quantity: Number(itemQuantity),
              unitPrice: Number(itemPrice),
              costPrice: Number(item.cost_price) || 0,
              markup: Number(item.markup) || 1,
              subtotal: Number(itemQuantity) * Number(itemPrice),
            },
          });
        }
      }
    }

    // Auto-create ServiceOrder when approving quotation
    if (body.status === 'aceito') {
      const existingOS = await prisma.serviceOrder.findFirst({
        where: { quotationId: id },
      });

      if (!existingOS) {
        const customer = await prisma.customer.findUnique({
          where: { id: quotation.customerId },
        });
        const addresses = (customer as any)?.addresses;
        const firstAddress = Array.isArray(addresses) && addresses.length > 0 ? addresses[0] : null;
        const address = firstAddress
          ? [firstAddress.street, firstAddress.number, firstAddress.neighborhood, firstAddress.city, firstAddress.state].filter(Boolean).join(', ')
          : '';

        // Generate sequential OS number
        const lastOS = await prisma.serviceOrder.findFirst({
          orderBy: { number: 'desc' },
          select: { number: true },
        });
        let osNumber = 'OS-0001';
        if (lastOS) {
          const match = lastOS.number.match(/(\d+)$/);
          if (match) {
            osNumber = `OS-${String(parseInt(match[1], 10) + 1).padStart(4, '0')}`;
          }
        }

        await prisma.serviceOrder.create({
          data: {
            number: osNumber,
            quotationId: id,
            customerId: quotation.customerId,
            status: 'agendada',
            address,
            finalTotal: quotation.total,
            notes: `Orçamento ${id.slice(-6).toUpperCase()} aprovado`,
          },
        });
      }
    }
    // Return updated quotation with items
    const updated = await prisma.quotation.findUnique({
      where: { id },
      include: {
        customer: true,
        items: { include: { product: true } },
      },
    });

    // Registrar log de auditoria
    const { logAudit } = await import('@/lib/audit');
    await logAudit({
      request,
      entity: 'quotation',
      entityId: id,
      action: 'updated',
      oldValue,
      newValue: {
        id: updated?.id,
        customerId: updated?.customerId,
        total: updated?.total,
        status: updated?.status,
        notes: updated?.notes,
      },
    });

    return NextResponse.json(updated);

  } catch (error: any) {
    console.error('PUT /api/quotations/[id] error:', error);

    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Orçamento não encontrado' }, { status: 404 });
    }

    return NextResponse.json({ error: 'Erro ao atualizar orçamento' }, { status: 500 });
  } finally {
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
): Promise<Response> {
  const { id } = await params;
  try {
    if (!validateToken(request)) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const oldValue = await prisma.quotation.findUnique({
      where: { id },
      select: { id: true, customerId: true, total: true, status: true, notes: true },
    });

    await prisma.quotation.delete({ where: { id } });

    // Registrar log de auditoria
    const { logAudit } = await import('@/lib/audit');
    await logAudit({
      request,
      entity: 'quotation',
      entityId: id,
      action: 'deleted',
      oldValue,
    });

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('DELETE /api/quotations/[id] error:', error);

    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Orçamento não encontrado' }, { status: 404 });
    }

    return NextResponse.json({ error: 'Erro ao deletar orçamento' }, { status: 500 });
  } finally {
  }
}
