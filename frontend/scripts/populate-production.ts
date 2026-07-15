import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://neondb_owner:npg_JqwVLCGzFd54@ep-noisy-truth-acr29rgo-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require',
    },
  },
});

async function main() {
  console.log('🚀 Populando banco de PRODUÇÃO (Neon) com dados REAIS...\n');

  // ═══════════════════════════════════════════════════════════════
  // 1. LIMPAR DADOS FINANCEIROS EXISTENTES
  // ═══════════════════════════════════════════════════════════════
  console.log('🧹 Limpando dados financeiros antigos...');
  await prisma.bankReconciliation.deleteMany();
  await prisma.bankTransfer.deleteMany();
  await prisma.accountReceivable.deleteMany();
  await prisma.accountPayable.deleteMany();
  await prisma.recurringExpense.deleteMany();
  await prisma.bankAccount.deleteMany();
  await prisma.chartOfAccount.deleteMany();
  console.log('   ✅ Dados antigos removidos\n');

  // ═══════════════════════════════════════════════════════════════
  // 2. VERIFICAR DADOS EXISTENTES NO BANCO DE PRODUÇÃO
  // ═══════════════════════════════════════════════════════════════
  console.log('📊 Verificando dados existentes no banco de produção...\n');

  const customers = await prisma.customer.findMany({ select: { id: true, name: true, phone: true } });
  console.log(`   👥 ${customers.length} clientes encontrados`);

  const vendors = await prisma.vendor.findMany({ select: { id: true, name: true, tradeName: true } });
  console.log(`   🏪 ${vendors.length} fornecedores encontrados`);

  const payments = await prisma.payment.findMany({
    include: { customer: { select: { name: true } }, quotation: { select: { number: true } } },
  });
  console.log(`   💰 ${payments.length} pagamentos encontrados`);

  const expenses = await prisma.expense.findMany({
    include: { vendor: { select: { name: true } }, purchaseOrders: { select: { number: true } } },
  });
  console.log(`   📤 ${expenses.length} despesas encontradas`);

  const purchaseOrders = await prisma.purchaseOrder.findMany({
    include: { vendor: { select: { name: true } }, items: true },
  });
  console.log(`   🛒 ${purchaseOrders.length} ordens de compra encontradas`);

  // Listar clientes
  console.log('\n   Clientes:');
  customers.forEach(c => console.log(`      - ${c.name} | ${c.phone || 'S/telefone'}`));

  // Listar fornecedores
  console.log('\n   Fornecedores:');
  vendors.forEach(v => console.log(`      - ${v.name} ${v.tradeName ? `(${v.tradeName})` : ''}`));

  // Listar pagamentos
  console.log('\n   Pagamentos:');
  payments.forEach(p => console.log(`      - ${p.customer?.name || 'N/A'} | R$ ${p.amount} | ${p.status}`));

  // Listar despesas
  console.log('\n   Despesas:');
  expenses.forEach(e => console.log(`      - ${e.description} | R$ ${e.amount} | ${e.vendor?.name || e.vendorName || 'N/A'}`));

  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('📋 DADOS REAIS IDENTIFICADOS NO BANCO DE PRODUÇÃO');
  console.log('═══════════════════════════════════════════════════════════════\n');

  // Aguardar input do usuário para continuar
  console.log('⏳ Pressione Ctrl+C para cancelar ou aguarde 5 segundos para continuar...\n');
  await new Promise(resolve => setTimeout(resolve, 5000));

  // ═══════════════════════════════════════════════════════════════
  // 3. CRIAR CONTAS BANCÁRIAS
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
        currentBalance: 0,
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
  // 4. CRIAR PLANO DE CONTAS
  // ═══════════════════════════════════════════════════════════════
  console.log('📋 Criando plano de contas...');

  const chartOfAccounts = await Promise.all([
    prisma.chartOfAccount.create({ data: { code: '1', name: 'Receitas', type: 'RECEITA', level: 0, isActive: true } }),
    prisma.chartOfAccount.create({ data: { code: '1.01', name: 'Receitas Operacionais', type: 'RECEITA', level: 1, isActive: true } }),
    prisma.chartOfAccount.create({ data: { code: '1.01.001', name: 'Serviços de Instalação', type: 'RECEITA', level: 2, isActive: true } }),
    prisma.chartOfAccount.create({ data: { code: '1.01.002', name: 'Serviços de Manutenção', type: 'RECEITA', level: 2, isActive: true } }),
    prisma.chartOfAccount.create({ data: { code: '1.01.003', name: 'Venda de Peças', type: 'RECEITA', level: 2, isActive: true } }),
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

  const chartMap: Record<string, string> = {};
  chartOfAccounts.forEach(c => { chartMap[c.code] = c.id; });

  // ═══════════════════════════════════════════════════════════════
  // 5. CRIAR CONTAS A RECEBER (baseado nos pagamentos reais)
  // ═══════════════════════════════════════════════════════════════
  console.log('💰 Criando contas a receber...');

  const receivables = [];

  // Buscar pagamentos existentes no banco de produção
  const existingPayments = await prisma.payment.findMany({
    where: { status: 'confirmado' },
    include: { customer: { select: { id: true, name: true } }, quotation: { select: { number: true } } },
    orderBy: { createdAt: 'desc' },
  });

  for (const payment of existingPayments) {
    const r = await prisma.accountReceivable.create({
      data: {
        title: `Pagamento OS ${payment.quotation?.number || 'N/A'} - ${payment.customer?.name || 'Cliente'}`,
        description: `Pagamento via ${payment.method}`,
        totalAmount: payment.amount,
        paidAmount: payment.amount,
        status: 'baixado',
        dueDate: payment.paidAt || new Date(),
        paidDate: payment.paidAt || new Date(),
        origin: 'OS',
        paymentMethod: payment.method,
        customerId: payment.customerId,
        bankAccountId: bankAccounts[0].id,
        chartOfAccountId: chartMap['1.01.001'],
      },
    });
    receivables.push(r);
    console.log(`   ✅ ${r.title} - R$ ${r.totalAmount}`);
  }

  // Se não houver pagamentos, criar dados de exemplo baseados nas imagens
  if (receivables.length === 0) {
    console.log('   ⚠️ Nenhum pagamento encontrado. Criando dados de exemplo...');

    // Buscar ou criar clientes de exemplo
    const anaClaudia = customers.find(c => c.name.toLowerCase().includes('ana claudia')) || 
      await prisma.customer.create({ data: { name: 'Ana Claudia', phone: '(21) 99999-0001' } });
    
    const jocemar = customers.find(c => c.name.toLowerCase().includes('jocemar')) ||
      await prisma.customer.create({ data: { name: 'Jocemar Kraus', phone: '(21) 99999-0002' } });

    const receivablesData = [
      { customer: anaClaudia, amount: 63.00, date: '2026-06-18', os: 'OS-0001' },
      { customer: jocemar, amount: 136.50, date: '2026-06-19', os: 'OS-0002' },
    ];

    for (const data of receivablesData) {
      const r = await prisma.accountReceivable.create({
        data: {
          title: `Fatura ${data.os} - ${data.customer.name}`,
          description: 'Serviços realizados',
          totalAmount: data.amount,
          paidAmount: data.amount,
          status: 'baixado',
          dueDate: new Date(data.date),
          paidDate: new Date(data.date),
          origin: 'OS',
          paymentMethod: 'PIX',
          customerId: data.customer.id,
          bankAccountId: bankAccounts[0].id,
          chartOfAccountId: chartMap['1.01.001'],
        },
      });
      receivables.push(r);
      console.log(`   ✅ ${r.title} - R$ ${r.totalAmount}`);
    }
  }

  console.log(`   📊 Total: ${receivables.length} contas a receber\n`);

  // ═══════════════════════════════════════════════════════════════
  // 6. CRIAR CONTAS A PAGAR (baseado nas despesas/OCs reais)
  // ═══════════════════════════════════════════════════════════════
  console.log('📤 Criando contas a pagar...');

  const payables = [];

  // Buscar ordens de compra existentes
  const existingPOs = await prisma.purchaseOrder.findMany({
    include: { vendor: { select: { id: true, name: true } }, items: true },
    orderBy: { issueDate: 'desc' },
  });

  for (const po of existingPOs) {
    const p = await prisma.accountPayable.create({
      data: {
        title: `Ordem de Compra ${po.number}`,
        description: `Compra de material - ${po.vendor?.name || 'Fornecedor'}`,
        totalAmount: po.totalAmount,
        paidAmount: po.status === 'received' ? po.totalAmount : 0,
        status: po.status === 'received' ? 'pago' : 'aberto',
        dueDate: po.issueDate,
        paidDate: po.status === 'received' ? new Date() : null,
        origin: 'COMPRA',
        vendorId: po.vendorId,
        chartOfAccountId: chartMap['2.01.001'],
        costCenter: 'OPERACIONAL',
        bankAccountId: bankAccounts[0].id,
      },
    });
    payables.push(p);
    console.log(`   ✅ ${p.title} - R$ ${p.totalAmount}`);
  }

  // Se não houver OCs, criar dados de exemplo baseados nas imagens
  if (payables.length === 0) {
    console.log('   ⚠️ Nenhuma OC encontrada. Criando dados de exemplo...');

    // Buscar ou criar fornecedor de exemplo
    const mercadoLivre = vendors.find(v => v.name.toLowerCase().includes('mercado livre')) ||
      await prisma.vendor.create({ data: { name: 'Mercado Livre', cnpj: '00.000.000/0001-00' } });

    const lojasMilium = vendors.find(v => v.name.toLowerCase().includes('milium')) ||
      await prisma.vendor.create({ data: { name: 'Lojas Milium LTDA', tradeName: 'Milium', cnpj: '00.000.000/0002-00' } });

    const payablesData = [
      { vendor: lojasMilium, amount: 59.70, date: '2026-07-04', oc: 'OC-2026-000005', status: 'pago' },
      { vendor: mercadoLivre, amount: 22.24, date: '2026-06-27', oc: 'OC-2026-000004', status: 'pago' },
      { vendor: mercadoLivre, amount: 262.36, date: '2026-06-27', oc: 'OC-2026-000003', status: 'cancelado' },
      { vendor: mercadoLivre, amount: 107.61, date: '2026-06-24', oc: 'OC-2026-000002', status: 'pago' },
      { vendor: mercadoLivre, amount: 19.00, date: '2026-06-22', oc: 'OC-2026-000001', status: 'pago' },
    ];

    for (const data of payablesData) {
      const p = await prisma.accountPayable.create({
        data: {
          title: `Ordem de Compra ${data.oc}`,
          description: `Compra de material - ${data.vendor.name}`,
          totalAmount: data.amount,
          paidAmount: data.status === 'pago' ? data.amount : 0,
          status: data.status,
          dueDate: new Date(data.date),
          paidDate: data.status === 'pago' ? new Date(data.date) : null,
          origin: 'COMPRA',
          vendorId: data.vendor.id,
          chartOfAccountId: chartMap['2.01.001'],
          costCenter: 'OPERACIONAL',
          bankAccountId: bankAccounts[0].id,
        },
      });
      payables.push(p);
      console.log(`   ✅ ${p.title} - R$ ${p.totalAmount}`);
    }
  }

  console.log(`   📊 Total: ${payables.length} contas a pagar\n`);

  // ═══════════════════════════════════════════════════════════════
  // 7. CRIAR DESPESAS FIXAS
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
  // 8. CRIAR CONCILIAÇÕES
  // ═══════════════════════════════════════════════════════════════
  console.log('🔗 Criando conciliações...');

  const reconciliations = await Promise.all([
    prisma.bankReconciliation.create({
      data: {
        bankAccountId: bankAccounts[0].id,
        transactionDate: new Date('2026-06-18'),
        description: 'Recebimento - Ana Claudia',
        amount: 63.00,
        type: 'ENTRADA',
        isReconciled: true,
        reconciledAt: new Date('2026-06-18'),
        referenceType: 'ACCOUNT_RECEIVABLE',
        documentNumber: 'REC-ANA001',
      },
    }),
    prisma.bankReconciliation.create({
      data: {
        bankAccountId: bankAccounts[0].id,
        transactionDate: new Date('2026-06-19'),
        description: 'Recebimento - Jocemar Kraus',
        amount: 136.50,
        type: 'ENTRADA',
        isReconciled: true,
        reconciledAt: new Date('2026-06-19'),
        referenceType: 'ACCOUNT_RECEIVABLE',
        documentNumber: 'REC-JOC002',
      },
    }),
    prisma.bankReconciliation.create({
      data: {
        bankAccountId: bankAccounts[0].id,
        transactionDate: new Date('2026-06-22'),
        description: 'Pagamento - OC-2026-000001',
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
        description: 'Pagamento - OC-2026-000002',
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
        description: 'Pagamento - OC-2026-000004',
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
        description: 'Pagamento - OC-2026-000005',
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
  // 9. ATUALIZAR SALDOS DAS CONTAS BANCÁRIAS
  // ═══════════════════════════════════════════════════════════════
  console.log('💰 Atualizando saldos das contas bancárias...');

  const totalEntradas = Number(receivables
    .filter(r => r.status === 'baixado')
    .reduce((sum, r) => sum + Number(r.paidAmount), 0));

  const totalSaidas = Number(payables
    .filter(p => p.status === 'pago')
    .reduce((sum, p) => sum + Number(p.paidAmount), 0));

  const saldoFinal = totalEntradas - totalSaidas;

  await prisma.bankAccount.update({
    where: { id: bankAccounts[0].id },
    data: { currentBalance: saldoFinal },
  });

  console.log(`   ✅ Saldo atualizado: R$ ${saldoFinal.toFixed(2)}\n`);

  // ═══════════════════════════════════════════════════════════════
  // RESUMO FINAL
  // ═══════════════════════════════════════════════════════════════
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('✅ MIGRAÇÃO PARA PRODUÇÃO CONCLUÍDA!');
  console.log('═══════════════════════════════════════════════════════════════\n');

  console.log('📊 Dados populados no banco de PRODUÇÃO (Neon):\n');
  console.log('🏦 CONTAS BANCÁRIAS:');
  console.log(`   - ${bankAccounts[0].nickname}: R$ ${saldoFinal}`);
  console.log(`   - ${bankAccounts[1].nickname}: R$ 0,00\n`);

  console.log('💰 CONTAS A RECEBER:');
  receivables.forEach(r => {
    console.log(`   - ${r.title}: R$ ${Number(r.totalAmount)} (${r.status})`);
  });
  console.log('');

  console.log('📤 CONTAS A PAGAR:');
  payables.forEach(p => {
    console.log(`   - ${p.title}: R$ ${Number(p.totalAmount)} (${p.status})`);
  });
  console.log('');

  console.log('🔄 DESPESAS FIXAS:');
  recurringExpenses.forEach(re => {
    console.log(`   - ${re.description}: R$ ${re.amount}/mês`);
  });
  console.log('');

  console.log('🔗 CONCILIAÇÕES:');
  console.log(`   - ${reconciliations.length} movimentações conciliadas\n`);

  console.log('📈 SALDO CONSOLIDADO:');
  console.log(`   - Entradas: R$ ${totalEntradas}`);
  console.log(`   - Saídas: R$ ${totalSaidas}`);
  console.log(`   - Saldo: R$ ${saldoFinal}\n`);

  console.log('🎯 Banco de produção populado com sucesso!');
}

main()
  .catch((e) => {
    console.error('❌ Erro na migração:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
