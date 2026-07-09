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
    const period = searchParams.get('period') || 'monthly'; // monthly, quarterly, yearly

    // Definir período padrão: mês atual
    let start: Date, end: Date;
    const now = new Date();

    if (startDate && endDate) {
      start = new Date(startDate);
      end = new Date(endDate);
    } else {
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    }

    // Buscar faturamento do período
    const invoices = await prisma.invoice.findMany({
      where: {
        issueDate: { gte: start, lte: end },
        status: { in: ['emitida', 'paga'] },
      },
      select: {
        totalAmount: true,
        taxAmount: true,
        discountAmount: true,
      },
    });

    // Buscar despesas do período
    const expenses = await prisma.expense.findMany({
      where: {
        expenseDate: { gte: start, lte: end },
        status: { not: 'cancelada' },
      },
      select: {
        amount: true,
        category: true,
        costCenter: true,
      },
    });

    // Buscar contas a pagar pagas no período
    const paidPayables = await prisma.accountPayable.findMany({
      where: {
        paidDate: { gte: start, lte: end },
        status: { in: ['pago', 'parcial'] },
      },
      select: {
        paidAmount: true,
        totalAmount: true,
        chartOfAccount: { select: { type: true } },
      },
    });

    // Calcular DRE
    const receitaBruta = invoices.reduce((sum, i) => sum + Number(i.totalAmount), 0);
    const impostosSobreReceita = invoices.reduce((sum, i) => sum + Number(i.taxAmount || 0), 0);
    const descontos = invoices.reduce((sum, i) => sum + Number(i.discountAmount || 0), 0);
    const receitaLiquida = receitaBruta - impostosSobreReceita - descontos;

    // Custos dos produtos/serviços vendidos (CPV) - materiais e serviços diretos
    const custosProdutosServicos = expenses
      .filter(e => ['MATERIAL', 'SERVICO', 'TRANSPORTE', 'PECA', 'MAO_DE_OBRA'].includes(e.category))
      .reduce((sum, e) => sum + Number(e.amount), 0);

    const lucroBruto = receitaLiquida - custosProdutosServicos;

    // Despesas operacionais (fixas e administrativas)
    const despesasOperacionais = expenses
      .filter(e => ['ALUGUEL', 'UTILIDADES', 'FERRAMENTAS', 'MARKETING', 'RH', 'OUTROS', 'OUTROS_CUSTOS'].includes(e.category))
      .reduce((sum, e) => sum + Number(e.amount), 0);

    const resultadoOperacional = lucroBruto - despesasOperacionais;

    // Despesas financeiras (juros, tarifas bancárias, etc)
    const despesasFinanceiras = expenses
      .filter(e => ['JUROS', 'TARIFAS', 'FINANCEIRO'].includes(e.category))
      .reduce((sum, e) => sum + Number(e.amount), 0);

    // Somar contas a pagar pagas que são despesas financeiras
    const paidPayableFinancial = paidPayables
      .filter(p => p.chartOfAccount?.type === 'FINANCEIRO')
      .reduce((sum, p) => sum + Number(p.paidAmount || p.totalAmount), 0);

    const totalDespesasFinanceiras = despesasFinanceiras + paidPayableFinancial;

    const resultadoFinanceiro = resultadoOperacional - totalDespesasFinanceiras;

    // Impostos
    const impostos = expenses
      .filter(e => ['IMPOSTOS_TAXAS', 'IMPOSTOS', 'TAXAS'].includes(e.category) || e.costCenter === 'IMPOSTOS')
      .reduce((sum, e) => sum + Number(e.amount), 0);

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

    return NextResponse.json({
      period: { start, end },
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
      expensesByCategory: expenses.reduce((acc, e) => {
        acc[e.category] = (acc[e.category] || 0) + Number(e.amount);
        return acc;
      }, {} as Record<string, number>),
    });
  } catch (error) {
    console.error('Erro ao buscar DRE:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
