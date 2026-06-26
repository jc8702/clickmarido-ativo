import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import * as jwt from 'jsonwebtoken';
const JWT_SECRET = process.env.JWT_SECRET;

function validateToken(request: NextRequest) {
  if (!JWT_SECRET) return null;
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  try {
    const token = authHeader.substring(7);
    jwt.verify(token, JWT_SECRET);
    return true;
  } catch {
    return null;
  }
}

// GET /api/invoices - Listar invoices
export async function GET(request: NextRequest) {
  try {
    if (!validateToken(request)) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status') || '';
    const customerId = searchParams.get('customerId') || '';
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status) where.status = status;
    if (customerId) where.customerId = customerId;

    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        include: {
          customer: { select: { id: true, name: true, email: true } },
          quotation: { select: { id: true, total: true } },
          payments: { select: { id: true, amount: true, status: true } },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.invoice.count({ where }),
    ]);

    return NextResponse.json({
      data: invoices,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('GET /api/invoices error:', error);
    return NextResponse.json({ error: 'Erro ao listar invoices' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

// POST /api/invoices - Criar invoice a partir de quotation
export async function POST(request: NextRequest) {
  try {
    if (!validateToken(request)) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const body = await request.json();
    const { quotationId, dueDate, taxRegime = 'SIMPLES', issRate = 5.0, description, notes } = body;

    if (!quotationId) {
      return NextResponse.json({ error: 'quotationId é obrigatório' }, { status: 400 });
    }

    // Buscar quotation
    const quotation = await prisma.quotation.findUnique({
      where: { id: quotationId },
      include: { customer: true, items: true },
    });

    if (!quotation) {
      return NextResponse.json({ error: 'Quotation não encontrada' }, { status: 404 });
    }

    // Verificar se já existe invoice para esta quotation
    const existingInvoice = await prisma.invoice.findFirst({
      where: { quotationId },
    });

    if (existingInvoice) {
      return NextResponse.json({ error: 'Já existe invoice para esta quotation' }, { status: 400 });
    }

    // Calcular impostos
    const subtotal = Number(quotation.total);
    const taxAmount = subtotal * (issRate / 100);
    const totalAmount = subtotal + taxAmount;

    // Gerar número da invoice sequencial
    const lastInvoice = await prisma.invoice.findFirst({
      orderBy: { invoiceNumber: 'desc' },
    });
    const invoiceNumber = lastInvoice
      ? (parseInt(lastInvoice.invoiceNumber) + 1).toString().padStart(3, '0')
      : '001';

    // Criar invoice
    const invoice = await prisma.invoice.create({
      data: {
        quotationId,
        customerId: quotation.customerId,
        invoiceNumber,
        seriesNumber: '1',
        dueDate: dueDate ? new Date(dueDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        subtotal,
        taxAmount,
        totalAmount,
        taxRegime,
        issRate,
        description: description || `Invoice #${invoiceNumber}`,
        notes: notes || '',
        status: 'rascunho',
      },
      include: {
        customer: { select: { id: true, name: true, email: true } },
        quotation: { select: { id: true, total: true } },
      },
    });

    return NextResponse.json(invoice, { status: 201 });
  } catch (error: any) {
    console.error('POST /api/invoices error:', error);
    return NextResponse.json({ error: 'Erro ao criar invoice' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
