const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando correção de Pagamentos sem Contas a Receber...');

  // 1. Procurar por Ordens de Serviço concluídas que possuem pagamentos associados à cotação, 
  // mas que não possuem Fatura (Invoice) ou Contas a Receber associada.
  const serviceOrders = await prisma.serviceOrder.findMany({
    where: {
      status: 'concluida'
    },
    include: {
      quotation: {
        include: {
          payments: true
        }
      }
    }
  });

  let fixed = 0;

  for (const os of serviceOrders) {
    if (!os.quotation || !os.quotation.payments || os.quotation.payments.length === 0) continue;

    for (const payment of os.quotation.payments) {
      if (payment.status !== 'confirmado') continue;

      // Verificar se existe Invoice para este payment
      if (!payment.invoiceId) {
        console.log(`\nOS ${os.number} (Pagamento ${payment.id}) não tem Invoice vinculada.`);
        
        // Criar Invoice
        const invoiceCount = await prisma.invoice.count();
        const now = new Date();
        const invoiceNumber = `INV-${now.getFullYear()}-${String(invoiceCount + 1).padStart(4, '0')}-${Math.floor(Math.random() * 1000)}`;

        const invoice = await prisma.invoice.create({
          data: {
            customerId: payment.customerId,
            invoiceNumber,
            issueDate: payment.createdAt || now,
            dueDate: payment.createdAt || now,
            subtotal: payment.amount,
            totalAmount: payment.amount,
            status: 'paga',
            description: `Fatura gerada automaticamente ao concluir OS (Correção Retroativa)`,
          },
        });

        await prisma.payment.update({
          where: { id: payment.id },
          data: { invoiceId: invoice.id }
        });

        console.log(`-> Fatura criada: ${invoice.id}`);
        payment.invoiceId = invoice.id;
      }

      // Verificar se existe AccountReceivable para esta Invoice ou Pagamento
      const existingReceivable = await prisma.accountReceivable.findFirst({
        where: { invoiceId: payment.invoiceId }
      });

      if (!existingReceivable) {
        console.log(`OS ${os.number} não tem Contas a Receber vinculada. Criando...`);
        
        // Buscar conta bancária padrão
        const bankAccount = await prisma.bankAccount.findFirst({
          where: { isDefault: true }
        }) || await prisma.bankAccount.findFirst();

        if (bankAccount) {
          await prisma.accountReceivable.create({
            data: {
              title: payment.description || `Recebimento OS ${os.number}`,
              description: `Correção retroativa. Pagamento ID: ${payment.id}`,
              totalAmount: payment.amount,
              paidAmount: payment.amount,
              status: 'baixado',
              dueDate: payment.createdAt || new Date(),
              paidDate: payment.paidAt || new Date(),
              origin: 'FATURAMENTO',
              paymentMethod: payment.method.toUpperCase(),
              bankAccountId: bankAccount.id,
              customerId: payment.customerId,
              invoiceId: payment.invoiceId,
              notes: `Gerado automaticamente via script de correção para OS-0004 e afins.`
            }
          });
          console.log(`-> Conta a Receber criada para OS ${os.number}!`);
          fixed++;
        } else {
          console.log(`-> AVISO: Nenhuma conta bancária encontrada para criar Contas a Receber.`);
        }
      }
    }
  }

  console.log(`\nCorreção concluída. ${fixed} Contas a Receber criadas.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
