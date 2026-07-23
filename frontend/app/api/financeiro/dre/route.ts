import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
  if (!validateToken(request)) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Definir período padrão: mês atual (com transição inteligente nos primeiros 10 dias)
    let start: Date, end: Date;
    const now = new Date();

    if (startDate && endDate) {
      const [sYear, sMonth, sDay] = startDate.split('-').map(Number);
      const [eYear, eMonth, eDay] = endDate.split('-').map(Number);
      start = new Date(sYear, sMonth - 1, sDay, 0, 0, 0, 0);
      end = new Date(eYear, eMonth - 1, eDay, 23, 59, 59, 999);
    } else {
      start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      if (now.getDate() <= 10) {
        start = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0);
      }
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    }

    // 1. Buscar todas as fontes de receitas (Payment, AccountReceivable, Invoice)
    const [allPayments, allReceivables, allInvoices] = await Promise.all([
      prisma.payment.findMany({
        where: { status: 'confirmado' },
        select: {
          id: true,
          amount: true,
          invoiceId: true,
          quotationId: true,
          description: true,
          paidAt: true,
          confirmedAt: true,
          createdAt: true,
        },
      }),
      prisma.accountReceivable.findMany({
        where: {
          status: { in: ['baixado', 'parcial'] },
          paidAmount: { gt: 0 },
        },
        select: {
          id: true,
          title: true,
          description: true,
          paidAmount: true,
          totalAmount: true,
          paidDate: true,
          invoiceId: true,
          updatedAt: true,
          createdAt: true,
        },
      }),
      prisma.invoice.findMany({
        where: { status: { in: ['emitida', 'paga'] } },
        select: {
          id: true,
          invoiceNumber: true,
          totalAmount: true,
          taxAmount: true,
          discountAmount: true,
          status: true,
          issueDate: true,
          updatedAt: true,
        },
      }),
    ]);

    // Filtrar e desduplicar receitas no período selecionado
    const revenueItems: Array<{
      id: string;
      date: Date;
      description: string;
      amount: number;
      invoiceId?: string | null;
    }> = [];

    const recordedInvoiceIds = new Set<string>();

    for (const p of allPayments) {
      const pDate = p.paidAt || p.confirmedAt || p.createdAt;
      if (pDate >= start && pDate <= end) {
        revenueItems.push({
          id: p.id,
          date: pDate,
          description: p.description || 'Recebimento de Pagamento',
          amount: Number(p.amount),
          invoiceId: p.invoiceId,
        });
        if (p.invoiceId) recordedInvoiceIds.add(p.invoiceId);
      }
    }

    for (const r of allReceivables) {
      const rDate = r.paidDate || r.updatedAt || r.createdAt;
      if (rDate >= start && rDate <= end) {
        if (r.invoiceId && recordedInvoiceIds.has(r.invoiceId)) {
          continue;
        }
        revenueItems.push({
          id: r.id,
          date: rDate,
          description: r.title || r.description || 'Recebimento de Conta a Receber',
          amount: Number(r.paidAmount || r.totalAmount),
          invoiceId: r.invoiceId,
        });
        if (r.invoiceId) recordedInvoiceIds.add(r.invoiceId);
      }
    }

    for (const inv of allInvoices) {
      if (inv.status === 'paga') {
        const invDate = inv.updatedAt || inv.issueDate;
        if (invDate >= start && invDate <= end) {
          if (!recordedInvoiceIds.has(inv.id)) {
            revenueItems.push({
              id: inv.id,
              date: invDate,
              description: `Fatura #${inv.invoiceNumber} Paga`,
              amount: Number(inv.totalAmount),
              invoiceId: inv.id,
            });
            recordedInvoiceIds.add(inv.id);
          }
        }
      }
    }

    // 2. Buscar despesas do período (Expense e AccountPayable)
    const [allExpenses, allPayables] = await Promise.all([
      prisma.expense.findMany({
        where: { status: { not: 'cancelada' } },
        select: {
          id: true,
          amount: true,
          category: true,
          costCenter: true,
          description: true,
          expenseDate: true,
          createdAt: true,
        },
      }),
      prisma.accountPayable.findMany({
        where: {
          status: { in: ['pago', 'parcial'] },
          paidAmount: { gt: 0 },
        },
        select: {
          id: true,
          title: true,
          description: true,
          paidAmount: true,
          totalAmount: true,
          paidDate: true,
          expenseId: true,
          chartOfAccount: { select: { type: true, name: true } },
          updatedAt: true,
          createdAt: true,
        },
      }),
    ]);

    // Desduplicação inteligente de despesas:
    // Se a mesma Ordem de Compra ou transação existir como AccountPayable (categoria DESPESA) e como Expense (ex: MATERIAL),
    // mantemos APENAS uma entrada categorizada como "DESPESA".
    type ExpenseItem = {
      id: string;
      date: Date;
      description: string;
      amount: number;
      category: string;
      costCenter?: string | null;
    };

    const expenseMap = new Map<string, ExpenseItem>();

    const getExpenseKey = (desc: string, amount: number) => {
      const ocMatch = desc.match(/OC-\d{4}-\d+/i);
      if (ocMatch) return ocMatch[0].toUpperCase();
      return `${desc.toLowerCase().trim()}_${amount.toFixed(2)}`;
    };

    // Prioridade 1: Contas a pagar registradas (com categoria DESPESA)
    for (const p of allPayables) {
      const pDate = p.paidDate || p.updatedAt || p.createdAt;
      if (pDate >= start && pDate <= end) {
        const desc = p.title || p.description || 'Conta a Pagar';
        const amt = Number(p.paidAmount || p.totalAmount);
        const key = getExpenseKey(desc, amt);

        expenseMap.set(key, {
          id: p.id,
          date: pDate,
          description: desc,
          amount: amt,
          category: 'DESPESA',
          costCenter: null,
        });
      }
    }

    // Prioridade 2: Despesas da tabela Expense (adiciona apenas se a OC/transação já não estiver presente)
    for (const e of allExpenses) {
      const eDate = e.expenseDate || e.createdAt;
      if (eDate >= start && eDate <= end) {
        const desc = e.description || 'Despesa';
        const amt = Number(e.amount);
        const key = getExpenseKey(desc, amt);

        if (!expenseMap.has(key)) {
          expenseMap.set(key, {
            id: e.id,
            date: eDate,
            description: desc,
            amount: amt,
            category: 'DESPESA',
            costCenter: e.costCenter,
          });
        }
      }
    }

    const expenseItems = Array.from(expenseMap.values());

    // Calcular totais da DRE
    const receitaBruta = revenueItems.reduce((sum, item) => sum + item.amount, 0);

    const impostosSobreReceita = allInvoices
      .filter(i => {
        const d = i.issueDate || i.updatedAt;
        return d >= start && d <= end;
      })
      .reduce((sum, i) => sum + Number(i.taxAmount || 0), 0);

    const descontos = allInvoices
      .filter(i => {
        const d = i.issueDate || i.updatedAt;
        return d >= start && d <= end;
      })
      .reduce((sum, i) => sum + Number(i.discountAmount || 0), 0);

    const receitaLiquida = receitaBruta - impostosSobreReceita - descontos;

    const custosProdutosServicos = expenseItems
      .filter(e => ['MATERIAL', 'SERVICO', 'TRANSPORTE', 'PECA', 'MAO_DE_OBRA'].includes(e.category))
      .reduce((sum, e) => sum + e.amount, 0);

    const lucroBruto = receitaLiquida - custosProdutosServicos;

    const despesasOperacionais = expenseItems
      .filter(e => ['ALUGUEL', 'UTILIDADES', 'FERRAMENTAS', 'MARKETING', 'RH', 'OUTROS', 'OUTROS_CUSTOS', 'DESPESA'].includes(e.category))
      .reduce((sum, e) => sum + e.amount, 0);

    const resultadoOperacional = lucroBruto - despesasOperacionais;

    const totalDespesasFinanceiras = expenseItems
      .filter(e => ['JUROS', 'TARIFAS', 'FINANCEIRO'].includes(e.category))
      .reduce((sum, e) => sum + e.amount, 0);

    const resultadoFinanceiro = resultadoOperacional - totalDespesasFinanceiras;

    const impostos = expenseItems
      .filter(e => ['IMPOSTOS_TAXAS', 'IMPOSTOS', 'TAXAS'].includes(e.category) || e.costCenter === 'IMPOSTOS')
      .reduce((sum, e) => sum + e.amount, 0);

    const lucroLiquido = resultadoFinanceiro - impostos;

    // Comparar com período anterior
    const previousStart = new Date(start);
    previousStart.setMonth(previousStart.getMonth() - 1);
    const previousEnd = new Date(start);
    previousEnd.setDate(previousEnd.getDate() - 1);

    const previousInvoices = await prisma.invoice.findMany({
      where: {
        issueDate: { gte: previousStart, lte: previousEnd },
        status: { in: ['emitida', 'paga'] },
      },
      select: { totalAmount: true },
    });

    const previousRevenue = previousInvoices.reduce((sum, i) => sum + Number(i.totalAmount), 0);
    const revenueGrowth = previousRevenue > 0 ? ((receitaBruta - previousRevenue) / previousRevenue) * 100 : 0;

    // Unificar transações
    const transactions = [
      ...revenueItems.map(item => ({
        id: item.id,
        date: item.date.toISOString(),
        description: item.description,
        amount: item.amount,
        type: 'revenue' as const,
        category: 'RECEITA',
      })),
      ...expenseItems.map(item => ({
        id: item.id,
        date: item.date.toISOString(),
        description: item.description,
        amount: -item.amount,
        type: 'expense' as const,
        category: 'DESPESA',
      })),
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return NextResponse.json({
      period: { start: start.toISOString(), end: end.toISOString() },
      dre: {
        receitaBruta,
        impostosSobreReceita,
        descontos,
        receitaLiquida,
        custosProdutosServicos,
        lucroBruto,
        despesasOperacionais,
        resultadoOperacional,
        despesasFinanceiras: totalDespesasFinanceiras,
        resultadoFinanceiro,
        impostos,
        lucroLiquido,
      },
      margins: {
        gross: receitaLiquida > 0 ? (lucroBruto / receitaLiquida) * 100 : 0,
        operational: receitaLiquida > 0 ? (resultadoOperacional / receitaLiquida) * 100 : 0,
        net: receitaLiquida > 0 ? (lucroLiquido / receitaLiquida) * 100 : 0,
      },
      comparison: {
        previousRevenue,
        currentRevenue: receitaBruta,
        growth: revenueGrowth,
      },
      expensesByCategory: expenseItems.reduce((acc, e) => {
        acc[e.category] = (acc[e.category] || 0) + e.amount;
        return acc;
      }, {} as Record<string, number>),
      transactions,
    });
  } catch (error) {
    console.error('Erro ao buscar DRE:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
