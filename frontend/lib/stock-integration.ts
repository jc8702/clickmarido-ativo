import { prisma } from '@/lib/prisma';

/**
 * Migra os itens do tipo PECA de um orçamento (Quotation)
 * para a Ordem de Serviço (ServiceOrder) correspondente,
 * registrando o consumo de materiais e abatendo do estoque.
 */
export async function integrateQuotationItemsToStock(serviceOrderId: string, quotationId: string) {
  try {
    // 1. Buscar os itens do orçamento que são peças
    const quotationItems = await prisma.quotationItem.findMany({
      where: { quotationId },
      include: { product: true }
    });

    for (const item of quotationItems) {
      if (item.product.type === 'PECA') {
        const qty = Number(item.quantity);

        // Verificar se esse consumo já não foi registrado (evitar duplicidade)
        const existingUsage = await prisma.productUsage.findFirst({
          where: {
            serviceOrderId,
            productId: item.productId,
          }
        });

        if (existingUsage) {
          continue; // Já migrado
        }
        
        // Registrar o consumo
        await prisma.productUsage.create({
          data: {
            serviceOrderId,
            productId: item.productId,
            quantityUsed: qty,
          }
        });

        // Abater do estoque do produto
        const newQty = Math.max(0, item.product.quantity - qty);
        const updatedProduct = await prisma.product.update({
          where: { id: item.productId },
          data: { quantity: newQty }
        });

        // Notificar se estoque estiver baixo
        if (updatedProduct.quantity <= updatedProduct.minStock) {
          const admins = await prisma.user.findMany({ where: { role: 'admin' } });
          for (const admin of admins) {
            await prisma.notification.create({
              data: {
                userId: admin.id,
                type: 'MATERIAL_LOW_STOCK',
                title: 'Estoque Baixo',
                message: `O estoque do item ${updatedProduct.name} (SKU: ${updatedProduct.sku}) chegou a ${updatedProduct.quantity} (Mínimo: ${updatedProduct.minStock}).`,
                relatedEntityId: updatedProduct.id,
                relatedEntityType: 'product'
              }
            });
          }
        }
      }
    }
  } catch (error) {
    console.error('[Stock Integration Error] Failed to integrate quotation items to OS stock:', error);
  }
}
