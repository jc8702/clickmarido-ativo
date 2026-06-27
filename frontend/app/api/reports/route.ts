import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import * as jwt from 'jsonwebtoken';
const JWT_SECRET = process.env.JWT_SECRET;

function validateToken(request: NextRequest) {
  if (!JWT_SECRET) {
    return false;
  }
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) return false;

  try {
    const token = authHeader.substring(7);
    jwt.verify(token, JWT_SECRET);
    return true;
  } catch {
    return false;
  }
}

export async function GET(request: NextRequest) {
  try {
    if (!validateToken(request)) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');
    const exportParam = searchParams.get('export');

    const now = new Date();
    const startDate = startDateParam ? new Date(startDateParam) : new Date(now.getFullYear(), now.getMonth(), 1);
    const endDate = endDateParam ? new Date(endDateParam) : new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    // Ajustar fim do dia para incluir tudo
    if (endDateParam && !endDateParam.includes('T')) {
      endDate.setHours(23, 59, 59, 999);
    }

    // 1. Configurações não são mais necessárias para cálculo de comissão obrigatória

    // 2. Buscar transações financeiras no período (O Livro Caixa é a fonte da verdade)
    const transactions = await prisma.financialTransaction.findMany({
      where: {
        transactionDate: { gte: startDate, lte: endDate }
      },
      orderBy: { transactionDate: 'asc' }
    });

    const expenseIds = transactions.map(t => t.expenseId).filter(Boolean) as string[];
    const expensesDb = await prisma.expense.findMany({
      where: { id: { in: expenseIds } },
      select: { id: true, category: true }
    });
    const expenseCategoryMap = new Map(expensesDb.map(e => [e.id, e.category]));

    // Se o pedido for de exportar em CSV
    if (exportParam === 'csv') {
      const csvRows = [];
      csvRows.push('Data,Tipo,Categoria,Descricao,Valor,Status');

      transactions.forEach(t => {
        const dateStr = t.transactionDate.toISOString().slice(0, 10);
        const desc = t.description.replace(/,/g, ' ');
        
        if (Number(t.credit) > 0) {
          csvRows.push(`${dateStr},Entrada,Servico,${desc},${t.credit},Confirmado`);
        }
        if (Number(t.debit) > 0) {
          const category = t.expenseId ? (expenseCategoryMap.get(t.expenseId) || 'Outros') : 'Ajuste';
          csvRows.push(`${dateStr},Saida,${category},${desc},${t.debit},Pago`);
        }
      });

      // Não precisamos ordenar novamente pois já buscamos com orderBy 'asc' no banco
      const csvContent = csvRows.join('\n');

      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': 'attachment; filename="relatorio-financeiro.csv"'
        }
      });
    }

    // 4. Calcular consolidados baseados no Livro Caixa
    const totalInflow = transactions.reduce((acc, curr) => acc + Number(curr.credit || 0), 0);
    const totalOutflow = transactions.reduce((acc, curr) => acc + Number(curr.debit || 0), 0);

    // 5. Custos de Materiais (Consumo de peças nas OS fechadas no período)
    const productUsages = await prisma.productUsage.findMany({
      where: {
        createdAt: { gte: startDate, lte: endDate }
      },
      include: { product: true }
    });
    const materialsCost = productUsages.reduce((acc, curr) => acc + (Number(curr.quantityUsed) * Number(curr.product?.price || 0)), 0);

    // 6. Buscando OS concluídas para análise de margem
    const completedOrders = await prisma.serviceOrder.findMany({
      where: {
        status: 'concluida',
        completedAt: { gte: startDate, lte: endDate }
      },
      include: { customer: true, productUsages: { include: { product: true } } }
    });

    // 7. Margens e Lucro Operacional Detalhado por OS
    const osMargins = completedOrders.map(so => {
      const osMaterialsCost = so.productUsages.reduce((acc, curr) => acc + (Number(curr.quantityUsed) * Number(curr.product?.price || 0)), 0);
      const osFinalTotal = Number(so.finalTotal);
      const netProfit = osFinalTotal - osMaterialsCost;
      const profitMarginPercent = osFinalTotal > 0 ? Math.round((netProfit / osFinalTotal) * 100) : 0;

      return {
        id: so.id,
        number: so.number,
        client: so.customer?.name || so.customerId,
        total: so.finalTotal,
        materialsCost: osMaterialsCost,
        netProfit,
        profitMarginPercent
      };
    });

    const netProfitGeneral = totalInflow - totalOutflow;
    const profitMarginGeneral = totalInflow > 0 ? Math.round((netProfitGeneral / totalInflow) * 100) : 0;

    return NextResponse.json({
      success: true,
      data: {
        period: { startDate, endDate },
        totals: {
          inflow: totalInflow,
          outflow: totalOutflow,
          netProfit: netProfitGeneral,
          profitMarginPercent: profitMarginGeneral,
          materialsCost
        },
        osMargins,
        transactions: {
          inflows: transactions.filter(t => Number(t.credit) > 0).map(t => ({
            id: t.id,
            date: t.transactionDate,
            description: t.description,
            amount: Number(t.credit)
          })),
          outflows: transactions.filter(t => Number(t.debit) > 0).map(t => ({
            id: t.id,
            date: t.transactionDate,
            description: t.description,
            category: t.expenseId ? (expenseCategoryMap.get(t.expenseId) || 'Outros') : 'Ajuste',
            amount: Number(t.debit)
          }))
        }
      }
    });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
}
}