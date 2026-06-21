import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import * as jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

function validateToken(request: NextRequest) {
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

export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  const { id } = await params;
  try {
    if (!validateToken(request)) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const body = await request.json();
    const { notes } = body;

    if (!notes) {
      return NextResponse.json({ error: 'Notas da falha técnica são obrigatórias' }, { status: 400 });
    }

    const warranty = await prisma.warranty.findUnique({
      where: { id },
      include: { customer: true },
    });

    if (!warranty) {
      return NextResponse.json({ error: 'Garantia não encontrada' }, { status: 404 });
    }

    // Cria um Quotation (OS de reparo sob garantia) com total 0.00 e status agendada
    const repairOS = await prisma.quotation.create({
      data: {
        customerId: warranty.customerId,
        items: [
          {
            description: `Reparo sob Garantia: ${notes}`,
            quantity: 1,
            price: 0,
          },
        ],
        total: 0,
        status: 'agendada',
        notes: `Acionamento de garantia Ref: ${warranty.id}. OS original: ${warranty.quotationId}.`,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: repairOS.id,
        customerId: repairOS.customerId,
        status: 'agendada',
        amount: 0,
      },
    }, { status: 201 });

  } catch (error: any) {
    console.error('POST /api/warranties/[id]/claim error:', error);
    return NextResponse.json({ error: 'Erro ao acionar garantia' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
