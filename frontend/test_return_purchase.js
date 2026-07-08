const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testReturnPurchaseFlow() {
  console.log('=== TESTE DO FLUXO COMPLETO DE DEVOLUÇÃO E ALTERAÇÃO REVERSA ===');
  
  let vendor = null;
  let product = null;
  let expense = null;
  let purchaseOrder = null;
  let initialBalance = 0;
  
  try {
    // 0. Obter saldo inicial do Livro Caixa para referência
    const lastTx = await prisma.financialTransaction.findFirst({
      orderBy: { createdAt: 'desc' },
      select: { balance: true }
    });
    initialBalance = lastTx?.balance ? Number(lastTx.balance) : 0;
    console.log(`Saldo inicial do caixa: R$ ${initialBalance.toFixed(2)}`);

    // 1. Setup do Fornecedor e Produto
    vendor = await prisma.vendor.create({
      data: {
        name: 'Fornecedor Teste Devolução Completa',
        cnpjCpf: '99988877766',
        category: 'MATERIAL',
        classification: 'A',
      }
    });
    console.log(`[OK] Fornecedor criado: ID ${vendor.id}`);
    
    product = await prisma.product.create({
      data: {
        name: 'Parafuso de Aço Teste Devolução',
        sku: 'SKU-TEST-RETURN-FLOW-1',
        type: 'PECA',
        price: 5.00,
        quantity: 10, // estoque inicial = 10
        vendorId: vendor.id
      }
    });
    console.log(`[OK] Produto (Peça) criado: ID ${product.id}. Estoque Inicial: ${product.quantity}`);

    // 2. Criar Ordem de Compra em status "aprovada"
    purchaseOrder = await prisma.purchaseOrder.create({
      data: {
        number: 'OC-TEST-RET-FLOW',
        vendorId: vendor.id,
        status: 'aprovada',
        subtotal: 25.00,
        totalAmount: 25.00,
        items: {
          create: [
            {
              productId: product.id,
              description: 'Parafuso de Aço Teste Devolução',
              quantity: 5, // pedidas = 5
              unit: 'un',
              unitPrice: 5.00,
              subtotal: 25.00,
              receivedQuantity: 0,
              status: 'pendente'
            }
          ]
        }
      },
      include: {
        items: true
      }
    });
    console.log(`[OK] Ordem de Compra criada: ${purchaseOrder.number} (ID: ${purchaseOrder.id})`);

    // 3. Criar despesa vinculada
    expense = await prisma.expense.create({
      data: {
        description: 'Compra de Material - OC-TEST-RET-FLOW',
        category: 'MATERIAL',
        amount: 25.00,
        vendorId: vendor.id,
        vendorName: vendor.name,
        status: 'pendente',
        purchaseOrders: {
          connect: { id: purchaseOrder.id }
        }
      }
    });
    console.log(`[OK] Despesa vinculada criada: ID ${expense.id}. Status: ${expense.status}`);
    
    // Atualizar OC com a despesa vinculada
    purchaseOrder = await prisma.purchaseOrder.update({
      where: { id: purchaseOrder.id },
      data: { expenseId: expense.id },
      include: { items: true }
    });

    // ----------------------------------------------------
    // PASSO A: Dar Entrada Completa no Estoque (Receber Tudo)
    // ----------------------------------------------------
    console.log('\n--- Passo A: Dar Entrada Completa (Recebimento) ---');
    
    await prisma.$transaction(async (tx) => {
      const dbItem = purchaseOrder.items[0];
      
      // Atualizar item recebido
      await tx.purchaseOrderItem.update({
        where: { id: dbItem.id },
        data: {
          receivedQuantity: 5,
          status: 'recebido_total'
        }
      });
      
      // Incrementar estoque do produto
      await tx.product.update({
        where: { id: product.id },
        data: { quantity: { increment: 5 } } // estoque deve ir de 10 para 15
      });
      
      // Baixar despesa para paga
      await tx.expense.update({
        where: { id: expense.id },
        data: {
          status: 'paga',
          paidAt: new Date()
        }
      });
      
      // Criar transação de débito no livro caixa
      await tx.financialTransaction.create({
        data: {
          type: 'EXPENSE_PAID',
          expenseId: expense.id,
          credit: 0,
          debit: 25.00,
          balance: initialBalance - 25.00,
          description: `Pagamento de Despesa (Automático via Recebimento OC): ${expense.description}`,
          transactionDate: new Date()
        }
      });
      
      // Atualizar status global da OC
      await tx.purchaseOrder.update({
        where: { id: purchaseOrder.id },
        data: {
          status: 'recebida',
          deliveredAt: new Date()
        }
      });
    });
    console.log('[OK] Entrada efetuada com sucesso!');

    // Validar status após recebimento
    const checkProductA = await prisma.product.findUnique({ where: { id: product.id } });
    const checkExpenseA = await prisma.expense.findUnique({ where: { id: expense.id } });
    const checkOrderA = await prisma.purchaseOrder.findUnique({ where: { id: purchaseOrder.id }, include: { items: true } });
    const checkTxA = await prisma.financialTransaction.findFirst({
      where: { expenseId: expense.id, type: 'EXPENSE_PAID' }
    });

    console.log(`- Estoque do produto (esperado 15): ${checkProductA.quantity}`);
    console.log(`- Status da despesa (esperado paga): ${checkExpenseA.status}`);
    console.log(`- Status da Ordem de Compra (esperado recebida): ${checkOrderA.status}`);
    console.log(`- Qtd. recebida do item (esperado 5): ${checkOrderA.items[0].receivedQuantity}`);
    console.log(`- Transação de débito criada: R$ ${Number(checkTxA.debit).toFixed(2)} (Saldo: R$ ${Number(checkTxA.balance).toFixed(2)})`);

    if (checkProductA.quantity !== 15 || checkExpenseA.status !== 'paga' || checkOrderA.status !== 'recebida' || !checkTxA) {
      throw new Error('Falha na validação do Passo A (Recebimento)');
    }


    // ----------------------------------------------------
    // PASSO B: Devolução Parcial de 3 Unidades
    // ----------------------------------------------------
    console.log('\n--- Passo B: Devolução Parcial de 3 unidades ---');
    
    // Vamos chamar o fluxo simulando a nova API de devolução
    const returnedItemsB = [
      { itemId: purchaseOrder.items[0].id, quantityReturned: 3 }
    ];

    await prisma.$transaction(async (tx) => {
      let totalRefunded = 0;
      
      for (const rx of returnedItemsB) {
        const item = checkOrderA.items.find(i => i.id === rx.itemId);
        
        // Nova quantidade recebida = 5 - 3 = 2
        const newReceivedQty = Number(item.receivedQuantity) - rx.quantityReturned;
        
        // Atualizar item
        await tx.purchaseOrderItem.update({
          where: { id: rx.itemId },
          data: {
            receivedQuantity: newReceivedQty,
            status: 'recebido_parcial'
          }
        });
        
        // Decrementar estoque físico: estoque deve ir de 15 para 12
        await tx.product.update({
          where: { id: item.productId },
          data: {
            quantity: { decrement: rx.quantityReturned }
          }
        });
        
        // Calcular estorno proporcional
        const refundAmount = rx.quantityReturned * (Number(item.subtotal) / Number(item.quantity)); // 3 * (25/5) = 15.00
        totalRefunded += refundAmount;
      }

      // Buscar itens para status da OC
      const newStatus = 'parcialmente_recebida';
      
      // Atualizar OC
      await tx.purchaseOrder.update({
        where: { id: purchaseOrder.id },
        data: { status: newStatus }
      });

      // Atualizar nota da despesa
      const formattedRefund = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalRefunded);
      const refundNote = `\n[DEVOLUÇÃO EM ${new Date().toLocaleDateString('pt-BR')}] Reembolso de ${formattedRefund} gerado via devolução de itens da OC ${purchaseOrder.number}.`;
      await tx.expense.update({
        where: { id: expense.id },
        data: {
          notes: (checkExpenseA.notes || '') + refundNote
        }
      });

      // Gerar transação de reembolso (crédito) no livro caixa
      const lastTx = await tx.financialTransaction.findFirst({
        orderBy: { createdAt: 'desc' },
        select: { balance: true }
      });
      const prevBal = lastTx?.balance ? Number(lastTx.balance) : 0;
      const newBal = prevBal + totalRefunded; // (initialBalance - 25.00) + 15.00 = initialBalance - 10.00

      await tx.financialTransaction.create({
        data: {
          type: 'EXPENSE_REFUND',
          expenseId: expense.id,
          credit: totalRefunded,
          debit: 0,
          balance: newBal,
          description: `Estorno Parcial de Compra (Reembolso OC): ${purchaseOrder.number}`,
          notes: `Reembolso de devolução parcial de 3 unidades.`,
          transactionDate: new Date()
        }
      });
    });
    console.log('[OK] Devolução parcial registrada com sucesso!');

    // Validar status após devolução parcial
    const checkProductB = await prisma.product.findUnique({ where: { id: product.id } });
    const checkExpenseB = await prisma.expense.findUnique({ where: { id: expense.id } });
    const checkOrderB = await prisma.purchaseOrder.findUnique({ where: { id: purchaseOrder.id }, include: { items: true } });
    const checkTxB = await prisma.financialTransaction.findFirst({
      where: { expenseId: expense.id, type: 'EXPENSE_REFUND' }
    });

    console.log(`- Estoque do produto (esperado 12): ${checkProductB.quantity}`);
    console.log(`- Status da despesa (esperado paga): ${checkExpenseB.status}`);
    console.log(`- Notas da despesa (esperado ter a nota de reembolso): \n${checkExpenseB.notes}`);
    console.log(`- Status da Ordem de Compra (esperado parcialmente_recebida): ${checkOrderB.status}`);
    console.log(`- Qtd. recebida do item (esperado 2): ${checkOrderB.items[0].receivedQuantity}`);
    console.log(`- Transação de reembolso (crédito) criada: R$ ${Number(checkTxB.credit).toFixed(2)} (Novo Saldo: R$ ${Number(checkTxB.balance).toFixed(2)})`);

    if (checkProductB.quantity !== 12 || checkExpenseB.status !== 'paga' || checkOrderB.status !== 'parcialmente_recebida' || !checkTxB || Number(checkTxB.credit) !== 15.00) {
      throw new Error('Falha na validação do Passo B (Devolução Parcial)');
    }


    // ----------------------------------------------------
    // PASSO C: Devolução do Restante (Devolução Total) - 2 Unidades
    // ----------------------------------------------------
    console.log('\n--- Passo C: Devolução Completa (Restante de 2 unidades) ---');
    
    const returnedItemsC = [
      { itemId: purchaseOrder.items[0].id, quantityReturned: 2 }
    ];

    await prisma.$transaction(async (tx) => {
      let totalRefunded = 0;
      
      for (const rx of returnedItemsC) {
        const item = checkOrderB.items.find(i => i.id === rx.itemId);
        
        // Nova quantidade recebida = 2 - 2 = 0
        const newReceivedQty = Number(item.receivedQuantity) - rx.quantityReturned;
        
        // Atualizar item
        await tx.purchaseOrderItem.update({
          where: { id: rx.itemId },
          data: {
            receivedQuantity: newReceivedQty,
            status: 'pendente'
          }
        });
        
        // Decrementar estoque físico: estoque deve ir de 12 para 10 (voltando ao inicial)
        await tx.product.update({
          where: { id: item.productId },
          data: {
            quantity: { decrement: rx.quantityReturned }
          }
        });
        
        // Calcular estorno proporcional
        const refundAmount = rx.quantityReturned * (Number(item.subtotal) / Number(item.quantity)); // 2 * (25/5) = 10.00
        totalRefunded += refundAmount;
      }

      // Como todas as quantidades recebidas zeraram, o status global da OC vira 'devolvida'
      const newStatus = 'devolvida';
      
      // Atualizar OC
      await tx.purchaseOrder.update({
        where: { id: purchaseOrder.id },
        data: { 
          status: newStatus,
          deliveredAt: null // Limpa entrega
        }
      });

      // Devolução total: Marca a despesa como cancelada e anexa nota
      const formattedRefund = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalRefunded);
      const refundNote = `\n[DEVOLUÇÃO TOTAL EM ${new Date().toLocaleDateString('pt-BR')}] Reembolso de ${formattedRefund} gerado. Despesa cancelada integralmente.`;
      await tx.expense.update({
        where: { id: expense.id },
        data: {
          status: 'cancelada',
          notes: (checkExpenseB.notes || '') + refundNote
        }
      });

      // Gerar transação de reembolso (crédito) no livro caixa de R$ 10.00
      const lastTx = await tx.financialTransaction.findFirst({
        orderBy: { createdAt: 'desc' },
        select: { balance: true }
      });
      const prevBal = lastTx?.balance ? Number(lastTx.balance) : 0;
      const newBal = prevBal + totalRefunded; // (initialBalance - 10.00) + 10.00 = initialBalance

      await tx.financialTransaction.create({
        data: {
          type: 'EXPENSE_REFUND',
          expenseId: expense.id,
          credit: totalRefunded,
          debit: 0,
          balance: newBal,
          description: `Estorno Total de Compra (Reembolso OC): ${purchaseOrder.number}`,
          notes: `Reembolso de devolução total do restante de 2 unidades.`,
          transactionDate: new Date()
        }
      });
    });
    console.log('[OK] Devolução total registrada com sucesso!');

    // Validar status após devolução total
    const checkProductC = await prisma.product.findUnique({ where: { id: product.id } });
    const checkExpenseC = await prisma.expense.findUnique({ where: { id: expense.id } });
    const checkOrderC = await prisma.purchaseOrder.findUnique({ where: { id: purchaseOrder.id }, include: { items: true } });
    const checkTxsC = await prisma.financialTransaction.findMany({
      where: { expenseId: expense.id, type: 'EXPENSE_REFUND' }
    });
    
    // Obter última transação geral
    const finalTx = await prisma.financialTransaction.findFirst({
      orderBy: { createdAt: 'desc' }
    });

    console.log(`- Estoque do produto (esperado 10): ${checkProductC.quantity}`);
    console.log(`- Status da despesa (esperado cancelada): ${checkExpenseC.status}`);
    console.log(`- Status da Ordem de Compra (esperado devolvida): ${checkOrderC.status}`);
    console.log(`- Qtd. recebida do item (esperado 0): ${checkOrderC.items[0].receivedQuantity}`);
    console.log(`- Transações de estorno criadas (esperado 2): ${checkTxsC.length}`);
    console.log(`- Saldo Final do Caixa (esperado igual ao inicial ${initialBalance.toFixed(2)}): R$ ${Number(finalTx.balance).toFixed(2)}`);

    if (checkProductC.quantity !== 10 || checkExpenseC.status !== 'cancelada' || checkOrderC.status !== 'devolvida' || checkTxsC.length !== 2 || Math.abs(Number(finalTx.balance) - initialBalance) > 0.01) {
      throw new Error('Falha na validação do Passo C (Devolução Total)');
    }

    console.log('\n=== TODOS OS TESTES DE DEVOLUÇÃO PASSARAM COM SUCESSO! ===');

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
    
    if (vendor) {
      try {
        await prisma.vendor.delete({ where: { id: vendor.id } });
        console.log('- Fornecedor removido');
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

testReturnPurchaseFlow();
