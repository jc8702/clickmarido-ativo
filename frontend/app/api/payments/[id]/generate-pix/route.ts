import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import * as jwt from 'jsonwebtoken';
import { generatePixPayload, getPixQRCodeUrl } from '@/lib/pix';
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

async function handleGeneratePix(
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
      include: { customer: true },
    });

    if (!quotation) {
      return NextResponse.json({ error: 'Pagamento não encontrado' }, { status: 404 });
    }

    const pixKey = process.env.PIX_KEY;
    if (!pixKey) {
      console.error('[PIX] PIX_KEY não configurada. Configure a variável de ambiente PIX_KEY.');
      return NextResponse.json(
        { error: 'Chave PIX não configurada. Configure PIX_KEY no ambiente.' },
        { status: 500 }
      );
    }
    const customerName = quotation.customer?.name || 'Cliente';

    const pixPayload = generatePixPayload({
      key: pixKey,
      amount: Number(quotation.total),
      name: customerName,
      city: 'SAO PAULO',
    });

    const qrCodeUrl = getPixQRCodeUrl(pixPayload);

    let payment = await prisma.payment.findFirst({
      where: { quotationId: id, status: 'pendente' },
    });

    if (!payment) {
      payment = await prisma.payment.create({
        data: {
          quotationId: id,
          customerId: quotation.customerId,
          amount: quotation.total,
          method: 'pix',
          status: 'pendente',
          pixCode: pixPayload,
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        payment_id: payment.id,
        qr_code: pixPayload,
        qr_code_url: qrCodeUrl,
        amount: quotation.total,
        customer_name: customerName,
        customer_phone: quotation.customer?.phone || '',
        pix_key: pixKey,
      },
    });

  } catch (error) {
    console.error('POST /api/payments/[id]/generate-pix error:', error);
    return NextResponse.json(
      { error: 'Erro ao gerar PIX' },
      { status: 500 }
    );
  } finally {
  }
}

export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  return handleGeneratePix(request, { params });
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  return handleGeneratePix(request, { params });
}
