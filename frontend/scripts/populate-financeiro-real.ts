import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Populando módulo financeiro com dados REAIS do sistema...\n');

  // ═══════════════════════════════════════════════════════════════
  // 1. CONTAS BANCÁRIAS (baseado na realidade do negócio)
  // ═══════════════════════════════════════════════════════════════
  console.log('🏦 Criando contas bancárias...');

  const bankAccounts = await Promise.all([
    prisma.bankAccount.create({
      data: {
        bankName: 'Banco do Brasil',
        agency: '4521-8',
        accountNumber: '78901-2',
        accountType: 'CORRENTE',
        nickname: 'Conta Principal',
        initialBalance: 0,
        currentBalance: 199.50, // Soma dos pagamentos: 63 + 136.50
        status: 'ativa',
        color: '#1e40af',
        isDefault: true,
      },
    }),
    prisma.bankAccount.create({
      data: {
        bankName: 'Nubank',
        agency: '0001',
        accountNumber: '98765-4',
        accountType: 'CORRENTE',
        nickname: 'Nubank Empresarial',
        initialBalance: 0,
        currentBalance: 0,
        status: 'ativa',
        color: '#8b5cf6',
        isDefault: false,
      },
    }),
  ]);
  console.log(`   ✅ ${bankAccounts.length} contas bancárias criadas\n`);

  // ═══════════════════════════════════════════════════════════════
  // 2. PLANO DE CONTAS (hierárquico)
  // ═══════════════════════════════════════════════════════════════
  console.log('📋 Criando plano de contas...');

  const chartOfAccounts = await Promise.all([
    // RECEITAS
    prisma.chartOfAccount.create({ data: { code: '1', name: 'Receitas', type: 'RECEITA', level: 0, isActive: true } }),
    prisma.chartOfAccount.create({ data: { code: '1.01', name: 'Receitas Operacionais', type: 'RECEITA', level: 1, isActive: true } }),
    prisma.chartOfAccount.create({ data: { code: '1.01.001', name: 'Serviços de Instalação', type: 'RECEITA', level: 2, isActive: true } }),
    prisma.chartOfAccount.create({ data: { code: '1.01.002', name: 'Serviços de Manutenção', type: 'RECEITA', level: 2, isActive: true } }),
    prisma.chartOfAccount.create({ data: { code: '1.01.003', name: 'Venda de Peças', type: 'RECEITA', level: 2, isActive: true } }),
    // DESPESAS
    prisma.chartOfAccount.create({ data: { code: '2', name: 'Despesas', type: 'DESPESA', level: 0, isActive: true } }),
    prisma.chartOfAccount.create({ data: { code: '2.01', name: 'Despesas com Material', type: 'DESPESA', level: 1, isActive: true } }),
    prisma.chartOfAccount.create({ data: { code: '2.01.001', name: 'Material de Consumo', type: 'DESPESA', level: 2, isActive: true } }),
    prisma.chartOfAccount.create({ data: { code: '2.01.002', name: 'Peças e Acessórios', type: 'DESPESA', level: 2, isActive: true } }),
    prisma.chartOfAccount.create({ data: { code: '2.02', name: 'Despesas Administrativas', type: 'DESPESA', level: 1, isActive: true } }),
    prisma.chartOfAccount.create({ data: { code: '2.02.001', name: 'Aluguel', type: 'DESPESA', level: 2, isActive: true } }),
    prisma.chartOfAccount.create({ data: { code: '2.02.002', name: 'Energia e Água', type: 'DESPESA', level: 2, isActive: true } }),
    prisma.chartOfAccount.create({ data: { code: '2.02.003', name: 'Internet e Telefone', type: 'DESPESA', level: 2, isActive: true } }),
    prisma.chartOfAccount.create({ data: { code: '2.02.004', name: 'Software e Ferramentas', type: 'DESPESA', level: 2, isActive: true } }),
  ]);
  console.log(`   ✅ ${chartOfAccounts.length} contas do plano criadas\n`);

  // Mapear códigos para IDs
  const chartMap: Record<string, string> = {};
  chartOfAccounts.forEach(c => { chartMap[c.code] = c.id; });

  // ═══════════════════════════════════════════════════════════════
  // 3. CONTAS A RECEBER (dados reais das imagens)
  // ═══════════════════════════════════════════════════════════════
  console.log('💰 Criando contas a receber com dados reais...');

  // Buscar clientes reais
  const anaClaudia = await prisma.customer.findFirst({ where: { name: { contains: 'Ana Claudia', mode: 'insensitive' } } });
  const jocemar = await prisma.customer.findFirst({ where: { name: { contains: 'Jocemar', mode: 'insensitive' } } });
  const joseCarlos = await prisma.customer.findFirst({ where: { name: { contains: 'José Carlos', mode: 'insensitive' } } });

  const receivables = [];

  // Faturas pagas (das imagens)
  if (anaClaudia) {
    const r1 = await prisma.accountReceivable.create({
      data: {
        title: 'Fatura #001 - Ana Claudia',
        description: 'Serviços realizados - OS-0001',
        totalAmount: 63.00,
        paidAmount: 63.00,
        status: 'baixado',
        dueDate: new Date('2026-06-18'),
        paidDate: new Date('2026-06-18'),
        origin: 'FATURAMENTO',
        paymentMethod: 'PIX',
        customerId: anaClaudia.id,
        bankAccountId: bankAccounts[0].id,
        chartOfAccountId: chartMap['1.01.001'],
      },
    });
    receivables.push(r1);
  }

  if (jocemar) {
    const r2 = await prisma.accountReceivable.create({
      data: {
        title: 'Fatura #002 - Jocemar Kraus',
        description: 'Serviços realizados - OS-0002',
        totalAmount: 136.50,
        paidAmount: 136.50,
        status: 'baixado',
        dueDate: new Date('2026-06-19'),
        paidDate: new Date('2026-06-19'),
        origin: 'FATURAMENTO',
        paymentMethod: 'PIX',
        customerId: jocemar.id,
        bankAccountId: bankAccounts[0].id,
        chartOfAccountId: chartMap['1.01.001'],
      },
    });
    receivables.push(r2);
  }

  // Faturas canceladas (José Carlos)
  if (joseCarlos) {
    const cancelledInvoices = [
      { number: '#INV-2026-0005-870', amount: 720.00, date: '2026-07-03' },
      { number: '#INV-2026-0004-631', amount: 150.00, date: '2026-07-02' },
      { number: '#INV-2026-0003-109', amount: 100.00, date: '2026-07-02' },
    ];

    for (const inv of cancelledInvoices) {
      const r = await prisma.accountReceivable.create({
        data: {
          title: `Fatura ${inv.number} - José Carlos da Silva`,
          description: 'Fatura cancelada',
          totalAmount: inv.amount,
          paidAmount: 0,
          status: 'cancelado',
          dueDate: new Date(inv.date),
          origin: 'FATURAMENTO',
          customerId: joseCarlos.id,
          bankAccountId: bankAccounts[0].id,
          chartOfAccountId: chartMap['1.01.001'],
        },
      });
      receivables.push(r);
    }
  }

  console.log(`   ✅ ${receivables.length} contas a receber criadas\n`);

  // ═══════════════════════════════════════════════════════════════
  // 4. CONTAS A PAGAR (despesas reais das imagens)
  // ═══════════════════════════════════════════════════════════════
  console.log('📤 Criando contas a pagar com dados reais...');

  // Buscar fornecedores reais
  const mercadoLivre = await prisma.vendor.findFirst({ where: { name: { contains: 'Mercado Livre', mode: 'insensitive' } } });
  const lojasMilium = await prisma.vendor.findFirst({ where: { name: { contains: 'Milium', mode: 'insensitive' } } });

  const payables = [];

  // Despesas das imagens (baseado na imagem de despesas)
  const expensesData = [
    { desc: 'Ordem de Compra OC-2026-000005 - Lojas Milium LTDA - LJ 29', amount: 59.70, date: '2026-07-04', status: 'pago', vendorId: lojasMilium?.id, oc: 'OC-2026-000005' },
    { desc: 'Ordem de Compra OC-2026-000004', amount: 22.24, date: '2026-06-27', status: 'pago', vendorId: mercadoLivre?.id, oc: 'OC-2026-000004' },
    { desc: 'Ordem de Compra OC-2026-000003', amount: 262.36, date: '2026-06-27', status: 'cancelado', vendorId: mercadoLivre?.id, oc: 'OC-2026-000003' },
    { desc: 'Ordem de Compra OC-2026-000002', amount: 107.61, date: '2026-06-24', status: 'pago', vendorId: mercadoLivre?.id, oc: 'OC-2026-000002' },
    { desc: 'Ordem de Compra OC-2026-000001', amount: 19.00, date: '2026-06-22', status: 'pago', vendorId: mercadoLivre?.id, oc: 'OC-2026-000001' },
  ];

  for (const exp of expensesData) {
    const p = await prisma.accountPayable.create({
      data: {
        title: exp.desc,
        description: `Compra de material - ${exp.oc}`,
        totalAmount: exp.amount,
        paidAmount: exp.status === 'pago' ? exp.amount : 0,
        status: exp.status,
        dueDate: new Date(exp.date),
        paidDate: exp.status === 'pago' ? new Date(exp.date) : null,
        origin: 'COMPRA',
        vendorId: exp.vendorId,
        chartOfAccountId: chartMap['2.01.001'],
        costCenter: 'OPERACIONAL',
        bankAccountId: bankAccounts[0].id,
      },
    });
    payables.push(p);
  }

  // Despesas de teste (Custo OS)
  const testExpenses = [
    { desc: 'Custo Teste OS', amount: 100.00, date: '2026-06-20' },
    { desc: 'Custo Teste OS', amount: 100.00, date: '2026-06-20' },
    { desc: 'Custo Teste OS', amount: 100.00, date: '2026-06-20' },
  ];

  for (const exp of testExpenses) {
    const p = await prisma.accountPayable.create({
      data: {
        title: exp.desc,
        description: 'Custo operacional de OS',
        totalAmount: exp.amount,
        paidAmount: 0,
        status: 'aberto',
        dueDate: new Date(exp.date),
        origin: 'DESPESA',
        chartOfAccountId: chartMap['2.01.001'],
        costCenter: 'OPERACIONAL',
        bankAccountId: bankAccounts[0].id,
      },
    });
    payables.push(p);
  }

  console.log(`   ✅ ${payables.length} contas a pagar criadas\n`);

  // ═══════════════════════════════════════════════════════════════
  // 5. DESPESAS FIXAS (baseado na realidade do negócio)
  // ═══════════════════════════════════════════════════════════════
  console.log('🔄 Criando despesas fixas...');

  const recurringExpenses = await Promise.all([
    prisma.recurringExpense.create({
      data: {
        description: 'Software Click Marido CRM',
        amount: 197.00,
        frequency: 'MENSAL',
        dayOfMonth: 1,
        startDate: new Date('2026-01-01'),
        nextDue: new Date('2026-08-01'),
        isActive: true,
        chartOfAccountId: chartMap['2.02.004'],
        costCenter: 'ADMINISTRATIVO',
        bankAccountId: bankAccounts[1].id,
      },
    }),
    prisma.recurringExpense.create({
      data: {
        description: 'Internet - Fibra',
        amount: 150.00,
        frequency: 'MENSAL',
        dayOfMonth: 10,
        startDate: new Date('2026-01-01'),
        nextDue: new Date('2026-08-10'),
        isActive: true,
        chartOfAccountId: chartMap['2.02.003'],
        costCenter: 'OPERACIONAL',
        bankAccountId: bankAccounts[0].id,
      },
    }),
  ]);
  console.log(`   ✅ ${recurringExpenses.length} despesas fixas criadas\n`);

  // ═══════════════════════════════════════════════════════════════
  // 6. CONCILIAÇÕES (baseadas nos pagamentos reais)
  // ═══════════════════════════════════════════════════════════════
  console.log('🔗 Criando conciliações...');

  const reconciliations = await Promise.all([
    // Pagamento Ana Claudia
    prisma.bankReconciliation.create({
      data: {
        bankAccountId: bankAccounts[0].id,
        transactionDate: new Date('2026-06-18'),
        description: 'Recebimento - Ana Claudia - Serviço instalação',
        amount: 63.00,
        type: 'ENTRADA',
        isReconciled: true,
        reconciledAt: new Date('2026-06-18'),
        referenceType: 'ACCOUNT_RECEIVABLE',
        documentNumber: 'REC-ANA001',
      },
    }),
    // Pagamento Jocemar Kraus
    prisma.bankReconciliation.create({
      data: {
        bankAccountId: bankAccounts[0].id,
        transactionDate: new Date('2026-06-19'),
        description: 'Recebimento - Jocemar Kraus - Serviço instalação',
        amount: 136.50,
        type: 'ENTRADA',
        isReconciled: true,
        reconciledAt: new Date('2026-06-19'),
        referenceType: 'ACCOUNT_RECEIVABLE',
        documentNumber: 'REC-JOC002',
      },
    }),
    // Pagamento OC Mercado Livre
    prisma.bankReconciliation.create({
      data: {
        bankAccountId: bankAccounts[0].id,
        transactionDate: new Date('2026-06-22'),
        description: 'Pagamento - OC-2026-000001 - Mercado Livre',
        amount: 19.00,
        type: 'SAIDA',
        isReconciled: true,
        reconciledAt: new Date('2026-06-22'),
        referenceType: 'ACCOUNT_PAYABLE',
        documentNumber: 'PAG-OC001',
      },
    }),
    prisma.bankReconciliation.create({
      data: {
        bankAccountId: bankAccounts[0].id,
        transactionDate: new Date('2026-06-24'),
        description: 'Pagamento - OC-2026-000002 - Mercado Livre',
        amount: 107.61,
        type: 'SAIDA',
        isReconciled: true,
        reconciledAt: new Date('2026-06-24'),
        referenceType: 'ACCOUNT_PAYABLE',
        documentNumber: 'PAG-OC002',
      },
    }),
    prisma.bankReconciliation.create({
      data: {
        bankAccountId: bankAccounts[0].id,
        transactionDate: new Date('2026-06-27'),
        description: 'Pagamento - OC-2026-000004 - Mercado Livre',
        amount: 22.24,
        type: 'SAIDA',
        isReconciled: true,
        reconciledAt: new Date('2026-06-27'),
        referenceType: 'ACCOUNT_PAYABLE',
        documentNumber: 'PAG-OC004',
      },
    }),
    prisma.bankReconciliation.create({
      data: {
        bankAccountId: bankAccounts[0].id,
        transactionDate: new Date('2026-07-04'),
        description: 'Pagamento - OC-2026-000005 - Lojas Milium LTDA',
        amount: 59.70,
        type: 'SAIDA',
        isReconciled: true,
        reconciledAt: new Date('2026-07-04'),
        referenceType: 'ACCOUNT_PAYABLE',
        documentNumber: 'PAG-OC005',
      },
    }),
  ]);
  console.log(`   ✅ ${reconciliations.length} conciliações criadas\n`);

  // ═══════════════════════════════════════════════════════════════
  // RESUMO FINAL
  // ═══════════════════════════════════════════════════════════════
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('✅ MIGRAÇÃO COM DADOS REAIS CONCLUÍDA!');
  console.log('═══════════════════════════════════════════════════════════════\n');

  console.log('📊 Dados populados:\n');
  console.log('🏦 CONTAS BANCÁRIAS:');
  console.log(`   - ${bankAccounts[0].nickname}: R$ ${bankAccounts[0].currentBalance}`);
  console.log(`   - ${bankAccounts[1].nickname}: R$ ${bankAccounts[1].currentBalance}\n`);

  console.log('💰 CONTAS A RECEBER:');
  console.log(`   - Ana Claudia: R$ 63,00 (Pago)`);
  console.log(`   - Jocemar Kraus: R$ 136,50 (Pago)`);
  console.log(`   - José Carlos: 3 faturas canceladas (R$ 970,00)\n`);

  console.log('📤 CONTAS A PAGAR:');
  console.log(`   - OC-2026-000001: R$ 19,00 (Pago)`);
  console.log(`   - OC-2026-000002: R$ 107,61 (Pago)`);
  console.log(`   - OC-2026-000003: R$ 262,36 (Cancelado)`);
  console.log(`   - OC-2026-000004: R$ 22,24 (Pago)`);
  console.log(`   - OC-2026-000005: R$ 59,70 (Pago)`);
  console.log(`   - 3x Custo Teste OS: R$ 300,00 (Pendente)\n`);

  console.log('🔄 DESPESAS FIXAS:');
  console.log(`   - Software Click Marido: R$ 197,00/mês`);
  console.log(`   - Internet Fibra: R$ 150,00/mês\n`);

  console.log('🔗 CONCILIAÇÕES:');
  console.log(`   - 6 movimentações conciliadas\n`);

  console.log('📈 SALDO CONSOLIDADO:');
  const totalEntradas = 63.00 + 136.50;
  const totalSaidas = 19.00 + 107.61 + 22.24 + 59.70;
  console.log(`   - Entradas: R$ ${totalEntradas.toFixed(2)}`);
  console.log(`   - Saídas: R$ ${totalSaidas.toFixed(2)}`);
  console.log(`   - Saldo: R$ ${(totalEntradas - totalSaidas).toFixed(2)}\n`);

  console.log('🎯 Financeiro populado com dados REAIS do sistema!');
}

main()
  .catch((e) => {
    console.error('❌ Erro na migração:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
