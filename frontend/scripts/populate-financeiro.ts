import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Iniciando migração do módulo financeiro...\n');

  // 1. Buscar dados existentes
  console.log('📊 Buscando dados existentes...');
  const invoices = await prisma.invoice.findMany({
    include: { customer: true, payments: true },
  });
  const payments = await prisma.payment.findMany({
    include: { customer: true },
  });
  const expenses = await prisma.expense.findMany({
    include: { vendor: true },
  });

  console.log(`   - ${invoices.length} faturas encontradas`);
  console.log(`   - ${payments.length} pagamentos encontrados`);
  console.log(`   - ${expenses.length} despesas encontradas\n`);

  // 2. Criar Contas Bancárias
  console.log('🏦 Criando contas bancárias...');
  const bankAccounts = await Promise.all([
    prisma.bankAccount.create({
      data: {
        bankName: 'Banco do Brasil',
        agency: '1234-5',
        accountNumber: '67890-1',
        accountType: 'CORRENTE',
        nickname: 'Conta Principal',
        initialBalance: 15000.00,
        currentBalance: 15000.00,
        status: 'ativa',
        color: '#1e40af',
        isDefault: true,
      },
    }),
    prisma.bankAccount.create({
      data: {
        bankName: 'Nubank',
        agency: '0001',
        accountNumber: '12345-6',
        accountType: 'CORRENTE',
        nickname: 'Nubank Empresarial',
        initialBalance: 8500.00,
        currentBalance: 8500.00,
        status: 'ativa',
        color: '#8b5cf6',
        isDefault: false,
      },
    }),
    prisma.bankAccount.create({
      data: {
        bankName: 'Caixa Econômica',
        agency: '6789',
        accountNumber: '98765-4',
        accountType: 'POUPANCA',
        nickname: 'Reserva',
        initialBalance: 25000.00,
        currentBalance: 25000.00,
        status: 'ativa',
        color: '#059669',
        isDefault: false,
      },
    }),
  ]);
  console.log(`   ✅ ${bankAccounts.length} contas bancárias criadas\n`);

  // 3. Criar Plano de Contas
  console.log('📋 Criando plano de contas...');
  const chartOfAccounts = await Promise.all([
    // RECEITAS
    prisma.chartOfAccount.create({
      data: { code: '1', name: 'Receitas', type: 'RECEITA', level: 0, isActive: true },
    }),
    prisma.chartOfAccount.create({
      data: { code: '1.01', name: 'Receitas Operacionais', type: 'RECEITA', level: 1, isActive: true },
    }),
    prisma.chartOfAccount.create({
      data: { code: '1.01.001', name: 'Serviços de Instalação', type: 'RECEITA', level: 2, isActive: true },
    }),
    prisma.chartOfAccount.create({
      data: { code: '1.01.002', name: 'Serviços de Manutenção', type: 'RECEITA', level: 2, isActive: true },
    }),
    prisma.chartOfAccount.create({
      data: { code: '1.01.003', name: 'Venda de Peças', type: 'RECEITA', level: 2, isActive: true },
    }),
    prisma.chartOfAccount.create({
      data: { code: '1.02', name: 'Receitas Não Operacionais', type: 'RECEITA', level: 1, isActive: true },
    }),
    prisma.chartOfAccount.create({
      data: { code: '1.02.001', name: 'Juros e Rendimentos', type: 'RECEITA', level: 2, isActive: true },
    }),
    // DESPESAS
    prisma.chartOfAccount.create({
      data: { code: '2', name: 'Despesas', type: 'DESPESA', level: 0, isActive: true },
    }),
    prisma.chartOfAccount.create({
      data: { code: '2.01', name: 'Despesas Fixas', type: 'DESPESA', level: 1, isActive: true },
    }),
    prisma.chartOfAccount.create({
      data: { code: '2.01.001', name: 'Aluguel', type: 'DESPESA', level: 2, isActive: true },
    }),
    prisma.chartOfAccount.create({
      data: { code: '2.01.002', name: 'Energia Elétrica', type: 'DESPESA', level: 2, isActive: true },
    }),
    prisma.chartOfAccount.create({
      data: { code: '2.01.003', name: 'Internet e Telefone', type: 'DESPESA', level: 2, isActive: true },
    }),
    prisma.chartOfAccount.create({
      data: { code: '2.01.004', name: 'Salários e Encargos', type: 'DESPESA', level: 2, isActive: true },
    }),
    prisma.chartOfAccount.create({
      data: { code: '2.02', name: 'Despesas Variáveis', type: 'DESPESA', level: 1, isActive: true },
    }),
    prisma.chartOfAccount.create({
      data: { code: '2.02.001', name: 'Material de Consumo', type: 'DESPESA', level: 2, isActive: true },
    }),
    prisma.chartOfAccount.create({
      data: { code: '2.02.002', name: 'Transporte e Frete', type: 'DESPESA', level: 2, isActive: true },
    }),
    prisma.chartOfAccount.create({
      data: { code: '2.02.003', name: 'Ferramentas e Equipamentos', type: 'DESPESA', level: 2, isActive: true },
    }),
    prisma.chartOfAccount.create({
      data: { code: '2.03', name: 'Despesas Administrativas', type: 'DESPESA', level: 1, isActive: true },
    }),
    prisma.chartOfAccount.create({
      data: { code: '2.03.001', name: 'Contabilidade e Jurídico', type: 'DESPESA', level: 2, isActive: true },
    }),
    prisma.chartOfAccount.create({
      data: { code: '2.03.002', name: 'Software e Sistemas', type: 'DESPESA', level: 2, isActive: true },
    }),
    // FINANCEIRO
    prisma.chartOfAccount.create({
      data: { code: '3', name: 'Financeiro', type: 'FINANCEIRO', level: 0, isActive: true },
    }),
    prisma.chartOfAccount.create({
      data: { code: '3.01', name: 'Tarifas Bancárias', type: 'FINANCEIRO', level: 1, isActive: true },
    }),
    prisma.chartOfAccount.create({
      data: { code: '3.01.001', name: 'Taxas de Transferência', type: 'FINANCEIRO', level: 2, isActive: true },
    }),
    prisma.chartOfAccount.create({
      data: { code: '3.01.002', name: 'Tarifas de Manutenção', type: 'FINANCEIRO', level: 2, isActive: true },
    }),
    // IMPOSTOS
    prisma.chartOfAccount.create({
      data: { code: '4', name: 'Impostos', type: 'IMPOSTO', level: 0, isActive: true },
    }),
    prisma.chartOfAccount.create({
      data: { code: '4.01', name: 'Impostos Federais', type: 'IMPOSTO', level: 1, isActive: true },
    }),
    prisma.chartOfAccount.create({
      data: { code: '4.01.001', name: 'IRPJ', type: 'IMPOSTO', level: 2, isActive: true },
    }),
    prisma.chartOfAccount.create({
      data: { code: '4.01.002', name: 'CSLL', type: 'IMPOSTO', level: 2, isActive: true },
    }),
    prisma.chartOfAccount.create({
      data: { code: '4.01.003', name: 'PIS/COFINS', type: 'IMPOSTO', level: 2, isActive: true },
    }),
    prisma.chartOfAccount.create({
      data: { code: '4.02', name: 'Impostos Estaduais', type: 'IMPOSTO', level: 1, isActive: true },
    }),
    prisma.chartOfAccount.create({
      data: { code: '4.02.001', name: 'ICMS', type: 'IMPOSTO', level: 2, isActive: true },
    }),
    prisma.chartOfAccount.create({
      data: { code: '4.03', name: 'Impostos Municipais', type: 'IMPOSTO', level: 1, isActive: true },
    }),
    prisma.chartOfAccount.create({
      data: { code: '4.03.001', name: 'ISS', type: 'IMPOSTO', level: 2, isActive: true },
    }),
  ]);
  console.log(`   ✅ ${chartOfAccounts.length} contas do plano criadas\n`);

  // Mapear códigos para IDs
  const chartMap: Record<string, string> = {};
  chartOfAccounts.forEach(c => { chartMap[c.code] = c.id; });

  // 4. Migrar Invoices para Contas a Receber
  console.log('💰 Migrando faturas para contas a receber...');
  let receivablesCreated = 0;

  for (const invoice of invoices) {
    const remaining = Number(invoice.totalAmount) - Number(invoice.payments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0);

    let status = 'aberto';
    if (invoice.status === 'paga') status = 'baixado';
    else if (invoice.status === 'cancelada') status = 'cancelado';
    else if (new Date(invoice.dueDate) < new Date()) status = 'vencido';

    await prisma.accountReceivable.create({
      data: {
        title: `Fatura ${invoice.invoiceNumber}`,
        description: invoice.description || `Fatura para cliente`,
        totalAmount: Number(invoice.totalAmount),
        paidAmount: Number(invoice.totalAmount) - remaining,
        status,
        dueDate: invoice.dueDate,
        paidDate: status === 'baixado' ? invoice.issueDate : null,
        origin: 'FATURAMENTO',
        customerId: invoice.customerId,
        invoiceId: invoice.id,
        chartOfAccountId: chartMap['1.01.001'],
        bankAccountId: bankAccounts[0].id,
      },
    });
    receivablesCreated++;
  }
  console.log(`   ✅ ${receivablesCreated} contas a receber criadas\n`);

  // 5. Migrar Expenses para Contas a Pagar
  console.log('📤 Migrando despesas para contas a pagar...');
  let payablesCreated = 0;

  const expenseCategoryMap: Record<string, string> = {
    'MATERIAL': '2.02.001',
    'SERVICO': '2.02.001',
    'TRANSPORTE': '2.02.002',
    'ALUGUEL': '2.01.001',
    'UTILITIES': '2.01.002',
    'FERRAMENTAS': '2.02.003',
    'OUTROS': '2.03.001',
  };

  for (const expense of expenses) {
    let status = 'aberto';
    if (expense.status === 'paga') status = 'pago';
    else if (expense.status === 'cancelada') status = 'cancelado';
    else if (expense.dueDate && new Date(expense.dueDate) < new Date()) status = 'vencido';

    const chartCode = expenseCategoryMap[expense.category] || '2.03.001';

    await prisma.accountPayable.create({
      data: {
        title: expense.description,
        description: expense.notes || `Despesa - ${expense.category}`,
        totalAmount: Number(expense.amount),
        paidAmount: status === 'pago' ? Number(expense.amount) : 0,
        status,
        dueDate: expense.dueDate || expense.expenseDate,
        paidDate: status === 'pago' ? expense.paidAt : null,
        origin: 'DESPESA',
        vendorId: expense.vendorId,
        expenseId: expense.id,
        chartOfAccountId: chartMap[chartCode],
        costCenter: expense.costCenter,
        bankAccountId: bankAccounts[0].id,
      },
    });
    payablesCreated++;
  }
  console.log(`   ✅ ${payablesCreated} contas a pagar criadas\n`);

  // 6. Criar Despesas Fixas
  console.log('🔄 Criando despesas fixas...');
  const recurringExpenses = await Promise.all([
    prisma.recurringExpense.create({
      data: {
        description: 'Aluguel do ponto comercial',
        amount: 3500.00,
        frequency: 'MENSAL',
        dayOfMonth: 5,
        startDate: new Date('2024-01-01'),
        nextDue: new Date(),
        isActive: true,
        chartOfAccountId: chartMap['2.01.001'],
        costCenter: 'OPERACIONAL',
        bankAccountId: bankAccounts[0].id,
      },
    }),
    prisma.recurringExpense.create({
      data: {
        description: 'Energia Elétrica',
        amount: 450.00,
        frequency: 'MENSAL',
        dayOfMonth: 15,
        startDate: new Date('2024-01-01'),
        nextDue: new Date(),
        isActive: true,
        chartOfAccountId: chartMap['2.01.002'],
        costCenter: 'OPERACIONAL',
        bankAccountId: bankAccounts[0].id,
      },
    }),
    prisma.recurringExpense.create({
      data: {
        description: 'Internet e Telefone',
        amount: 280.00,
        frequency: 'MENSAL',
        dayOfMonth: 10,
        startDate: new Date('2024-01-01'),
        nextDue: new Date(),
        isActive: true,
        chartOfAccountId: chartMap['2.01.003'],
        costCenter: 'OPERACIONAL',
        bankAccountId: bankAccounts[1].id,
      },
    }),
    prisma.recurringExpense.create({
      data: {
        description: 'Software de Gestão (Click Marido)',
        amount: 197.00,
        frequency: 'MENSAL',
        dayOfMonth: 1,
        startDate: new Date('2024-01-01'),
        nextDue: new Date(),
        isActive: true,
        chartOfAccountId: chartMap['2.03.002'],
        costCenter: 'ADMINISTRATIVO',
        bankAccountId: bankAccounts[1].id,
      },
    }),
    prisma.recurringExpense.create({
      data: {
        description: 'Contador',
        amount: 800.00,
        frequency: 'MENSAL',
        dayOfMonth: 20,
        startDate: new Date('2024-01-01'),
        nextDue: new Date(),
        isActive: true,
        chartOfAccountId: chartMap['2.03.001'],
        costCenter: 'ADMINISTRATIVO',
        bankAccountId: bankAccounts[0].id,
      },
    }),
    prisma.recurringExpense.create({
      data: {
        description: 'Seguro do Estabelecimento',
        amount: 350.00,
        frequency: 'MENSAL',
        dayOfMonth: 10,
        startDate: new Date('2024-01-01'),
        nextDue: new Date(),
        isActive: true,
        chartOfAccountId: chartMap['2.01.004'],
        costCenter: 'ADMINISTRATIVO',
        bankAccountId: bankAccounts[0].id,
      },
    }),
  ]);
  console.log(`   ✅ ${recurringExpenses.length} despesas fixas criadas\n`);

  // 7. Criar Conciliações iniciais baseadas nos pagamentos
  console.log('🔗 Criando conciliações iniciais...');
  let reconciliationsCreated = 0;

  const recentPayments = payments.slice(0, 20);
  for (const payment of recentPayments) {
    if (payment.status === 'confirmado' && payment.paidAt) {
      await prisma.bankReconciliation.create({
        data: {
          bankAccountId: bankAccounts[0].id,
          transactionDate: payment.paidAt,
          description: `Recebimento - ${payment.customer?.name || 'Cliente'} - ${payment.description || 'Pagamento'}`,
          amount: Number(payment.amount),
          type: 'ENTRADA',
          isReconciled: true,
          reconciledAt: payment.paidAt,
          referenceType: 'ACCOUNT_RECEIVABLE',
          documentNumber: `REC-${payment.id.slice(-8).toUpperCase()}`,
        },
      });
      reconciliationsCreated++;
    }
  }

  const recentExpenses = expenses.filter(e => e.status === 'paga').slice(0, 15);
  for (const expense of recentExpenses) {
    if (expense.paidAt) {
      await prisma.bankReconciliation.create({
        data: {
          bankAccountId: bankAccounts[0].id,
          transactionDate: expense.paidAt,
          description: `Pagamento - ${expense.description}`,
          amount: Number(expense.amount),
          type: 'SAIDA',
          isReconciled: true,
          reconciledAt: expense.paidAt,
          referenceType: 'ACCOUNT_PAYABLE',
          documentNumber: `PAG-${expense.id.slice(-8).toUpperCase()}`,
        },
      });
      reconciliationsCreated++;
    }
  }
  console.log(`   ✅ ${reconciliationsCreated} conciliações criadas\n`);

  // 8. Resumo Final
  console.log('═══════════════════════════════════════════');
  console.log('✅ MIGRAÇÃO CONCLUÍDA COM SUCESSO!');
  console.log('═══════════════════════════════════════════\n');
  console.log('📊 Resumo:');
  console.log(`   - ${bankAccounts.length} contas bancárias`);
  console.log(`   - ${chartOfAccounts.length} contas do plano`);
  console.log(`   - ${receivablesCreated} contas a receber`);
  console.log(`   - ${payablesCreated} contas a pagar`);
  console.log(`   - ${recurringExpenses.length} despesas fixas`);
  console.log(`   - ${reconciliationsCreated} conciliações`);
  console.log('\n🎯 Financeiro pronto para uso!');
}

main()
  .catch((e) => {
    console.error('❌ Erro na migração:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
