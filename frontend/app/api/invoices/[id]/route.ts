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

type RouteParams = { params: Promise<{ id: string }> };

// GET /api/invoices/[id] - Buscar invoice por ID
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  try {
    if (!validateToken(request)) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        customer: true,
        quotation: {
          include: {
            items: {
              include: { product: true },
            },
          },
        },
        payments: true,
      },
    });

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice não encontrada' }, { status: 404 });
    }

    return NextResponse.json(invoice);
  } catch (error) {
    console.error('GET /api/invoices/[id] error:', error);
    return NextResponse.json({ error: 'Erro ao buscar invoice' }, { status: 500 });
  } finally {
  }
}

// PUT /api/invoices/[id] - Editar invoice
export async function PUT(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  try {
    if (!validateToken(request)) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const body = await request.json();
    const { dueDate, issRate, description, notes, status } = body;

    // Verificar se invoice existe
    const existingInvoice = await prisma.invoice.findUnique({
      where: { id },
    });

    if (!existingInvoice) {
      return NextResponse.json({ error: 'Invoice não encontrada' }, { status: 404 });
    }

    // Só permitir editar se estiver em rascunho
    if (existingInvoice.status !== 'rascunho' && status !== existingInvoice.status) {
      return NextResponse.json(
        { error: 'Só é possível editar invoices em rascunho' },
        { status: 400 }
      );
    }

    // Recalcular impostos se issRate mudou
    let updateData: any = {};
    if (dueDate) updateData.dueDate = new Date(dueDate);
    if (issRate !== undefined) {
      updateData.issRate = issRate;
      const subtotal = Number(existingInvoice.subtotal);
      updateData.taxAmount = subtotal * (issRate / 100);
      updateData.totalAmount = subtotal + updateData.taxAmount;
    }
    if (description !== undefined) updateData.description = description;
    if (notes !== undefined) updateData.notes = notes;
    if (status) updateData.status = status;

    const invoice = await prisma.invoice.update({
      where: { id },
      data: updateData,
      include: {
        customer: { select: { id: true, name: true, email: true } },
        quotation: { select: { id: true, total: true } },
      },
    });

    return NextResponse.json(invoice);
  } catch (error) {
    console.error('PUT /api/invoices/[id] error:', error);
    return NextResponse.json({ error: 'Erro ao atualizar invoice' }, { status: 500 });
  } finally {
  }
}

// DELETE /api/invoices/[id] - Cancelar invoice
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  try {
    if (!validateToken(request)) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const existingInvoice = await prisma.invoice.findUnique({
      where: { id },
      include: { payments: true },
    });

    if (!existingInvoice) {
      return NextResponse.json({ error: 'Invoice não encontrada' }, { status: 404 });
    }

    // Não permitir cancelar se já tem pagamento confirmado
    const hasConfirmedPayment = existingInvoice.payments.some(
      (p) => p.status === 'confirmado'
    );

    if (hasConfirmedPayment) {
      return NextResponse.json(
        { error: 'Não é possível cancelar invoice com pagamento confirmado' },
        { status: 400 }
      );
    }

    // Soft delete - mudar status para cancelada
    const invoice = await prisma.invoice.update({
      where: { id },
      data: { status: 'cancelada' },
    });

    return NextResponse.json({ message: 'Invoice cancelada', invoice });
  } catch (error) {
    console.error('DELETE /api/invoices/[id] error:', error);
    return NextResponse.json({ error: 'Erro ao cancelar invoice' }, { status: 500 });
  } finally {
  }
}
