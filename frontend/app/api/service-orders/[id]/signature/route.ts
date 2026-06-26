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

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!validateToken(request)) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const { id: serviceOrderId } = await params;
    const body = await request.json();
    const { signatureData, signerName } = body;

    if (!signatureData || !signerName) {
      return NextResponse.json({ error: 'Campos obrigatórios faltando' }, { status: 400 });
    }

    // Verificar se a OS existe
    const serviceOrder = await prisma.serviceOrder.findUnique({
      where: { id: serviceOrderId }
    });

    if (!serviceOrder) {
      return NextResponse.json({ error: 'Ordem de serviço não encontrada' }, { status: 404 });
    }

    // Criar ou atualizar a SignatureRequest
    const signature = await prisma.signatureRequest.upsert({
      where: { serviceOrderId },
      create: {
        serviceOrderId,
        signatureData,
        signerName,
        ipAddress: request.headers.get('x-forwarded-for') || '127.0.0.1',
        userAgent: request.headers.get('user-agent') || 'Unknown',
      },
      update: {
        signatureData,
        signerName,
        signedAt: new Date(),
        ipAddress: request.headers.get('x-forwarded-for') || '127.0.0.1',
        userAgent: request.headers.get('user-agent') || 'Unknown',
      }
    });

    // Atualizar o status da Ordem de Serviço para concluida e registrar data de conclusão
    await prisma.serviceOrder.update({
      where: { id: serviceOrderId },
      data: {
        status: 'concluida',
        completedAt: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      data: signature
    });
  } catch (error) {
    console.error('POST /api/service-orders/[id]/signature error:', error);
    return NextResponse.json(
      { error: 'Erro ao registrar assinatura' },
      { status: 500 }
    );
  } finally {
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!validateToken(request)) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const { id: serviceOrderId } = await params;

    const signature = await prisma.signatureRequest.findUnique({
      where: { serviceOrderId }
    });

    if (!signature) {
      return NextResponse.json({ error: 'Assinatura não encontrada' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: signature
    });
  } catch (error) {
    console.error('GET /api/service-orders/[id]/signature error:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar assinatura' },
      { status: 500 }
    );
  } finally {
  }
}
