import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateToken } from '@/lib/auth';
import { logFinancialTransaction } from '@/lib/finance-sync';

export async function GET(request: NextRequest): Promise<Response> {
  try {
    if (!validateToken(request)) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status') || '';
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status) where.status = status;

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        include: {
          customer: true,
          quotation: {
            include: { serviceOrder: true },
          },
          invoice: true,
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.payment.count({ where }),
    ]);

    return NextResponse.json({
      data: payments,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });

  } catch (error) {
    console.error('GET /api/payments error:', error);
    return NextResponse.json({ error: 'Erro ao listar pagamentos' }, { status: 500 });
  }
}

export async function POST(request: NextRequest): Promise<Response> {
  try {
    if (!validateToken(request)) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const body = await request.json();
    const { quotationId, customerId, amount, method, description, status } = body;

    if (!customerId || amount === undefined) {
      return NextResponse.json({ error: 'Campos obrigatórios faltando' }, { status: 400 });
    }

    const numericAmount = Number(amount);
    if (isNaN(numericAmount) || numericAmount <= 0 || !isFinite(numericAmount)) {
      return NextResponse.json({ error: 'Valor do pagamento deve ser um número positivo válido' }, { status: 400 });
    }

    // Validar existência do customer
    const customerExists = await prisma.customer.findUnique({ where: { id: customerId } });
    if (!customerExists) {
      return NextResponse.json({ error: 'Cliente não encontrado' }, { status: 404 });
    }

    // P2: Bloqueio contra múltiplos recebimentos que excedam o valor total
    if (quotationId) {
      const quotation = await prisma.quotation.findUnique({
        where: { id: quotationId },
        include: { payments: true }
      });
      if (!quotation) {
        return NextResponse.json({ error: 'Orçamento não encontrado' }, { status: 404 });
      }
      
      const paidSoFar = quotation.payments
        .filter(p => p.status === 'confirmado')
        .reduce((sum, p) => sum + Number(p.amount), 0);
        
      const balanceDue = Number(quotation.total) - paidSoFar;
      if (numericAmount > balanceDue && balanceDue >= 0) {
        return NextResponse.json(
          { error: `Valor excede o saldo devedor. Saldo atual: R$ ${balanceDue.toFixed(2)}` },
          { status: 400 }
        );
      }
    }

    // Normalizar status: 'aprovado' do front vira 'confirmado' no banco
    const normalizedStatus = status === 'aprovado' ? 'confirmado' : (status || 'pendente');

    const payment = await prisma.payment.create({
      data: {
        quotationId: quotationId || null,
        customerId,
        amount: numericAmount,
        method: method || 'pix',
        status: normalizedStatus,
        description: description || '',
      },
      include: { customer: true },
    });

    // Registrar log de auditoria
    const { logAudit } = await import('@/lib/audit');
    await logAudit({
      request,
      entity: 'payment',
      entityId: payment.id,
      action: 'created',
      newValue: {
        id: payment.id,
        customerId: payment.customerId,
        quotationId: payment.quotationId,
        amount: payment.amount,
        status: payment.status,
        method: payment.method,
      },
    });

    if (normalizedStatus === 'confirmado') {
      await logFinancialTransaction({
        type: 'PAYMENT_RECEIVED',
        paymentId: payment.id,
        credit: Number(payment.amount),
        description: `Pagamento recebido via ${payment.method}`,
        userId: '',
      });
    }

    return NextResponse.json(payment, { status: 201 });

  } catch (error: any) {
    console.error('POST /api/payments error:', error);
    return NextResponse.json({ error: 'Erro ao criar pagamento' }, { status: 500 });
}
}