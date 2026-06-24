import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import * as jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
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

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!validateToken(request)) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const { id: serviceOrderId } = await params;
    const body = await request.json();
    const { productId, quantityUsed } = body;

    if (!productId || quantityUsed === undefined || quantityUsed <= 0) {
      return NextResponse.json({ error: 'Campos obrigatórios inválidos' }, { status: 400 });
    }

    // Verificar se a OS existe
    const serviceOrder = await prisma.serviceOrder.findUnique({
      where: { id: serviceOrderId }
    });

    if (!serviceOrder) {
      return NextResponse.json({ error: 'Ordem de serviço não encontrada' }, { status: 404 });
    }

    // Verificar se o produto existe
    const product = await prisma.product.findUnique({
      where: { id: productId }
    });

    if (!product) {
      return NextResponse.json({ error: 'Produto/Peça não encontrada' }, { status: 404 });
    }

    // Registrar o consumo
    const usage = await prisma.productUsage.create({
      data: {
        serviceOrderId,
        productId,
        quantityUsed: Number(quantityUsed),
      },
      include: { product: true }
    });

    // Se for peça física, abater do estoque
    let updatedQuantity = product.quantity;
    let isLowStock = false;

    if (product.type === 'PECA') {
      const newQty = Math.max(0, product.quantity - Number(quantityUsed));
      const updatedProduct = await prisma.product.update({
        where: { id: productId },
        data: { quantity: newQty }
      });
      updatedQuantity = updatedProduct.quantity;
      isLowStock = updatedProduct.quantity <= updatedProduct.minStock;

      // Criar notificação se estoque estiver baixo
      if (isLowStock) {
        // Obter os usuários administradores para notificar
        const admins = await prisma.user.findMany({ where: { role: 'admin' } });
        for (const admin of admins) {
          await prisma.notification.create({
            data: {
              userId: admin.id,
              type: 'MATERIAL_LOW_STOCK',
              title: 'Estoque Baixo',
              message: `O estoque do item ${product.name} (SKU: ${product.sku}) chegou a ${updatedQuantity} (Mínimo: ${product.minStock}).`,
              relatedEntityId: product.id,
              relatedEntityType: 'product'
            }
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        usage,
        newQuantity: updatedQuantity,
        isLowStock
      }
    }, { status: 201 });

  } catch (error) {
    console.error('POST /api/service-orders/[id]/materials error:', error);
    return NextResponse.json(
      { error: 'Erro ao registrar consumo de materiais' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!validateToken(request)) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const { id: serviceOrderId } = await params;

    const usages = await prisma.productUsage.findMany({
      where: { serviceOrderId },
      include: { product: true },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({
      success: true,
      data: usages
    });
  } catch (error) {
    console.error('GET /api/service-orders/[id]/materials error:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar materiais consumidos' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
