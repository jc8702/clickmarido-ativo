import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateToken } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!validateToken(request)) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const account = await prisma.bankAccount.findUnique({
      where: { id },
    });

    if (!account) {
      return NextResponse.json({ error: 'Conta não encontrada' }, { status: 404 });
    }

    // 1. Buscar Contas a Pagar (Débitos)
    const payables = await prisma.accountPayable.findMany({
      where: {
        bankAccountId: id,
        status: { in: ['pago', 'parcial'] },
        paidAmount: { gt: 0 },
      },
      include: {
        expense: {
          include: {
            purchaseOrders: {
              select: { number: true }
            },
            serviceOrder: {
              select: { number: true }
            }
          }
        }
      },
      orderBy: { paidDate: 'desc' },
      take: 50,
    });

    // 2. Buscar Contas a Receber (Créditos)
    const receivables = await prisma.accountReceivable.findMany({
      where: {
        bankAccountId: id,
        status: { in: ['baixado', 'parcial'] },
        paidAmount: { gt: 0 },
      },
      include: {
        invoice: {
          include: {
            quotation: {
              include: {
                serviceOrder: {
                  select: { number: true }
                }
              }
            }
          }
        }
      },
      orderBy: { paidDate: 'desc' },
      take: 50,
    });

    // 3. Buscar Transferências
    const transfers = await prisma.bankTransfer.findMany({
      where: {
        OR: [
          { fromAccountId: id },
          { toAccountId: id }
        ],
        status: 'concluida'
      },
      include: {
        fromAccount: { select: { nickname: true, bankName: true } },
        toAccount: { select: { nickname: true, bankName: true } }
      },
      orderBy: { transferDate: 'desc' },
      take: 50,
    });

    // 4. Buscar Ajustes manuais de saldo
    const adjustmentWhere: any = {
      type: 'ADJUSTMENT',
      description: {
        contains: `Ajuste de saldo - ${account.bankName}`
      }
    };
    
    if (account.accountNumber) {
      adjustmentWhere.description = {
        contains: `(${account.accountNumber})`
      };
    }

    const adjustments = await prisma.financialTransaction.findMany({
      where: adjustmentWhere,
      orderBy: { transactionDate: 'desc' },
      take: 50,
    });

    const transactions: any[] = [];

    // Mapear Payables
    payables.forEach(p => {
      let identifier = 'Despesa';
      const titleLower = p.title.toLowerCase();
      const descLower = (p.description || '').toLowerCase();
      const combinedText = `${titleLower} ${descLower}`;

      const ocMatch = combinedText.match(/(oc-\d{4}-\d+|oc-\d+)/i);
      const osMatch = combinedText.match(/(os-\d+)/i);

      if (ocMatch) {
        identifier = ocMatch[1].toUpperCase();
      } else if (osMatch) {
        identifier = osMatch[1].toUpperCase();
      } else if (p.expense?.purchaseOrders?.[0]?.number) {
        identifier = p.expense.purchaseOrders[0].number;
      } else if (p.expense?.serviceOrder?.number) {
        identifier = p.expense.serviceOrder.number;
      }

      transactions.push({
        id: p.id,
        date: p.paidDate || p.updatedAt,
        type: 'DEBIT',
        amount: Number(p.paidAmount),
        description: p.title,
        identifier
      });
    });

    // Mapear Receivables
    receivables.forEach(r => {
      let identifier = 'Recebimento';
      const titleLower = r.title.toLowerCase();
      const descLower = (r.description || '').toLowerCase();
      const combinedText = `${titleLower} ${descLower}`;

      const osMatch = combinedText.match(/(os-\d+)/i);
      const invMatch = combinedText.match(/(inv-\d{4}-\d+-\d+|inv-\d{4}-\d+)/i);

      if (osMatch) {
        identifier = osMatch[1].toUpperCase();
      } else if (invMatch) {
        identifier = invMatch[1].toUpperCase();
      } else if (r.invoice?.quotation?.serviceOrder?.number) {
        identifier = r.invoice.quotation.serviceOrder.number;
      } else if (r.invoice?.invoiceNumber) {
        identifier = r.invoice.invoiceNumber;
      } else if (r.invoice?.quotation?.number) {
        identifier = r.invoice.quotation.number;
      }

      transactions.push({
        id: r.id,
        date: r.paidDate || r.updatedAt,
        type: 'CREDIT',
        amount: Number(r.paidAmount),
        description: r.title,
        identifier
      });
    });

    // Mapear Transfers
    transfers.forEach(t => {
      const isOut = t.fromAccountId === id;
      const type = isOut ? 'DEBIT' : 'CREDIT';
      const nickname = isOut 
        ? (t.toAccount.nickname || t.toAccount.bankName) 
        : (t.fromAccount.nickname || t.fromAccount.bankName);
      
      transactions.push({
        id: t.id,
        date: t.transferDate,
        type,
        amount: Number(t.amount),
        description: t.description || (isOut ? `Transferência para ${nickname}` : `Transferência de ${nickname}`),
        identifier: isOut ? 'TF-ENV' : 'TF-REC'
      });
    });

    // Mapear Adjustments
    adjustments.forEach(a => {
      const amountCredit = Number(a.credit) || 0;
      const amountDebit = Number(a.debit) || 0;
      const type = amountCredit > amountDebit ? 'CREDIT' : 'DEBIT';
      const amount = amountCredit > amountDebit ? amountCredit : amountDebit;

      transactions.push({
        id: a.id,
        date: a.transactionDate,
        type,
        amount,
        description: a.notes || a.description,
        identifier: 'AJUSTE'
      });
    });

    // Ordenar por data decrescente e limitar a 50 transações mais recentes
    transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const result = transactions.slice(0, 50);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Erro ao buscar transações da conta bancária:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
