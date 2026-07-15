/**
 * SCRIPT DE SINCRONIZAÇÃO E SANEAMENTO DOS VALORES DE JUNHO E JULHO
 * Ajusta OS, faturas e despesas para refletir exatamente R$ 440,00 de serviço feito e R$ 470,91 de ordens de compras
 */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  console.log('══════════════════════════════════════════════════════');
  console.log('  SINCRONIZAÇÃO DE DADOS REAIS - Click Marido CRM     ');
  console.log('══════════════════════════════════════════════════════');
  console.log('Data:', new Date().toLocaleString('pt-BR'));
  console.log('');

  // ═══════════════════════════════════════════
  // FASE 1: Reativar e Ajustar Receitas de Serviços (R$ 440,00)
  // ═══════════════════════════════════════════
  console.log('🔧 FASE 1: Sincronizando Serviços de Junho e Julho...');

  // 1.1 Atualizar OS-0001 (R$ 60,00) e OS-0002 (R$ 130,00) para 'concluida'
  const os1 = await prisma.serviceOrder.update({
    where: { number: 'OS-0001' },
    data: { status: 'concluida', completedAt: new Date('2026-06-22T16:33:42Z') }
  });
  console.log(`   ✅ OS-0001 atualizada para status "concluida" (R$ ${Number(os1.finalTotal).toFixed(2)})`);

  const os2 = await prisma.serviceOrder.update({
    where: { number: 'OS-0002' },
    data: { status: 'concluida', completedAt: new Date('2026-06-22T16:33:26Z') }
  });
  console.log(`   ✅ OS-0002 atualizada para status "concluida" (R$ ${Number(os2.finalTotal).toFixed(2)})`);

  // 1.2 Reativar faturas canceladas de julho: INV-2026-0004-631 (R$ 150,00) e INV-2026-0003-109 (R$ 100,00)
  const ar109 = await prisma.accountReceivable.findFirst({
    where: { title: { contains: 'INV-2026-0003-109' } }
  });
  if (ar109) {
    await prisma.accountReceivable.update({
      where: { id: ar109.id },
      data: { status: 'baixado', paidAmount: 100.00, paidDate: new Date('2026-07-01T21:00:00Z') }
    });
    if (ar109.invoiceId) {
      await prisma.invoice.update({
        where: { id: ar109.invoiceId },
        data: { status: 'paga' }
      });
    }
    console.log(`   ✅ Título INV-2026-0003-109 (R$ 100.00) reativado como baixado/pago`);
  }

  const ar631 = await prisma.accountReceivable.findFirst({
    where: { title: { contains: 'INV-2026-0004-631' } }
  });
  if (ar631) {
    await prisma.accountReceivable.update({
      where: { id: ar631.id },
      data: { status: 'baixado', paidAmount: 150.00, paidDate: new Date('2026-07-01T21:00:00Z') }
    });
    if (ar631.invoiceId) {
      await prisma.invoice.update({
        where: { id: ar631.invoiceId },
        data: { status: 'paga' }
      });
    }
    console.log(`   ✅ Título INV-2026-0004-631 (R$ 150.00) reativado como baixado/pago`);
  }

  // 1.3 Confirmar todos os pagamentos (Payments)
  const payments = await prisma.payment.findMany({
    where: { status: 'pendente' }
  });
  for (const p of payments) {
    await prisma.payment.update({
      where: { id: p.id },
      data: { status: 'confirmado', paidAt: p.createdAt, confirmedAt: p.createdAt }
    });
    console.log(`   ✅ Pagamento ID: ${p.id.slice(-6).toUpperCase()} (R$ ${Number(p.amount).toFixed(2)}) confirmado.`);
  }

  // 1.4 Criar transações financeiras para as duas faturas reativadas (R$ 150 e R$ 100) no Livro Caixa se não existirentes
  const currentTxs = await prisma.financialTransaction.findMany();
  
  if (ar109 && !currentTxs.some(t => t.invoiceId === ar109.invoiceId)) {
    await prisma.financialTransaction.create({
      data: {
        type: 'PAYMENT_RECEIVED',
        invoiceId: ar109.invoiceId,
        credit: 100.00,
        debit: 0,
        description: `Recebimento de Fatura #INV-2026-0003-109 (PIX)`,
        transactionDate: new Date('2026-07-01T21:00:00Z')
      }
    });
    console.log('   ✅ Transação do Livro Caixa criada para Fatura INV-2026-0003-109 (R$ 100.00)');
  }

  if (ar631 && !currentTxs.some(t => t.invoiceId === ar631.invoiceId)) {
    await prisma.financialTransaction.create({
      data: {
        type: 'PAYMENT_RECEIVED',
        invoiceId: ar631.invoiceId,
        credit: 150.00,
        debit: 0,
        description: `Recebimento de Fatura #INV-2026-0004-631 (PIX)`,
        transactionDate: new Date('2026-07-01T21:00:00Z')
      }
    });
    console.log('   ✅ Transação do Livro Caixa criada para Fatura INV-2026-0004-631 (R$ 150.00)');
  }

  // 1.5 Corrigir inconsistência de Pagamento da Debora Anater (R$ 100.00) sem Contas a Receber correspondente
  const deboraPayment = await prisma.payment.findFirst({
    where: { amount: 100.00, status: 'confirmado', customer: { name: { contains: 'Debora' } } },
    include: { customer: true }
  });

  if (deboraPayment) {
    const existingAR = await prisma.accountReceivable.findFirst({
      where: { customerId: deboraPayment.customerId, totalAmount: 100.00 }
    });

    if (!existingAR) {
      await prisma.accountReceivable.create({
        data: {
          title: `Recebimento de Visita Comercial - Debora Anater`,
          description: `Gerado via saneamento para o pagamento ${deboraPayment.id}`,
          totalAmount: 100.00,
          paidAmount: 100.00,
          status: 'baixado',
          dueDate: deboraPayment.paidAt || new Date(),
          paidDate: deboraPayment.paidAt || new Date(),
          origin: 'MANUAL',
          paymentMethod: 'PIX',
          customerId: deboraPayment.customerId,
          notes: 'Criado para conciliação com pagamento confirmado.'
        }
      });
      console.log('   ✅ Contas a Receber criado para o pagamento de Debora Anater (R$ 100.00)');
    }
  }

  // ═══════════════════════════════════════════
  // FASE 2: Sincronizar Compras e Despesas (R$ 470,91)
  // ═══════════════════════════════════════════
  console.log('\n🛒 FASE 2: Sincronizando Compras e Despesas (Ordens de Compra)...');

  // Valores reais das Ordens de Compra do Contas a Pagar:
  const ocsList = [
    { title: 'Ordem de Compra OC-2026-000001', amount: 19.00, status: 'paga', date: new Date('2026-06-21T21:00:00Z') },
    { title: 'Ordem de Compra OC-2026-000002', amount: 107.61, status: 'paga', date: new Date('2026-06-23T21:00:00Z') },
    { title: 'Ordem de Compra OC-2026-000003', amount: 262.36, status: 'cancelada', date: new Date('2026-06-26T21:00:00Z') },
    { title: 'Ordem de Compra OC-2026-000004', amount: 22.24, status: 'paga', date: new Date('2026-06-26T21:00:00Z') },
    { title: 'Ordem de Compra OC-2026-000005 - Lojas Milium LTDA - LJ 29', amount: 59.70, status: 'paga', date: new Date('2026-07-03T21:00:00Z') }
  ];

  // Buscar despesas ativas existentes
  const currentExpenses = await prisma.expense.findMany();

  for (const oc of ocsList) {
    // Buscar por descrição parcial para acomodar variações de nome
    const ocBaseTitle = oc.title.split(' - ')[0];
    const existing = currentExpenses.find(e => e.description.includes(ocBaseTitle));
    
    if (!existing) {
      // Criar despesa na tabela Expense
      const newExp = await prisma.expense.create({
        data: {
          category: 'MATERIAL',
          costCenter: 'OUTROS',
          description: oc.title,
          amount: oc.amount,
          expenseDate: oc.date,
          status: oc.status,
          paidAt: oc.status === 'paga' ? oc.date : null,
          vendorName: oc.title.includes('Milium') ? 'Lojas Milium LTDA' : 'Mercado Livre'
        }
      });
      console.log(`   ✅ Despesa "${oc.title}" criada na tabela Expense (R$ ${oc.amount.toFixed(2)})`);

      // Sincronizar ID de despesa no AccountPayable correspondente
      const ap = await prisma.accountPayable.findFirst({
        where: { title: { contains: ocBaseTitle } }
      });
      if (ap) {
        await prisma.accountPayable.update({
          where: { id: ap.id },
          data: { expenseId: newExp.id, status: oc.status === 'paga' ? 'pago' : 'cancelado', title: oc.title }
        });
      }
    } else {
      // Atualizar status, descrição e paidAt para manter consistência
      await prisma.expense.update({
        where: { id: existing.id },
        data: { 
          description: oc.title,
          status: oc.status,
          paidAt: oc.status === 'paga' ? (existing.paidAt || oc.date) : null
        }
      });
      console.log(`   ✓ Despesa "${oc.title}" status e descrição atualizados (R$ ${oc.amount.toFixed(2)})`);

      // Atualizar AccountPayable correspondente
      const ap = await prisma.accountPayable.findFirst({
        where: { title: { contains: ocBaseTitle } }
      });
      if (ap) {
        await prisma.accountPayable.update({
          where: { id: ap.id },
          data: { expenseId: existing.id, status: oc.status === 'paga' ? 'pago' : 'cancelado', title: oc.title }
        });
      }
    }
  }

  // ═══════════════════════════════════════════
  // FASE 3: Recalcular Saldos Bancários e Livro Caixa
  // ═══════════════════════════════════════════
  console.log('\n🏦 FASE 3: Recalculando Saldos Bancários e do Livro Caixa...');

  // 3.1 Recalcular saldo acumulado do Livro Caixa
  const transactions = await prisma.financialTransaction.findMany({
    orderBy: { transactionDate: 'asc' }
  });

  let runningBalance = 0;
  for (const t of transactions) {
    const credit = Number(t.credit || 0);
    const debit = Number(t.debit || 0);
    runningBalance = runningBalance + credit - debit;

    await prisma.financialTransaction.update({
      where: { id: t.id },
      data: { balance: runningBalance }
    });
  }
  console.log(`   ✅ Saldo acumulado do Livro Caixa recalculado (Saldo Final: R$ ${runningBalance.toFixed(2)})`);

  // 3.2 Recalcular saldos de Contas Bancárias
  const bankAccounts = await prisma.bankAccount.findMany();
  for (const ba of bankAccounts) {
    const reconciliations = await prisma.bankReconciliation.findMany({
      where: { bankAccountId: ba.id }
    });

    const totalIn = reconciliations.filter(r => r.type === 'ENTRADA').reduce((s, r) => s + Number(r.amount), 0);
    const totalOut = reconciliations.filter(r => r.type === 'SAIDA').reduce((s, r) => s + Number(r.amount), 0);

    const correctBalance = Number(ba.initialBalance) + totalIn - totalOut;

    await prisma.bankAccount.update({
      where: { id: ba.id },
      data: { currentBalance: correctBalance }
    });
    console.log(`   ✅ Conta "${ba.nickname || ba.bankName}" recalibrada: R$ ${correctBalance.toFixed(2)}`);
  }

  console.log('\n══════════════════════════════════════════════════════');
  console.log('  SINCRONIZAÇÃO COMPLETA REALIZADA COM SUCESSO!     ');
  console.log('══════════════════════════════════════════════════════');
}

run()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Erro ao executar sincronização:', err);
    process.exit(1);
  });
