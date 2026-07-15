import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🧹 Limpando dados genéricos/mockados...\n');

  // Limpar dados financeiros criados anteriormente (genéricos)
  await prisma.bankReconciliation.deleteMany();
  await prisma.bankTransfer.deleteMany();
  await prisma.accountReceivable.deleteMany();
  await prisma.accountPayable.deleteMany();
  await prisma.recurringExpense.deleteMany();
  await prisma.bankAccount.deleteMany();
  await prisma.chartOfAccount.deleteMany();

  console.log('✅ Dados genéricos removidos!\n');

  // Buscar dados REAIS do sistema
  console.log('📊 Buscando dados REAIS do sistema...\n');

  // 1. Pagamentos confirmados (entradas)
  const payments = await prisma.payment.findMany({
    where: { status: 'confirmado' },
    include: {
      customer: { select: { id: true, name: true, phone: true } },
      quotation: { select: { id: true, number: true } },
      invoice: { select: { id: true, invoiceNumber: true } },
    },
    orderBy: { paidAt: 'desc' },
  });
  console.log(`   💰 ${payments.length} pagamentos confirmados encontrados`);

  // 2. Faturas (invoices)
  const invoices = await prisma.invoice.findMany({
    include: {
      customer: { select: { id: true, name: true } },
      payments: true,
    },
    orderBy: { issueDate: 'desc' },
  });
  console.log(`   📄 ${invoices.length} faturas encontradas`);

  // 3. Despesas
  const expenses = await prisma.expense.findMany({
    include: {
      vendor: { select: { id: true, name: true, tradeName: true } },
      purchaseOrders: { select: { id: true, number: true } },
    },
    orderBy: { expenseDate: 'desc' },
  });
  console.log(`   📤 ${expenses.length} despesas encontradas`);

  // 4. Ordens de Compra
  const purchaseOrders = await prisma.purchaseOrder.findMany({
    include: {
      vendor: { select: { id: true, name: true, tradeName: true } },
      items: true,
    },
    orderBy: { issueDate: 'desc' },
  });
  console.log(`   🛒 ${purchaseOrders.length} ordens de compra encontradas`);

  // 5. Clientes
  const customers = await prisma.customer.findMany({
    select: { id: true, name: true, phone: true },
  });
  console.log(`   👥 ${customers.length} clientes encontrados`);

  // 6. Fornecedores
  const vendors = await prisma.vendor.findMany({
    select: { id: true, name: true, tradeName: true },
  });
  console.log(`   🏪 ${vendors.length} fornecedores encontrados`);

  console.log('\n═══════════════════════════════════════════');
  console.log('📋 DADOS REAIS IDENTIFICADOS:');
  console.log('═══════════════════════════════════════════\n');

  // Listar pagamentos
  if (payments.length > 0) {
    console.log('💰 PAGAMENTOS (Entradas):');
    payments.forEach(p => {
      console.log(`   - ${p.customer?.name || 'N/A'} | R$ ${p.amount} | ${p.paidAt ? new Date(p.paidAt).toLocaleDateString('pt-BR') : 'S/N'} | ${p.method}`);
    });
  }

  // Listar despesas
  if (expenses.length > 0) {
    console.log('\n📤 DESPESAS (Saídas):');
    expenses.forEach(e => {
      console.log(`   - ${e.description} | R$ ${e.amount} | ${e.vendor?.name || e.vendorName || 'N/A'} | ${e.status}`);
    });
  }

  // Listar OCs
  if (purchaseOrders.length > 0) {
    console.log('\n🛒 ORDENS DE COMPRA:');
    purchaseOrders.forEach(po => {
      console.log(`   - ${po.number} | ${po.vendor?.name || 'N/A'} | R$ ${po.totalAmount} | ${po.status}`);
    });
  }

  console.log('\n✅ Análise concluída. Dados prontos para migração!');
}

main()
  .catch((e) => {
    console.error('❌ Erro:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
