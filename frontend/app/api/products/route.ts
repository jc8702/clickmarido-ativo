import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { productSchema } from '@/lib/validations/product.schema';
import { getFamilyCode, generateSkuFromFamily } from '@/lib/sku';
import * as jwt from 'jsonwebtoken';
const JWT_SECRET = process.env.JWT_SECRET;

function validateToken(request: NextRequest) {
  if (!JWT_SECRET) {
    return NextResponse.json({ error: 'Configuração inválida' }, { status: 500 });
  }

  const authHeader = request.headers.get('authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  try {
    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded;
  } catch {
    return null;
  }
}

async function getNextSkuSequence(category: string): Promise<number> {
  const fam = getFamilyCode(category);
  const prefix = `SRV-${fam}-`;

  const lastProduct = await prisma.product.findFirst({
    where: {
      sku: { startsWith: prefix },
    },
    orderBy: { sku: 'desc' },
    select: { sku: true },
  });

  if (!lastProduct) return 1;

  const match = lastProduct.sku.match(/(\d{3})$/);
  if (!match) return 1;

  return parseInt(match[1], 10) + 1;
}

export async function GET(request: NextRequest) {
  try {
    if (!validateToken(request)) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const search = searchParams.get('search') || '';
    const type = searchParams.get('type') || '';
    const family = searchParams.get('family') || '';

    const skip = (page - 1) * limit;

    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
        { category: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (type) {
      where.type = type;
    }

    if (family) {
      where.sku = { startsWith: `SRV-${family}-` };
    }

    const [data, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          vendor: true,
        },
        skip,
        take: limit,
        orderBy: { sku: 'asc' },
      }),
      prisma.product.count({ where }),
    ]);

    return NextResponse.json({
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });

  } catch (error) {
    console.error('GET /api/products error:', error);
    return NextResponse.json(
      { error: 'Erro ao listar produtos' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!validateToken(request)) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const parsed = productSchema.parse(body);

    // Auto-gerar SKU se vazio
    let sku = parsed.sku?.trim() || '';
    if (!sku && parsed.type === 'SERVICO' && parsed.category) {
      const nextSeq = await getNextSkuSequence(parsed.category);
      sku = generateSkuFromFamily(parsed.category, nextSeq);
    }

    if (!sku) {
      return NextResponse.json(
        { error: 'SKU é obrigatório para peças ou serviços sem categoria' },
        { status: 400 }
      );
    }

    const existing = await prisma.product.findFirst({
      where: { sku },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'SKU já cadastrado' },
        { status: 400 }
      );
    }

    const product = await prisma.product.create({
      data: {
        name: parsed.name,
        sku,
        type: parsed.type,
        description: parsed.description || '',
        price: parsed.price,
        unit: parsed.unit,
        category: parsed.category || '',
        active: parsed.active ?? true,
        vendorId: parsed.vendorId && parsed.vendorId.trim() !== '' ? parsed.vendorId : null,
        quantity: parsed.quantity,
        minStock: parsed.minStock,
        estimatedTime: parsed.estimatedTime,
        imageUrl: parsed.imageUrl || null,
      },
      include: {
        vendor: true,
      },
    });

    return NextResponse.json(product, { status: 201 });

  } catch (error: any) {
    console.error('POST /api/products error:', error);

    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Erro ao criar produto' },
      { status: 500 }
    );
}
}