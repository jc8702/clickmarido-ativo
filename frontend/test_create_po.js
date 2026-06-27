const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const vendor = await prisma.vendor.findFirst();
  if (!vendor) {
    console.log('No vendor found');
    return;
  }
  
  const payload = {
    vendorId: vendor.id,
    expectedDeliveryDate: "",
    discountAmount: 0,
    freightAmount: 0,
    taxAmount: 0,
    items: [
      {
        description: "Test item",
        quantity: 1,
        unitPrice: 10,
        discountAmount: 0,
        taxAmount: 0
      }
    ]
  };
  
  try {
    let finalQuotationId = null;
    let finalServiceOrderId = null;
    let subtotal = 0;
    
    const itemsData = payload.items.map(item => {
      const q = parseFloat(item.quantity) || 1;
      const price = parseFloat(item.unitPrice) || 0;
      const disc = parseFloat(item.discountAmount) || 0;
      const tax = parseFloat(item.taxAmount) || 0;
      const itemSubtotal = q * price - disc + tax;

      subtotal += itemSubtotal;

      return {
        productId: item.productId || null,
        description: item.description || '',
        quantity: q,
        unit: item.unit || 'un',
        unitPrice: price,
        discountAmount: disc,
        taxAmount: tax,
        subtotal: itemSubtotal,
        notes: item.notes || '',
      };
    });

    const totalAmount = subtotal - parseFloat(payload.discountAmount) + parseFloat(payload.freightAmount) + parseFloat(payload.taxAmount);

    const purchaseOrder = await prisma.purchaseOrder.create({
      data: {
        number: 'TEST-' + Date.now(),
        vendorId: payload.vendorId,
        quotationId: finalQuotationId,
        serviceOrderId: finalServiceOrderId,
        status: 'rascunho',
        expectedDeliveryDate: payload.expectedDeliveryDate ? new Date(payload.expectedDeliveryDate) : null,
        subtotal,
        discountAmount: parseFloat(payload.discountAmount),
        freightAmount: parseFloat(payload.freightAmount),
        taxAmount: parseFloat(payload.taxAmount),
        totalAmount,
        items: {
          create: itemsData,
        },
        events: {
          create: {
            type: 'criacao',
            description: 'Ordem de compra criada no status rascunho.',
            newValue: { status: 'rascunho', totalAmount },
          },
        },
      },
    });
    console.log('Success:', purchaseOrder.id);
  } catch (error) {
    console.error('Error:', error);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
