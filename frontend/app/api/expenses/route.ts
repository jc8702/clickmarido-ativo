import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import * as jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
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

// GET /api/expenses - Listar despesas
export async function GET(request: NextRequest) {
  try {
    if (!validateToken(request)) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status') || '';
    const category = searchParams.get('category') || '';
    const costCenter = searchParams.get('costCenter') || '';
    const serviceOrderId = searchParams.get('serviceOrderId') || '';
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status) where.status = status;
    if (category) where.category = category;
    if (costCenter) where.costCenter = costCenter;
    if (serviceOrderId) where.serviceOrderId = serviceOrderId;

    const [expenses, total] = await Promise.all([
      prisma.expense.findMany({
        where,
        include: {
          vendor: { select: { id: true, name: true } },
        },
        skip,
        take: limit,
        orderBy: { expenseDate: 'desc' },
      }),
      prisma.expense.count({ where }),
    ]);

    return NextResponse.json({
      data: expenses,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('GET /api/expenses error:', error);
    return NextResponse.json({ error: 'Erro ao listar despesas' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

// POST /api/expenses - Criar despesa
export async function POST(request: NextRequest) {
  try {
    if (!validateToken(request)) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const body = await request.json();
    const {
      category,
      costCenter,
      description,
      amount,
      vendorId,
      vendorName,
      expenseDate,
      dueDate,
      documentType,
      documentNumber,
      serviceOrderId,
      notes,
    } = body;

    if (!category || !description || amount === undefined) {
      return NextResponse.json(
        { error: 'Campos obrigatórios: category, description, amount' },
        { status: 400 }
      );
    }

    const expense = await prisma.expense.create({
      data: {
        category,
        costCenter: costCenter || 'OUTROS',
        description,
        amount: Number(amount),
        vendorId: vendorId || null,
        vendorName: vendorName || '',
        expenseDate: expenseDate ? new Date(expenseDate) : new Date(),
        dueDate: dueDate ? new Date(dueDate) : null,
        documentType: documentType || null,
        documentNumber: documentNumber || null,
        serviceOrderId: serviceOrderId || null,
        notes: notes || '',
        status: 'pendente',
      },
      include: {
        vendor: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(expense, { status: 201 });
  } catch (error: any) {
    console.error('POST /api/expenses error:', error);
    return NextResponse.json({ error: 'Erro ao criar despesa' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
