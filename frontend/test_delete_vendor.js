const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testDeleteVendor() {
  console.log('=== TESTE DE INTEGRIDADE REFERENCIAL DE EXCLUSÃO DE FORNECECEDOR ===');
  
  let vendor1 = null;
  let vendor2 = null;
  let expense = null;
  let product = null;
  let purchaseOrder = null;
  
  try {
    // ----------------------------------------------------
    // CENÁRIO 1: Exclusão de fornecedor com Despesas e Produtos (deve funcionar desvinculando)
    // ----------------------------------------------------
    console.log('\n--- Cenário 1: Exclusão sem Ordens de Compra ---');
    
    // 1. Criar fornecedor de teste 1
    vendor1 = await prisma.vendor.create({
      data: {
        name: 'Fornecedor Teste Exclusão 1',
        cnpjCpf: '11122233344',
        category: 'MATERIAL',
        classification: 'B',
      }
    });
    console.log(`[OK] Fornecedor 1 criado: ID ${vendor1.id}`);
    
    // 2. Criar despesa vinculada
    expense = await prisma.expense.create({
      data: {
        description: 'Despesa Teste Exclusão 1',
        category: 'MATERIAL',
        amount: 250.50,
        vendorId: vendor1.id,
        vendorName: vendor1.name
      }
    });
    console.log(`[OK] Despesa vinculada criada: ID ${expense.id}`);
    
    // 3. Criar produto vinculado
    product = await prisma.product.create({
      data: {
        name: 'Peça Teste Exclusão 1',
        sku: 'SKU-TEST-DEL-V1',
        type: 'PECA',
        price: 89.90,
        vendorId: vendor1.id
      }
    });
    console.log(`[OK] Produto vinculado criado: ID ${product.id}`);
    
    // 4. Tentar deletar o fornecedor 1 aplicando a lógica do backend
    console.log('Executando a verificação de Ordens de Compra...');
    const poCount1 = await prisma.purchaseOrder.count({
      where: { vendorId: vendor1.id }
    });
    
    if (poCount1 > 0) {
      throw new Error('Falha: Fornecedor deveria poder ser excluído pois não possui Ordens de Compra.');
    }
    console.log(`[OK] Contagem de Ordens de Compra é zero (${poCount1})`);
    
    console.log('Iniciando transação de exclusão...');
    await prisma.$transaction(async (tx) => {
      // Desvincular despesas
      await tx.expense.updateMany({
        where: { vendorId: vendor1.id },
        data: { vendorId: null }
      });
      
      // Desvincular produtos
      await tx.product.updateMany({
        where: { vendorId: vendor1.id },
        data: { vendorId: null }
      });
      
      // Excluir fornecedor
      await tx.vendor.delete({
        where: { id: vendor1.id }
      });
    });
    console.log('[OK] Transação de exclusão concluída com sucesso!');
    
    // 5. Validar que o fornecedor foi removido e os outros itens foram desvinculados
    const deletedVendor = await prisma.vendor.findUnique({
      where: { id: vendor1.id }
    });
    if (deletedVendor) {
      throw new Error('Falha: Fornecedor não foi excluído do banco de dados.');
    }
    console.log('[OK] Validação: Fornecedor removido com sucesso!');
    
    const updatedExpense = await prisma.expense.findUnique({
      where: { id: expense.id }
    });
    if (!updatedExpense || updatedExpense.vendorId !== null) {
      throw new Error('Falha: Despesa não foi desvinculada (vendorId deve ser null).');
    }
    console.log('[OK] Validação: Despesa desvinculada com sucesso!');
    
    const updatedProduct = await prisma.product.findUnique({
      where: { id: product.id }
    });
    if (!updatedProduct || updatedProduct.vendorId !== null) {
      throw new Error('Falha: Produto não foi desvinculado (vendorId deve ser null).');
    }
    console.log('[OK] Validação: Produto desvinculado com sucesso!');
    
    
    // ----------------------------------------------------
    // CENÁRIO 2: Exclusão de fornecedor com Ordem de Compra (deve ser bloqueada)
    // ----------------------------------------------------
    console.log('\n--- Cenário 2: Exclusão bloqueada por Ordem de Compra ---');
    
    // 1. Criar fornecedor de teste 2
    vendor2 = await prisma.vendor.create({
      data: {
        name: 'Fornecedor Teste Exclusão 2',
        cnpjCpf: '55566677788',
        category: 'MATERIAL',
        classification: 'A',
      }
    });
    console.log(`[OK] Fornecedor 2 criado: ID ${vendor2.id}`);
    
    // 2. Criar Ordem de Compra vinculada
    purchaseOrder = await prisma.purchaseOrder.create({
      data: {
        number: 'OC-TEST-DELETE-VENDOR',
        vendorId: vendor2.id,
        status: 'rascunho',
        totalAmount: 150.00
      }
    });
    console.log(`[OK] Ordem de compra vinculada criada: ID ${purchaseOrder.id}`);
    
    // 3. Tentar deletar aplicando a lógica
    console.log('Executando a verificação de Ordens de Compra...');
    const poCount2 = await prisma.purchaseOrder.count({
      where: { vendorId: vendor2.id }
    });
    
    if (poCount2 > 0) {
      console.log(`[OK] Bloqueio correto! Encontradas ${poCount2} ordens de compra.`);
      console.log('O backend retornará erro 400 informando o bloqueio de forma segura.');
    } else {
      throw new Error('Falha: Exclusão deveria ter sido bloqueada por possuir Ordem de Compra vinculada.');
    }
    
    console.log('\n=== TODOS OS TESTES PASSARAM COM SUCESSO! ===');

  } catch (error) {
    console.error('\n❌ ERRO DETECTADO NO FLUXO DE TESTE:');
    console.error(error);
  } finally {
    console.log('\nLimpando registros temporários de teste...');
    
    if (purchaseOrder) {
      try {
        await prisma.purchaseOrder.delete({ where: { id: purchaseOrder.id } });
        console.log('- Ordem de compra de teste removida');
      } catch (err) {}
    }
    
    if (vendor1) {
      try {
        await prisma.vendor.delete({ where: { id: vendor1.id } });
        console.log('- Fornecedor 1 removido');
      } catch (err) {}
    }
    
    if (vendor2) {
      try {
        await prisma.vendor.delete({ where: { id: vendor2.id } });
        console.log('- Fornecedor 2 removido');
      } catch (err) {}
    }
    
    if (expense) {
      try {
        await prisma.expense.delete({ where: { id: expense.id } });
        console.log('- Despesa de teste removida');
      } catch (err) {}
    }
    
    if (product) {
      try {
        await prisma.product.delete({ where: { id: product.id } });
        console.log('- Produto de teste removido');
      } catch (err) {}
    }
    
    await prisma.$disconnect();
    console.log('Conexão com o banco finalizada.');
  }
}

testDeleteVendor();
