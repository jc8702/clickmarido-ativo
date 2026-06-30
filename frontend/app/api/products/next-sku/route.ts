import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getFamilyCode, generateSkuFromFamily, getAllFamilyCodes } from '@/lib/sku';
import { validateToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    if (!validateToken(request)) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') || '';

    if (!category) {
      return NextResponse.json({
        families: getAllFamilyCodes(),
      });
    }

    const fam = getFamilyCode(category);
    const prefix = `SRV-${fam}-`;

    const lastProduct = await prisma.product.findFirst({
      where: { sku: { startsWith: prefix } },
      orderBy: { sku: 'desc' },
      select: { sku: true, name: true },
    });

    let nextSequence = 1;
    if (lastProduct) {
      const match = lastProduct.sku.match(/(\d{3})$/);
      if (match) {
        nextSequence = parseInt(match[1], 10) + 1;
      }
    }

    const nextSku = generateSkuFromFamily(category, nextSequence);

    return NextResponse.json({
      sku: nextSku,
      family: fam,
      familyName: category,
      sequence: nextSequence,
      lastProduct: lastProduct ? { sku: lastProduct.sku, name: lastProduct.name } : null,
    });
  } catch (error) {
    console.error('GET /api/products/next-sku error:', error);
    return NextResponse.json({ error: 'Erro ao gerar SKU' }, { status: 500 });
}
}