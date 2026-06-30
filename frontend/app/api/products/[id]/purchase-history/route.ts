import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateToken } from '@/lib/auth';

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  try {
    if (!validateToken(request)) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    // Verificar se o produto existe
    const product = await prisma.product.findUnique({
      where: { id },
      include: { vendor: true },
    });

    if (!product) {
      return NextResponse.json({ error: 'Produto não encontrado' }, { status: 404 });
    }

    // 1. Buscar os itens de Pedido de Compra deste SKU
    const purchaseItems = await prisma.purchaseOrderItem.findMany({
      where: { productId: id },
      include: {
        purchaseOrder: {
          include: {
            vendor: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // 2. Buscar logs de alteração (AuditLog) para este SKU
    const auditLogs = await prisma.auditLog.findMany({
      where: {
        entity: 'product',
        entityId: id,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // 3. Compilar nomes de fornecedores referenciados em logs de auditoria
    const vendorIdsToFetch = new Set<string>();
    auditLogs.forEach((log: any) => {
      if (log.oldValue && typeof log.oldValue === 'object' && log.oldValue.vendorId) {
        vendorIdsToFetch.add(log.oldValue.vendorId);
      }
      if (log.newValue && typeof log.newValue === 'object' && log.newValue.vendorId) {
        vendorIdsToFetch.add(log.newValue.vendorId);
      }
    });

    const vendors = await prisma.vendor.findMany({
      where: {
        id: { in: Array.from(vendorIdsToFetch) },
      },
      select: {
        id: true,
        name: true,
      },
    });

    const vendorMap = new Map(vendors.map((v) => [v.id, v.name]));

    // 4. Estruturar a timeline unificada
    const timelineEvents: any[] = [];

    // Adicionar criação do produto
    timelineEvents.push({
      id: `created-${product.id}`,
      type: 'CREATION',
      date: product.createdAt,
      description: `Produto cadastrado no sistema${product.vendor ? ` com fornecedor padrão: ${product.vendor.name}` : ''}.`,
      price: product.price,
      createdBy: 'admin',
    });

    // Adicionar eventos de alteração de fornecedor
    auditLogs.forEach((log) => {
      const oldVendorId = (log.oldValue as any)?.vendorId;
      const newVendorId = (log.newValue as any)?.vendorId;
      
      const oldName = oldVendorId ? (vendorMap.get(oldVendorId) || `ID: ${oldVendorId}`) : 'Nenhum';
      const newName = newVendorId ? (vendorMap.get(newVendorId) || `ID: ${newVendorId}`) : 'Nenhum';

      timelineEvents.push({
        id: log.id,
        type: 'VENDOR_CHANGE',
        date: log.createdAt,
        description: `Fornecedor padrão alterado de "${oldName}" para "${newName}".`,
        createdBy: log.createdBy || 'Sistema',
      });
    });

    // Adicionar eventos de compras (PurchaseOrder)
    purchaseItems.forEach((item) => {
      timelineEvents.push({
        id: item.id,
        type: 'PURCHASE',
        date: item.purchaseOrder.issueDate,
        description: `Ordem de Compra ${item.purchaseOrder.number} (${item.purchaseOrder.status.toUpperCase()})`,
        purchaseOrderId: item.purchaseOrder.id,
        purchaseOrderNumber: item.purchaseOrder.number,
        vendorName: item.purchaseOrder.vendor.name,
        vendorId: item.purchaseOrder.vendorId,
        quantity: item.quantity,
        unit: item.unit,
        unitPrice: item.unitPrice,
        subtotal: item.subtotal,
        status: item.purchaseOrder.status,
      });
    });

    // Ordenar timeline (mais recente primeiro)
    timelineEvents.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Estatísticas de compra do SKU
    const completedPurchases = purchaseItems.filter(
      (item) => item.purchaseOrder.status === 'recebido' || item.purchaseOrder.status === 'aprovado'
    );
    
    const totalSpent = completedPurchases.reduce((acc, curr) => acc + Number(curr.subtotal), 0);
    const totalQty = completedPurchases.reduce((acc, curr) => acc + Number(curr.quantity), 0);
    const avgPrice = totalQty > 0 ? totalSpent / totalQty : 0;
    
    const lastPurchase = completedPurchases.length > 0 ? completedPurchases[0] : null;

    return NextResponse.json({
      product: {
        id: product.id,
        name: product.name,
        sku: product.sku,
        price: product.price,
        unit: product.unit,
        vendor: product.vendor,
      },
      timeline: timelineEvents,
      stats: {
        totalSpent,
        totalQty,
        avgPrice,
        lastPurchasePrice: lastPurchase ? lastPurchase.unitPrice : null,
        lastPurchaseVendor: lastPurchase ? lastPurchase.purchaseOrder.vendor.name : null,
      },
    });

  } catch (error) {
    console.error('GET /api/products/[id]/purchase-history error:', error);
    return NextResponse.json({ error: 'Erro ao carregar histórico do SKU' }, { status: 500 });
  }
}
