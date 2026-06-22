import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const authResult = await verifyAuth(request);
    if (!authResult.success) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const type = searchParams.get('type') || '';
    const category = searchParams.get('category') || '';
    const limit = parseInt(searchParams.get('limit') || '50');

    const where: any = {
      active: true,
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (type) {
      where.type = type;
    }

    if (category) {
      where.category = { contains: category, mode: 'insensitive' };
    }

    const products = await prisma.product.findMany({
      where,
      take: Math.min(limit, 100),
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        sku: true,
        type: true,
        description: true,
        price: true,
        unit: true,
        category: true,
        active: true,
      },
    });

    return NextResponse.json({
      data: products,
      meta: { total: products.length },
    });
  } catch (error) {
    console.error('Error fetching available products:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
