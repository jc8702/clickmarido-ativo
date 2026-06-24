import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

type RouteParams = { params: Promise<{ id: string }> };

// Rota pública para retornar apenas o primeiro nome do cliente para fins de personalização na pesquisa NPS
export async function GET(
  request: NextRequest,
  { params }: RouteParams
): Promise<Response> {
  try {
    const { id } = await params;

    const customer = await prisma.customer.findUnique({
      where: { id },
      select: { name: true },
    });

    if (!customer) {
      return NextResponse.json({ error: 'Cliente não encontrado' }, { status: 404 });
    }

    // Retorna apenas o primeiro nome
    const firstName = customer.name.split(' ')[0];

    return NextResponse.json({ success: true, name: firstName });
  } catch (error) {
    console.error('[NPS_CUSTOMER_GET]', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
