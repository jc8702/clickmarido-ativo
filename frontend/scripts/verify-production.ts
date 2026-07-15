import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://neondb_owner:npg_JqwVLCGzFd54@ep-noisy-truth-acr29rgo-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require',
    },
  },
});

async function main() {
  console.log('📊 Verificando dados no banco de PRODUÇÃO...\n');
  
  const bankAccounts = await prisma.bankAccount.findMany();
  console.log('🏦 Contas Bancárias:', bankAccounts.length);
  bankAccounts.forEach(a => console.log('   -', a.nickname || a.bankName, ': R$', a.currentBalance));
  
  const chartOfAccounts = await prisma.chartOfAccount.findMany();
  console.log('\n📋 Plano de Contas:', chartOfAccounts.length);
  
  const receivables = await prisma.accountReceivable.findMany();
  console.log('\n💰 Contas a Receber:', receivables.length);
  receivables.forEach(r => console.log('   -', r.title, ': R$', r.totalAmount, '(' + r.status + ')'));
  
  const payables = await prisma.accountPayable.findMany();
  console.log('\n📤 Contas a Pagar:', payables.length);
  payables.forEach(p => console.log('   -', p.title, ': R$', p.totalAmount, '(' + p.status + ')'));
  
  const recurringExpenses = await prisma.recurringExpense.findMany();
  console.log('\n🔄 Despesas Fixas:', recurringExpenses.length);
  recurringExpenses.forEach(r => console.log('   -', r.description, ': R$', r.amount));
  
  const reconciliations = await prisma.bankReconciliation.findMany();
  console.log('\n🔗 Conciliações:', reconciliations.length);
  
  await prisma.$disconnect();
}

main();
