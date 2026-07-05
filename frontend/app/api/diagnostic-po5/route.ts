import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const number = 'OC-2026-000005';
    const po = await prisma.purchaseOrder.findFirst({
      where: { number },
      include: {
        expense: true,
        events: true,
      }
    });

    if (!po) {
      return NextResponse.json({ error: 'Ordem de compra não encontrada' }, { status: 404 });
    }

    return NextResponse.json({
      id: po.id,
      number: po.number,
      status: po.status,
      expenseId: po.expenseId,
      expenseExists: !!po.expense,
      expense: po.expense,
      events: po.events,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
