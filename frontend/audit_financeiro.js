/**
 * AUDITORIA COMPLETA DO MÓDULO FINANCEIRO
 * Script para identificar inconsistências entre módulos e dados financeiros
 */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function audit() {
  console.log('══════════════════════════════════════════════════════');
  console.log('  AUDITORIA FINANCEIRA COMPLETA - Click Marido CRM  ');
  console.log('══════════════════════════════════════════════════════');
  console.log('Data:', new Date().toLocaleString('pt-BR'));
  console.log('');

  const issues = [];

  // ═══════════════════════════════════════════
  // 1. CONTAS BANCÁRIAS
  // ═══════════════════════════════════════════
  console.log('🏦 1. CONTAS BANCÁRIAS');
  const bankAccounts = await prisma.bankAccount.findMany();
  for (const ba of bankAccounts) {
    console.log(`   - ${ba.nickname || ba.bankName}: Saldo = R$ ${Number(ba.currentBalance).toFixed(2)} | Inicial = R$ ${Number(ba.initialBalance).toFixed(2)}`);
  }
  const totalBalance = bankAccounts.reduce((s, a) => s + Number(a.currentBalance), 0);
  console.log(`   TOTAL CONSOLIDADO: R$ ${totalBalance.toFixed(2)}`);
  console.log('');

  // ═══════════════════════════════════════════
  // 2. PAGAMENTOS (Payments) vs CONTAS A RECEBER (AccountReceivable)
  // ═══════════════════════════════════════════
  console.log('💰 2. PAGAMENTOS vs CONTAS A RECEBER');
  
  // 2a. Pagamentos confirmados SEM correspondência no Contas a Receber
  const confirmedPayments = await prisma.payment.findMany({
    where: { status: 'confirmado' },
    include: { customer: { select: { name: true } }, invoice: true }
  });
  console.log(`   Pagamentos Confirmados: ${confirmedPayments.length}`);
  
  const receivables = await prisma.accountReceivable.findMany({
    include: { customer: { select: { name: true } }, invoice: true }
  });
  console.log(`   Contas a Receber: ${receivables.length}`);

  for (const p of confirmedPayments) {
    // Verificar se existe um AR correspondente por invoiceId ou por valor
    let found = false;
    if (p.invoiceId) {
      found = receivables.some(r => r.invoiceId === p.invoiceId);
    }
    if (!found) {
      // Buscar por cliente + valor similar
      found = receivables.some(r => r.customerId === p.customerId && Math.abs(Number(r.totalAmount) - Number(p.amount)) < 0.01);
    }
    if (!found) {
      issues.push({
        module: 'Pagamentos → Contas a Receber',
        severity: 'CRÍTICO',
        description: `Pagamento confirmado R$ ${Number(p.amount).toFixed(2)} (${p.customer?.name || 'N/A'}) SEM lançamento no Contas a Receber`,
        paymentId: p.id,
        amount: Number(p.amount)
      });
    }
  }

  // 2b. Títulos a receber abertos/vencidos sem pagamento pendente
  const openReceivables = receivables.filter(r => ['aberto', 'parcial', 'vencido'].includes(r.status));
  console.log(`   Títulos Pendentes (aberto/parcial/vencido): ${openReceivables.length}`);
  const totalPendingReceivable = openReceivables.reduce((s, r) => s + (Number(r.totalAmount) - Number(r.paidAmount)), 0);
  console.log(`   Valor Pendente a Receber: R$ ${totalPendingReceivable.toFixed(2)}`);

  // ═══════════════════════════════════════════
  // 3. FATURAS (Invoices) vs CONTAS A RECEBER
  // ═══════════════════════════════════════════
  console.log('');
  console.log('📄 3. FATURAS vs CONTAS A RECEBER');
  const invoices = await prisma.invoice.findMany({
    where: { status: { in: ['emitida', 'paga'] } },
    include: { customer: { select: { name: true } } }
  });
  console.log(`   Faturas emitidas/pagas: ${invoices.length}`);

  for (const inv of invoices) {
    const hasReceivable = receivables.some(r => r.invoiceId === inv.id);
    if (!hasReceivable) {
      issues.push({
        module: 'Faturas → Contas a Receber',
        severity: 'CRÍTICO',
        description: `Fatura #${inv.invoiceNumber} (R$ ${Number(inv.totalAmount).toFixed(2)}) SEM lançamento no Contas a Receber`,
        invoiceId: inv.id,
        amount: Number(inv.totalAmount)
      });
    }
  }

  // ═══════════════════════════════════════════
  // 4. DESPESAS (Expenses) vs CONTAS A PAGAR (AccountPayable)
  // ═══════════════════════════════════════════
  console.log('');
  console.log('📋 4. DESPESAS vs CONTAS A PAGAR');
  const expenses = await prisma.expense.findMany({
    where: { status: { not: 'cancelada' } },
    include: { vendor: { select: { name: true } } }
  });
  console.log(`   Despesas ativas: ${expenses.length}`);
  
  const payables = await prisma.accountPayable.findMany({
    include: { vendor: { select: { name: true } }, expense: true }
  });
  console.log(`   Contas a Pagar: ${payables.length}`);

  for (const exp of expenses) {
    const hasPayable = payables.some(p => p.expenseId === exp.id);
    if (!hasPayable) {
      issues.push({
        module: 'Despesas → Contas a Pagar',
        severity: 'ALTO',
        description: `Despesa "${exp.description}" (R$ ${Number(exp.amount).toFixed(2)}) SEM lançamento no Contas a Pagar`,
        expenseId: exp.id,
        amount: Number(exp.amount),
        status: exp.status
      });
    }
  }

  // 4b. Despesas pagas sem débito na conta bancária (verificar conciliação)
  const paidExpenses = expenses.filter(e => e.status === 'paga');
  console.log(`   Despesas pagas: ${paidExpenses.length}`);
  const totalPaidExpenses = paidExpenses.reduce((s, e) => s + Number(e.amount), 0);
  console.log(`   Total Despesas Pagas: R$ ${totalPaidExpenses.toFixed(2)}`);

  // ═══════════════════════════════════════════
  // 5. ORDENS DE COMPRA (PurchaseOrders) vs DESPESAS / CONTAS A PAGAR
  // ═══════════════════════════════════════════
  console.log('');
  console.log('🛒 5. ORDENS DE COMPRA vs DESPESAS / CONTAS A PAGAR');
  const purchaseOrders = await prisma.purchaseOrder.findMany({
    where: { status: { in: ['aprovada', 'recebida', 'parcial'] } },
    include: { expense: true, vendor: { select: { name: true } }, items: true }
  });
  console.log(`   Ordens de Compra ativas: ${purchaseOrders.length}`);

  for (const po of purchaseOrders) {
    const totalOC = po.items.reduce((s, i) => s + Number(i.quantity) * Number(i.unitPrice), 0);
    
    // Verificar se tem despesa vinculada
    if (!po.expenseId && !po.expense) {
      issues.push({
        module: 'OC → Despesas',
        severity: 'ALTO',
        description: `OC #${po.number || po.id.slice(-6)} (${po.vendor?.name || 'N/A'}) R$ ${totalOC.toFixed(2)} SEM despesa vinculada`,
        purchaseOrderId: po.id,
        amount: totalOC
      });
    }

    // Verificar se tem Conta a Pagar correspondente
    if (po.expenseId) {
      const hasPayable = payables.some(p => p.expenseId === po.expenseId);
      if (!hasPayable) {
        issues.push({
          module: 'OC → Contas a Pagar',
          severity: 'ALTO',
          description: `OC #${po.number || po.id.slice(-6)} tem despesa mas SEM Conta a Pagar vinculada`,
          purchaseOrderId: po.id,
          amount: totalOC
        });
      }
    }
  }

  // ═══════════════════════════════════════════
  // 6. ORDENS DE SERVIÇO CONCLUÍDAS vs FATURAMENTO
  // ═══════════════════════════════════════════
  console.log('');
  console.log('🔧 6. ORDENS DE SERVIÇO CONCLUÍDAS vs FATURAMENTO');
  const completedOrders = await prisma.serviceOrder.findMany({
    where: { status: 'concluida' },
    include: { 
      customer: { select: { name: true } }, 
      quotation: { 
        select: { 
          id: true, total: true, status: true,
          payments: { select: { id: true, amount: true, status: true } }
        } 
      },
    }
  });
  console.log(`   OS Concluídas: ${completedOrders.length}`);

  for (const os of completedOrders) {
    const osTotal = Number(os.finalTotal);
    if (osTotal > 0) {
      // Verificar se tem pagamento confirmado (via quotation)
      const payments = os.quotation?.payments || [];
      const confirmedTotal = payments.filter(p => p.status === 'confirmado').reduce((s, p) => s + Number(p.amount), 0);
      if (confirmedTotal < osTotal * 0.99) { // 1% tolerância
        issues.push({
          module: 'OS → Pagamentos',
          severity: 'MÉDIO',
          description: `OS #${os.number} (${os.customer?.name || 'N/A'}) Total R$ ${osTotal.toFixed(2)} com apenas R$ ${confirmedTotal.toFixed(2)} confirmados`,
          serviceOrderId: os.id,
          amount: osTotal,
          paid: confirmedTotal
        });
      }
    }
  }

  // ═══════════════════════════════════════════
  // 7. CONCILIAÇÃO BANCÁRIA
  // ═══════════════════════════════════════════
  console.log('');
  console.log('🔄 7. CONCILIAÇÃO BANCÁRIA');
  const reconciliations = await prisma.bankReconciliation.findMany();
  console.log(`   Total de conciliações: ${reconciliations.length}`);
  
  const totalEntradas = reconciliations.filter(r => r.type === 'ENTRADA').reduce((s, r) => s + Number(r.amount), 0);
  const totalSaidas = reconciliations.filter(r => r.type === 'SAIDA').reduce((s, r) => s + Number(r.amount), 0);
  console.log(`   Entradas: R$ ${totalEntradas.toFixed(2)}`);
  console.log(`   Saídas: R$ ${totalSaidas.toFixed(2)}`);
  console.log(`   Saldo Conciliação: R$ ${(totalEntradas - totalSaidas).toFixed(2)}`);
  
  // Verificar se saldo da conciliação bate com saldo bancário
  const saldoInicial = bankAccounts.reduce((s, a) => s + Number(a.initialBalance), 0);
  const saldoEsperado = saldoInicial + totalEntradas - totalSaidas;
  if (Math.abs(saldoEsperado - totalBalance) > 0.01) {
    issues.push({
      module: 'Saldo Bancário vs Conciliação',
      severity: 'CRÍTICO',
      description: `Saldo bancário (R$ ${totalBalance.toFixed(2)}) DIVERGE da conciliação (inicial R$ ${saldoInicial.toFixed(2)} + entradas R$ ${totalEntradas.toFixed(2)} - saídas R$ ${totalSaidas.toFixed(2)} = R$ ${saldoEsperado.toFixed(2)})`,
      expected: saldoEsperado,
      actual: totalBalance,
      diff: totalBalance - saldoEsperado
    });
  }

  // ═══════════════════════════════════════════
  // 8. LIVRO CAIXA (FinancialTransaction) vs PAGAMENTOS
  // ═══════════════════════════════════════════
  console.log('');
  console.log('📖 8. LIVRO CAIXA (FinancialTransaction)');
  const transactions = await prisma.financialTransaction.findMany({
    orderBy: { createdAt: 'asc' }
  });
  console.log(`   Total de transações: ${transactions.length}`);
  
  const totalCredits = transactions.reduce((s, t) => s + Number(t.credit || 0), 0);
  const totalDebits = transactions.reduce((s, t) => s + Number(t.debit || 0), 0);
  const ledgerBalance = totalCredits - totalDebits;
  console.log(`   Créditos: R$ ${totalCredits.toFixed(2)}`);
  console.log(`   Débitos: R$ ${totalDebits.toFixed(2)}`);
  console.log(`   Saldo Livro Caixa: R$ ${ledgerBalance.toFixed(2)}`);

  // Verificar se o último saldo (balance) está correto
  if (transactions.length > 0) {
    const lastTx = transactions[transactions.length - 1];
    const lastBalance = Number(lastTx.balance || 0);
    if (Math.abs(lastBalance - ledgerBalance) > 0.01) {
      issues.push({
        module: 'Livro Caixa - Saldo',
        severity: 'ALTO',
        description: `Saldo do último registro (R$ ${lastBalance.toFixed(2)}) diverge do calculado (R$ ${ledgerBalance.toFixed(2)})`,
        expected: ledgerBalance,
        actual: lastBalance
      });
    }
  }

  // Pagamentos confirmados que não têm transação no livro
  for (const p of confirmedPayments) {
    const hasTx = transactions.some(t => t.paymentId === p.id);
    if (!hasTx) {
      issues.push({
        module: 'Pagamentos → Livro Caixa',
        severity: 'ALTO',
        description: `Pagamento confirmado R$ ${Number(p.amount).toFixed(2)} (${p.customer?.name || 'N/A'}) SEM transação no Livro Caixa`,
        paymentId: p.id,
        amount: Number(p.amount)
      });
    }
  }

  // ═══════════════════════════════════════════
  // 9. DESPESAS FIXAS/RECORRENTES
  // ═══════════════════════════════════════════
  console.log('');
  console.log('🔁 9. DESPESAS FIXAS/RECORRENTES');
  const recurringExpenses = await prisma.recurringExpense.findMany({
    where: { isActive: true }
  });
  console.log(`   Recorrências ativas: ${recurringExpenses.length}`);
  const totalRecurring = recurringExpenses.reduce((s, r) => s + Number(r.amount), 0);
  console.log(`   Total mensal estimado: R$ ${totalRecurring.toFixed(2)}`);

  // Verificar se recorrências com nextDue vencida geraram contas a pagar
  for (const re of recurringExpenses) {
    if (new Date(re.nextDue) < new Date()) {
      const hasPayable = payables.some(p => p.recurringExpenseId === re.id && 
        ['aberto', 'parcial', 'vencido', 'pago'].includes(p.status));
      if (!hasPayable) {
        issues.push({
          module: 'Recorrência → Contas a Pagar',
          severity: 'MÉDIO',
          description: `Despesa recorrente "${re.description}" (R$ ${Number(re.amount).toFixed(2)}) com nextDue vencida sem conta a pagar gerada`,
          recurringExpenseId: re.id,
          amount: Number(re.amount)
        });
      }
    }
  }

  // ═══════════════════════════════════════════
  // 10. DRE CHECK - Receita Bruta vs Pagamentos
  // ═══════════════════════════════════════════
  console.log('');
  console.log('📊 10. VERIFICAÇÃO DRE');
  const allInvoices = await prisma.invoice.findMany({
    where: { status: { in: ['emitida', 'paga'] } }
  });
  const receitaBruta = allInvoices.reduce((s, i) => s + Number(i.totalAmount), 0);
  const totalConfirmedPayments = confirmedPayments.reduce((s, p) => s + Number(p.amount), 0);
  console.log(`   Receita Bruta (Faturas): R$ ${receitaBruta.toFixed(2)}`);
  console.log(`   Pagamentos Confirmados: R$ ${totalConfirmedPayments.toFixed(2)}`);
  
  const totalExpenses = expenses.reduce((s, e) => s + Number(e.amount), 0);
  console.log(`   Total Despesas: R$ ${totalExpenses.toFixed(2)}`);
  console.log(`   Resultado Simplificado: R$ ${(totalConfirmedPayments - totalPaidExpenses).toFixed(2)}`);

  // ═══════════════════════════════════════════
  // 11. DASHBOARD FINANCEIRO - Divergência
  // ═══════════════════════════════════════════
  console.log('');
  console.log('📱 11. DASHBOARD FINANCEIRO - VERIFICAÇÃO');
  
  // O dashboard busca receivables com status in: ['aberto', 'parcial', 'vencido']
  const dashReceivables = await prisma.accountReceivable.aggregate({
    where: { status: { in: ['aberto', 'parcial', 'vencido'] } },
    _sum: { totalAmount: true, paidAmount: true },
    _count: true,
  });
  
  const dashPayables = await prisma.accountPayable.aggregate({
    where: { status: { in: ['aberto', 'parcial', 'vencido'] } },
    _sum: { totalAmount: true, paidAmount: true },
    _count: true,
  });
  
  const dashRecPending = (Number(dashReceivables._sum.totalAmount) || 0) - (Number(dashReceivables._sum.paidAmount) || 0);
  const dashPayPending = (Number(dashPayables._sum.totalAmount) || 0) - (Number(dashPayables._sum.paidAmount) || 0);
  
  console.log(`   Dashboard A Receber: R$ ${dashRecPending.toFixed(2)} (${dashReceivables._count} títulos)`);
  console.log(`   Dashboard A Pagar: R$ ${dashPayPending.toFixed(2)} (${dashPayables._count} títulos)`);
  console.log(`   Dashboard Projeção: R$ ${(dashRecPending - dashPayPending).toFixed(2)}`);

  // ═══════════════════════════════════════════
  // RELATÓRIO FINAL
  // ═══════════════════════════════════════════
  console.log('');
  console.log('══════════════════════════════════════════════════════');
  console.log(`  TOTAL DE INCONSISTÊNCIAS ENCONTRADAS: ${issues.length}  `);
  console.log('══════════════════════════════════════════════════════');
  
  const critico = issues.filter(i => i.severity === 'CRÍTICO');
  const alto = issues.filter(i => i.severity === 'ALTO');
  const medio = issues.filter(i => i.severity === 'MÉDIO');
  
  if (critico.length > 0) {
    console.log(`\n🔴 CRÍTICO (${critico.length}):`);
    critico.forEach((i, idx) => console.log(`   ${idx+1}. [${i.module}] ${i.description}`));
  }
  if (alto.length > 0) {
    console.log(`\n🟠 ALTO (${alto.length}):`);
    alto.forEach((i, idx) => console.log(`   ${idx+1}. [${i.module}] ${i.description}`));
  }
  if (medio.length > 0) {
    console.log(`\n🟡 MÉDIO (${medio.length}):`);
    medio.forEach((i, idx) => console.log(`   ${idx+1}. [${i.module}] ${i.description}`));
  }

  if (issues.length === 0) {
    console.log('\n✅ Nenhuma inconsistência encontrada! Todos os módulos estão integrados.');
  }

  // Retornar issues para uso programático
  return issues;
}

audit()
  .then(issues => {
    console.log(`\n\nJSON de issues para processamento:`);
    console.log(JSON.stringify(issues, null, 2));
    process.exit(0);
  })
  .catch(err => {
    console.error('ERRO FATAL na auditoria:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
