import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import * as jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET;

function validateToken(request: NextRequest) {
  if (!JWT_SECRET) {
    return NextResponse.json({ error: 'Configuração inválida' }, { status: 500 });
  }

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

    const quotation = await prisma.quotation.findUnique({
      where: { id },
      include: { customer: true, warranties: true },
    });

    if (!quotation) {
      return NextResponse.json({ error: 'Orçamento não encontrado' }, { status: 404 });
    }

    return NextResponse.json(quotation);

  } catch (error) {
    console.error('GET /api/quotations/[id] error:', error);
    return NextResponse.json({ error: 'Erro ao carregar orçamento' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
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

    const updateData: any = {};
    if (body.items) updateData.items = body.items;
    if (body.status) updateData.status = body.status;
    if (body.notes !== undefined) updateData.notes = body.notes;

    if (body.items) {
      updateData.total = body.items.reduce(
        (sum: number, item: any) => sum + item.quantity * item.unit_price,
        0
      );
    }

    const quotation = await prisma.quotation.update({
      where: { id },
      data: updateData,
      include: { customer: true },
    });

    // Auto-create ServiceOrder when approving quotation
    if (body.status === 'aceito') {
      const existingOS = await prisma.serviceOrder.findFirst({
        where: { quotationId: id },
      });

      if (!existingOS) {
        const addresses = (quotation.customer as any)?.addresses;
        const firstAddress = Array.isArray(addresses) && addresses.length > 0 ? addresses[0] : null;
        const address = firstAddress
          ? [firstAddress.street, firstAddress.number, firstAddress.city, firstAddress.state].filter(Boolean).join(', ')
          : '';

        await prisma.serviceOrder.create({
          data: {
            number: `OS-${Date.now()}`,
            quotationId: id,
            customerId: quotation.customerId,
            status: 'agendada',
            address,
            finalTotal: quotation.total,
          },
        });
      }
    }

    return NextResponse.json(quotation);

  } catch (error: any) {
    console.error('PUT /api/quotations/[id] error:', error);

    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Orçamento não encontrado' }, { status: 404 });
    }

    return NextResponse.json({ error: 'Erro ao atualizar orçamento' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
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

    await prisma.quotation.delete({ where: { id } });

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('DELETE /api/quotations/[id] error:', error);

    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Orçamento não encontrado' }, { status: 404 });
    }

    return NextResponse.json({ error: 'Erro ao deletar orçamento' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
