/**
 * SCRIPT DE SANEAMENTO FINANCEIRO
 * Corrige dados retroativos no banco de dados real
 */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fix() {
  console.log('══════════════════════════════════════════════════════');
  console.log('  SANEAMENTO FINANCEIRO - Click Marido CRM          ');
  console.log('══════════════════════════════════════════════════════');
  console.log('Data:', new Date().toLocaleString('pt-BR'));
  console.log('');

  // ═══════════════════════════════════════════
  // FASE 1: Criar AccountPayable para despesas órfãs
  // ═══════════════════════════════════════════
  console.log('📋 FASE 1: Criando Contas a Pagar para despesas órfãs...');
  
  const expenses = await prisma.expense.findMany({
    where: { status: { not: 'cancelada' } },
    include: { vendor: { select: { id: true, name: true } } }
  });

  const payables = await prisma.accountPayable.findMany();

  let createdPayables = 0;
  for (const exp of expenses) {
    const hasPayable = payables.some(p => p.expenseId === exp.id);
    if (!hasPayable) {
      const isPaid = exp.status === 'paga';
      await prisma.accountPayable.create({
        data: {
          title: exp.description,
          description: `Gerado via saneamento financeiro. Despesa ID: ${exp.id}`,
          totalAmount: exp.amount,
          paidAmount: isPaid ? exp.amount : 0,
          status: isPaid ? 'pago' : 'aberto',
          dueDate: exp.dueDate || exp.expenseDate,
          paidDate: isPaid ? (exp.paidAt || new Date()) : null,
          origin: 'DESPESA',
          paymentMethod: 'PIX',
          expenseId: exp.id,
          vendorId: exp.vendorId || null,
          notes: `[SANEAMENTO] Criado automaticamente pela auditoria financeira em ${new Date().toLocaleString('pt-BR')}.`
        }
      });
      createdPayables++;
      console.log(`   ✅ Criado AP para despesa "${exp.description}" (R$ ${Number(exp.amount).toFixed(2)})`);
    }
  }
  console.log(`   → ${createdPayables} contas a pagar criadas`);

  // ═══════════════════════════════════════════
  // FASE 2: Recalcular saldo das contas bancárias
  // ═══════════════════════════════════════════
  console.log('');
  console.log('🏦 FASE 2: Recalculando saldo das contas bancárias...');

  const bankAccounts = await prisma.bankAccount.findMany();
  
  for (const ba of bankAccounts) {
    // Somar todas as entradas e saídas de conciliação desta conta
    const reconciliations = await prisma.bankReconciliation.findMany({
      where: { bankAccountId: ba.id }
    });

    const entradas = reconciliations
      .filter(r => r.type === 'ENTRADA')
      .reduce((s, r) => s + Number(r.amount), 0);
    
    const saidas = reconciliations
      .filter(r => r.type === 'SAIDA')
      .reduce((s, r) => s + Number(r.amount), 0);

    const saldoCorreto = Number(ba.initialBalance) + entradas - saidas;
    const saldoAtual = Number(ba.currentBalance);

    if (Math.abs(saldoCorreto - saldoAtual) > 0.01) {
      await prisma.bankAccount.update({
        where: { id: ba.id },
        data: { currentBalance: saldoCorreto }
      });
      console.log(`   ✅ ${ba.nickname || ba.bankName}: R$ ${saldoAtual.toFixed(2)} → R$ ${saldoCorreto.toFixed(2)} (diff: R$ ${(saldoCorreto - saldoAtual).toFixed(2)})`);
    } else {
      console.log(`   ✓ ${ba.nickname || ba.bankName}: R$ ${saldoAtual.toFixed(2)} (ok)`);
    }
  }

  // ═══════════════════════════════════════════
  // FASE 3: Recalcular balance do Livro Caixa
  // ═══════════════════════════════════════════
  console.log('');
  console.log('📖 FASE 3: Recalculando saldo acumulado do Livro Caixa...');

  const transactions = await prisma.financialTransaction.findMany({
    orderBy: { createdAt: 'asc' }
  });

  let runningBalance = 0;
  let fixedCount = 0;

  for (const tx of transactions) {
    const credit = Number(tx.credit || 0);
    const debit = Number(tx.debit || 0);
    runningBalance = runningBalance + credit - debit;

    const currentBalance = Number(tx.balance || 0);
    if (Math.abs(currentBalance - runningBalance) > 0.01) {
      await prisma.financialTransaction.update({
        where: { id: tx.id },
        data: { balance: runningBalance }
      });
      fixedCount++;
    }
  }

  console.log(`   → ${fixedCount} transações corrigidas (saldo final: R$ ${runningBalance.toFixed(2)})`);

  // ═══════════════════════════════════════════
  // FASE 4: Gerar Contas a Pagar para recorrências vencidas
  // ═══════════════════════════════════════════
  console.log('');
  console.log('🔁 FASE 4: Verificando recorrências vencidas...');

  const recurringExpenses = await prisma.recurringExpense.findMany({
    where: { isActive: true }
  });

  let recurringFixed = 0;
  for (const re of recurringExpenses) {
    if (new Date(re.nextDue) < new Date()) {
      // Verificar se já existe conta a pagar para esta recorrência
      const existingPayable = await prisma.accountPayable.findFirst({
        where: {
          recurringExpenseId: re.id,
          status: { in: ['aberto', 'parcial', 'vencido', 'pago'] }
        }
      });

      if (!existingPayable) {
        const isOverdue = new Date(re.nextDue) < new Date();
        await prisma.accountPayable.create({
          data: {
            title: re.description,
            description: `Gerado via recorrência. Recorrência ID: ${re.id}`,
            totalAmount: re.amount,
            paidAmount: 0,
            status: isOverdue ? 'vencido' : 'aberto',
            dueDate: re.nextDue,
            origin: 'RECORRENCIA',
            bankAccountId: re.bankAccountId,
            vendorId: re.vendorId,
            chartOfAccountId: re.chartOfAccountId,
            costCenter: re.costCenter,
            recurringExpenseId: re.id,
            notes: `[SANEAMENTO] Gerado pela recorrência "${re.description}".`
          }
        });
        recurringFixed++;
        console.log(`   ✅ Criado AP recorrente "${re.description}" (R$ ${Number(re.amount).toFixed(2)}) vencimento ${new Date(re.nextDue).toLocaleDateString('pt-BR')}`);
      }
    }
  }
  console.log(`   → ${recurringFixed} contas a pagar recorrentes criadas`);

  // ═══════════════════════════════════════════
  // RESUMO FINAL
  // ═══════════════════════════════════════════
  console.log('');
  console.log('══════════════════════════════════════════════════════');
  console.log('  SANEAMENTO CONCLUÍDO COM SUCESSO!                 ');
  console.log('══════════════════════════════════════════════════════');
  console.log(`  → ${createdPayables} contas a pagar criadas`);
  console.log(`  → ${fixedCount} transações do livro caixa corrigidas`);
  console.log(`  → ${recurringFixed} recorrências processadas`);
  console.log('');
  console.log('  Execute "node audit_financeiro.js" para verificar.');
}

fix()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('ERRO FATAL no saneamento:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
