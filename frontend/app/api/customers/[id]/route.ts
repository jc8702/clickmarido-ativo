import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { customerSchema } from '@/lib/validations/customer.schema';
import { validateToken } from '@/lib/auth';

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  const { id } = await params;
  try {
    if (!validateToken(request)) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        quotations: true,
        serviceOrders: { orderBy: { createdAt: 'desc' } },
        payments: { orderBy: { createdAt: 'desc' } },
      },
    });

    if (!customer) {
      return NextResponse.json({ error: 'Cliente não encontrado' }, { status: 404 });
    }

    return NextResponse.json(customer);

  } catch (error) {
    console.error('GET /api/customers/[id] error:', error);
    return NextResponse.json({ error: 'Erro ao carregar cliente' }, { status: 500 });
  } finally {
  }
}

export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  const { id } = await params;
  try {
    if (!validateToken(request)) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = customerSchema.partial().parse(body);

    const customer = await prisma.customer.update({
      where: { id },
      data: {
        ...parsed,
        addresses: parsed.addresses || undefined,
      },
    });

    return NextResponse.json(customer);

  } catch (error: any) {
    console.error('PUT /api/customers/[id] error:', error);

    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Cliente não encontrado' }, { status: 404 });
    }

    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: 'Erro ao atualizar cliente' }, { status: 500 });
  } finally {
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  const { id } = await params;
  try {
    if (!validateToken(request)) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    await prisma.customer.delete({ where: { id } });

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('DELETE /api/customers/[id] error:', error);

    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Cliente não encontrado' }, { status: 404 });
    }

    return NextResponse.json({ error: 'Erro ao deletar cliente' }, { status: 500 });
  } finally {
  }
}
