const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const txs = await prisma.financialTransaction.findMany({
    orderBy: { transactionDate: 'asc' }
  });
  console.log('=== TRANSAÇÕES NO LIVRO CAIXA ===');
  txs.forEach(t => {
    console.log(`- ID: ${t.id}, Data: ${t.transactionDate.toLocaleDateString('pt-BR')}, Tipo: ${t.type}, Crédito: R$ ${Number(t.credit).toFixed(2)}, Débito: R$ ${Number(t.debit).toFixed(2)}, Saldo: R$ ${Number(t.balance).toFixed(2)}, Desc: ${t.description}`);
  });
}

run().then(() => process.exit(0));
