const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixOC003() {
  try {
    const ocNumber = 'OC-2026-000003';
    console.log(`Buscando ${ocNumber}...`);

    const oc = await prisma.purchaseOrder.findUnique({
      where: { number: ocNumber },
      include: {
        expense: true
      }
    });

    if (!oc) {
      console.log('OC não encontrada.');
      return;
    }

    console.log('Status atual da OC:', oc.status);
    console.log('Expense ID:', oc.expenseId);

    if (!oc.expenseId) {
      console.log('A OC não tem Expense vinculada. Nada a estornar (não houve pagamento integrado).');
      return;
    }

    const expense = oc.expense;
    console.log('Expense atual status:', expense.status);

    const accountPayables = await prisma.accountPayable.findMany({
      where: { expenseId: oc.expenseId }
    });

    console.log('Contas a Pagar vinculadas:', accountPayables.map(ap => ({ id: ap.id, status: ap.status, paidAmount: ap.paidAmount })));

    await prisma.$transaction(async (tx) => {
      // Cancela a Despesa
      if (expense.status !== 'cancelada') {
        await tx.expense.update({
          where: { id: expense.id },
          data: {
            status: 'cancelada',
            notes: (expense.notes || '') + '\n[CORREÇÃO MANUAL] Cancelada devido a devolução da OC-2026-000003.'
          }
        });
        console.log('Despesa cancelada.');
      }

      for (const ap of accountPayables) {
        if (ap.status !== 'cancelado') {
          await tx.accountPayable.update({
            where: { id: ap.id },
            data: {
              status: 'cancelado',
              notes: (ap.notes || '') + '\n[CORREÇÃO MANUAL] Cancelado devido a devolução da OC-2026-000003.'
            }
          });
          console.log(`AccountPayable ${ap.id} cancelado.`);
        }

        const paidAmount = Number(ap.paidAmount);
        if (paidAmount > 0) {
          // Precisamos estornar o valor pago.
          console.log(`Estornando R$ ${paidAmount} do AccountPayable ${ap.id}...`);

          let bankAccount = null;
          if (ap.bankAccountId) {
            bankAccount = await tx.bankAccount.findUnique({ where: { id: ap.bankAccountId }});
          }
          if (!bankAccount) {
            bankAccount = await tx.bankAccount.findFirst({ where: { isDefault: true, status: 'ativa' }}) ||
                          await tx.bankAccount.findFirst({ where: { status: 'ativa' }});
          }

          if (bankAccount) {
            await tx.bankAccount.update({
              where: { id: bankAccount.id },
              data: {
                currentBalance: { increment: paidAmount }
              }
            });
            console.log(`Saldo de ${bankAccount.nickname || bankAccount.bankName} incrementado em R$ ${paidAmount}.`);

            const lastTx = await tx.financialTransaction.findFirst({
              orderBy: { createdAt: 'desc' },
              select: { balance: true }
            });
            const prevBalance = lastTx?.balance ? Number(lastTx.balance) : 0;
            const newBalance = prevBalance + paidAmount;

            await tx.financialTransaction.create({
              data: {
                type: 'EXPENSE_REFUND',
                expenseId: expense.id,
                credit: paidAmount,
                debit: 0,
                balance: newBalance,
                description: `Estorno de Compra Devolvida (Correção OC-2026-000003)`,
                notes: `Retorno de R$ ${paidAmount} via Conta a Pagar ${ap.title}`,
                transactionDate: new Date(),
              }
            });
            console.log(`FinancialTransaction criada de estorno R$ ${paidAmount}.`);
          }
        }
      }
    });

    console.log('Correção concluída com sucesso!');
  } catch (error) {
    console.error('Erro ao corrigir:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixOC003();
