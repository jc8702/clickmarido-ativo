import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { productSchema } from '@/lib/validations/product.schema';
import { validateToken } from '@/lib/auth';

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    if (!validateToken(request)) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      );
    }

    const { id } = await params;

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        vendor: true,
      },
    });

    if (!product) {
      return NextResponse.json(
        { error: 'Produto não encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json(product);

  } catch (error) {
    console.error('GET /api/products/[id] error:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar produto' },
      { status: 500 }
    );
  } finally {
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const decoded = validateToken(request);
    if (!decoded) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      );
    }
    const userEmail = (decoded as any).email || 'admin';

    const { id } = await params;
    const body = await request.json();
    const parsed = productSchema.parse(body);

    const existing = await prisma.product.findFirst({
      where: { sku: parsed.sku, id: { not: id } },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'SKU já cadastrado para outro produto' },
        { status: 400 }
      );
    }

    const oldProduct = await prisma.product.findUnique({
      where: { id },
    });

    if (!oldProduct) {
      return NextResponse.json(
        { error: 'Produto não encontrado' },
        { status: 404 }
      );
    }

    const newVendorId = parsed.vendorId && parsed.vendorId.trim() !== '' ? parsed.vendorId : null;

    if (oldProduct.vendorId !== newVendorId) {
      await prisma.auditLog.create({
        data: {
          entity: 'product',
          entityId: id,
          action: 'updated',
          oldValue: { vendorId: oldProduct.vendorId },
          newValue: { vendorId: newVendorId },
          createdBy: userEmail,
        },
      });
    }

    const product = await prisma.product.update({
      where: { id },
      data: {
        name: parsed.name,
        sku: parsed.sku,
        type: parsed.type,
        description: parsed.description || '',
        price: parsed.price,
        unit: parsed.unit,
        category: parsed.category || '',
        active: parsed.active ?? true,
        vendorId: newVendorId,
        quantity: parsed.quantity,
        minStock: parsed.minStock,
        estimatedTime: parsed.estimatedTime,
        imageUrl: parsed.imageUrl || null,
      },
      include: {
        vendor: true,
      },
    });

    return NextResponse.json(product);

  } catch (error: any) {
    console.error('PUT /api/products/[id] error:', error);

    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Erro ao atualizar produto' },
      { status: 500 }
    );
  } finally {
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    if (!validateToken(request)) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      );
    }

    const { id } = await params;

    // Usar transação para garantir integridade referencial ao excluir Produto
    await prisma.$transaction(async (tx) => {
      // 1. Desvincular itens de ordem de compra (PurchaseOrderItem)
      await tx.purchaseOrderItem.updateMany({
        where: { productId: id },
        data: { productId: null },
      });

      // 2. Excluir o produto
      await tx.product.delete({
        where: { id },
      });
    });

    return NextResponse.json({ message: 'Produto excluído com sucesso' });

  } catch (error) {
    console.error('DELETE /api/products/[id] error:', error);
    return NextResponse.json(
      { error: 'Erro ao excluir produto' },
      { status: 500 }
    );
  } finally {
  }
}
