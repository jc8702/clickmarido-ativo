/**
 * SCRIPT PARA VERIFICAR OS DADOS DO BANCO DE DADOS REAL
 */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  console.log('--- VERIFICANDO DADOS REAIS ---');

  // 1. Ordens de Serviço
  const serviceOrders = await prisma.serviceOrder.findMany({
    include: { customer: true, quotation: true }
  });
  console.log(`\nServiceOrders (${serviceOrders.length}):`);
  serviceOrders.forEach(so => {
    console.log(`- ID: ${so.id}, Número: ${so.number}, Status: ${so.status}, Total: R$ ${Number(so.finalTotal).toFixed(2)}, Cliente: ${so.customer?.name || 'N/A'}, Conclusão: ${so.completedAt}`);
  });

  // 2. Orçamentos
  const quotations = await prisma.quotation.findMany({
    include: { customer: true }
  });
  console.log(`\nQuotations (${quotations.length}):`);
  quotations.forEach(q => {
    console.log(`- ID: ${q.id}, Número: ${q.number || 'N/A'}, Status: ${q.status}, Total: R$ ${Number(q.total).toFixed(2)}, Cliente: ${q.customer?.name || 'N/A'}`);
  });

  // 3. Ordens de Compra
  const purchaseOrders = await prisma.purchaseOrder.findMany({
    include: { vendor: true, items: true }
  });
  console.log(`\nPurchaseOrders (${purchaseOrders.length}):`);
  purchaseOrders.forEach(po => {
    const total = po.items.reduce((s, i) => s + Number(i.quantity) * Number(i.unitPrice), 0);
    console.log(`- ID: ${po.id}, Número: ${po.number || 'N/A'}, Status: ${po.status}, Total: R$ ${total.toFixed(2)}, Fornecedor: ${po.vendor?.name || 'N/A'}`);
  });

  // 4. Pagamentos
  const payments = await prisma.payment.findMany({
    include: { customer: true }
  });
  console.log(`\nPayments (${payments.length}):`);
  payments.forEach(p => {
    console.log(`- ID: ${p.id}, Status: ${p.status}, Valor: R$ ${Number(p.amount).toFixed(2)}, Cliente: ${p.customer?.name || 'N/A'}, Data: ${p.paidAt}`);
  });

  // 5. Despesas
  const expenses = await prisma.expense.findMany({
    include: { vendor: true }
  });
  console.log(`\nExpenses (${expenses.length}):`);
  expenses.forEach(e => {
    console.log(`- ID: ${e.id}, Categoria: ${e.category}, Status: ${e.status}, Valor: R$ ${Number(e.amount).toFixed(2)}, Descrição: ${e.description}`);
  });

  // 6. Contas a Receber
  const receivables = await prisma.accountReceivable.findMany();
  console.log(`\nAccountReceivables (${receivables.length}):`);
  receivables.forEach(r => {
    console.log(`- ID: ${r.id}, Título: ${r.title}, Status: ${r.status}, Valor: R$ ${Number(r.totalAmount).toFixed(2)}, Pago: R$ ${Number(r.paidAmount).toFixed(2)}, Vencimento: ${r.dueDate}`);
  });

  // 7. Contas a Pagar
  const payables = await prisma.accountPayable.findMany();
  console.log(`\nAccountPayables (${payables.length}):`);
  payables.forEach(p => {
    console.log(`- ID: ${p.id}, Título: ${p.title}, Status: ${p.status}, Valor: R$ ${Number(p.totalAmount).toFixed(2)}, Pago: R$ ${Number(p.paidAmount).toFixed(2)}, Vencimento: ${p.dueDate}`);
  });

  // 8. Faturas
  const invoices = await prisma.invoice.findMany();
  console.log(`\nInvoices (${invoices.length}):`);
  invoices.forEach(i => {
    console.log(`- ID: ${i.id}, Número: ${i.invoiceNumber}, Status: ${i.status}, Total: R$ ${Number(i.totalAmount).toFixed(2)}`);
  });

}

check()
  .then(() => process.exit(0))
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
