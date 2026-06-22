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
    jwt.verify(authHeader.substring(7), JWT_SECRET);
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

    const order = await prisma.serviceOrder.findUnique({
      where: { id },
      include: {
        customer: true,
        technician: true,
        quotation: { include: { items: { include: { product: true } } } },
        photos: true,
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Ordem de serviço não encontrada' }, { status: 404 });
    }

    return NextResponse.json(order);

  } catch (error) {
    console.error('GET /api/service-orders/[id] error:', error);
    return NextResponse.json({ error: 'Erro ao buscar OS' }, { status: 500 });
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
    const { technicianId, scheduledTime, address, notes, finalTotal, status } = body;

    const updateData: any = {};
    if (technicianId !== undefined) updateData.technicianId = technicianId;
    if (scheduledTime !== undefined) updateData.scheduledTime = new Date(scheduledTime);
    if (address !== undefined) updateData.address = address;
    if (notes !== undefined) updateData.notes = notes;
    if (finalTotal !== undefined) updateData.finalTotal = Number(finalTotal);
    if (status !== undefined) updateData.status = status;

    const order = await prisma.serviceOrder.update({
      where: { id },
      data: updateData,
      include: { customer: true, technician: true, quotation: true },
    });

    return NextResponse.json(order);

  } catch (error: any) {
    console.error('PUT /api/service-orders/[id] error:', error);
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'OS não encontrada' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Erro ao atualizar OS' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
