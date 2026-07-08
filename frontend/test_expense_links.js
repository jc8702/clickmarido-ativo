const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testExpenseLinks() {
  console.log('=== TESTE DE INCLUSÃO DE RELACIONAMENTOS DE ORIGEM EM DESPESAS ===');

  let vendor = null;
  let serviceOrder = null;
  let quotation = null;
  let customer = null;
  let expense = null;
  let purchaseOrder = null;

  try {
    // 1. Criar dependências básicas
    customer = await prisma.customer.create({
      data: {
        name: 'Cliente Teste Despesa',
        email: 'cliente@despesa.com',
        phone: '11999999999',
      }
    });

    quotation = await prisma.quotation.create({
      data: {
        customerId: customer.id,
        number: 'Q-EXP-TEST',
        status: 'aprovada',
        total: 100.00,
      }
    });

    serviceOrder = await prisma.serviceOrder.create({
      data: {
        number: 'OS-EXP-TEST',
        quotationId: quotation.id,
        customerId: customer.id,
        status: 'agendada',
      }
    });
    console.log(`[OK] Ordem de Serviço criada: ${serviceOrder.number}`);

    vendor = await prisma.vendor.create({
      data: {
        name: 'Fornecedor Teste Despesa',
        cnpjCpf: '11122233344',
        category: 'MATERIAL',
      }
    });

    // 2. Criar Despesa com serviceOrderId
    expense = await prisma.expense.create({
      data: {
        description: 'Despesa com OS e OC vinculadas',
        category: 'MATERIAL',
        amount: 150.00,
        vendorId: vendor.id,
        serviceOrderId: serviceOrder.id,
        documentType: 'NOTA_FISCAL',
        documentNumber: 'NF-999888',
        attachmentUrl: 'https://exemplo.com/comprovante.pdf',
      }
    });
    console.log(`[OK] Despesa criada: ID ${expense.id}`);

    // 3. Criar Ordem de Compra vinculada a despesa
    purchaseOrder = await prisma.purchaseOrder.create({
      data: {
        number: 'OC-EXP-TEST',
        vendorId: vendor.id,
        expenseId: expense.id,
        subtotal: 150.00,
        totalAmount: 150.00,
      }
    });
    console.log(`[OK] Ordem de Compra vinculada à despesa criada: ${purchaseOrder.number}`);

    // 4. Testar a lógica do GET (simulando a API route.ts)
    const result = await prisma.expense.findFirst({
      where: { id: expense.id },
      include: {
        vendor: { select: { id: true, name: true } },
        serviceOrder: { select: { id: true, number: true } },
        purchaseOrders: {
          include: {
            items: {
              include: {
                product: { select: { sku: true, name: true } }
              }
            }
          }
        }
      }
    });

    console.log('\n--- Resultado do include na API ---');
    console.log(`Despesa: "${result.description}"`);
    console.log(`Ordem de Serviço (esperado OS-EXP-TEST): ${result.serviceOrder?.number || 'NÃO ENCONTRADA'}`);
    console.log(`Ordens de Compra Vinculadas (esperado 1): ${result.purchaseOrders.length}`);
    if (result.purchaseOrders.length > 0) {
      console.log(`- Primeira OC: ${result.purchaseOrders[0].number}`);
    }
    console.log(`Documento fiscal: ${result.documentType} #${result.documentNumber}`);
    console.log(`Anexo URL: ${result.attachmentUrl}`);

    if (result.serviceOrder?.number === 'OS-EXP-TEST' && result.purchaseOrders.length === 1 && result.purchaseOrders[0].number === 'OC-EXP-TEST') {
      console.log('\n=== TESTE COMPLETO PASSOU COM SUCESSO! ===');
    } else {
      throw new Error('As relações de OS ou OC não foram trazidas corretamente pela query de testes.');
    }

  } catch (error) {
    console.error('\n❌ ERRO DETECTADO NO TESTE:');
    console.error(error);
  } finally {
    console.log('\nLimpando registros temporários de teste...');
    if (purchaseOrder) {
      try { await prisma.purchaseOrder.delete({ where: { id: purchaseOrder.id } }); } catch (e) {}
    }
    if (expense) {
      try { await prisma.expense.delete({ where: { id: expense.id } }); } catch (e) {}
    }
    if (vendor) {
      try { await prisma.vendor.delete({ where: { id: vendor.id } }); } catch (e) {}
    }
    if (serviceOrder) {
      try { await prisma.serviceOrder.delete({ where: { id: serviceOrder.id } }); } catch (e) {}
    }
    if (quotation) {
      try { await prisma.quotation.delete({ where: { id: quotation.id } }); } catch (e) {}
    }
    if (customer) {
      try { await prisma.customer.delete({ where: { id: customer.id } }); } catch (e) {}
    }
    await prisma.$disconnect();
    console.log('Conexão encerrada.');
  }
}

testExpenseLinks();
