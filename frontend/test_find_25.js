const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  console.log('--- BUSCANDO REGISTROS DE VALOR 25 REAIS ---');
  
  try {
    // 1. Quotation
    const quotations = await prisma.quotation.findMany({
      where: { total: 25.00 },
      include: { customer: true }
    });
    console.log(`\nOrçamentos (Quotation): ${quotations.length}`);
    quotations.forEach(q => console.log(`- ID: ${q.id}, Num: ${q.number}, Cliente: ${q.customer?.name}, Status: ${q.status}, Data: ${q.createdAt}`));

    // 2. ServiceOrder
    const serviceOrders = await prisma.serviceOrder.findMany({
      where: { finalTotal: 25.00 },
      include: { customer: true }
    });
    console.log(`\nOrdens de Serviço (ServiceOrder): ${serviceOrders.length}`);
    serviceOrders.forEach(os => console.log(`- ID: ${os.id}, Num: ${os.number}, Cliente: ${os.customer?.name}, Status: ${os.status}, Data: ${os.createdAt}`));

    // 3. Payment
    const payments = await prisma.payment.findMany({
      where: { amount: 25.00 },
      include: { customer: true }
    });
    console.log(`\nPagamentos (Payment): ${payments.length}`);
    payments.forEach(p => console.log(`- ID: ${p.id}, Status: ${p.status}, Cliente: ${p.customer?.name}, Data: ${p.createdAt}, PaidAt: ${p.paidAt}`));

    // 4. FinancialTransaction
    const txs = await prisma.financialTransaction.findMany({
      where: {
        OR: [
          { credit: 25.00 },
          { debit: 25.00 }
        ]
      }
    });
    console.log(`\nTransações (FinancialTransaction): ${txs.length}`);
    txs.forEach(t => console.log(`- ID: ${t.id}, Tipo: ${t.type}, Credito: ${t.credit}, Debito: ${t.debit}, Saldo: ${t.balance}, Desc: ${t.description}, Data: ${t.createdAt}`));

    // 5. AccountReceivable
    const receivables = await prisma.accountReceivable.findMany({
      where: {
        OR: [
          { totalAmount: 25.00 },
          { paidAmount: 25.00 }
        ]
      },
      include: { customer: true }
    });
    console.log(`\nContas a Receber (AccountReceivable): ${receivables.length}`);
    receivables.forEach(r => console.log(`- ID: ${r.id}, Titulo: ${r.title}, Total: ${r.totalAmount}, Pago: ${r.paidAmount}, Status: ${r.status}, Data: ${r.createdAt}`));

    // 6. Expense
    const expenses = await prisma.expense.findMany({
      where: { amount: 25.00 }
    });
    console.log(`\nDespesas (Expense): ${expenses.length}`);
    expenses.forEach(e => console.log(`- ID: ${e.id}, Desc: ${e.description}, Status: ${e.status}, Data: ${e.createdAt}`));

    // 7. AccountPayable
    const payables = await prisma.accountPayable.findMany({
      where: {
        OR: [
          { totalAmount: 25.00 },
          { paidAmount: 25.00 }
        ]
      }
    });
    console.log(`\nContas a Pagar (AccountPayable): ${payables.length}`);
    payables.forEach(p => console.log(`- ID: ${p.id}, Titulo: ${p.title}, Total: ${p.totalAmount}, Pago: ${p.paidAmount}, Status: ${p.status}, Data: ${p.createdAt}`));

  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

run();
