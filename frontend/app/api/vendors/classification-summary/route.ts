import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import * as jwt from 'jsonwebtoken';

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

// GET /api/vendors/classification-summary - Obter consolidado de fornecedores por classificação
export async function GET(request: NextRequest) {
  try {
    if (!validateToken(request)) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const [totalActive, totalBlocked, summary] = await Promise.all([
      prisma.vendor.count({ where: { isActive: true } }),
      prisma.vendor.count({ where: { isBlocked: true } }),
      prisma.vendor.groupBy({
        by: ['classification'],
        _count: {
          _all: true,
        },
      }),
    ]);

    const classificationCounts = {
      A: 0,
      B: 0,
      C: 0,
      D: 0,
    };

    summary.forEach((item) => {
      const cls = item.classification as 'A' | 'B' | 'C' | 'D';
      if (cls in classificationCounts) {
        classificationCounts[cls] = item._count._all;
      }
    });

    return NextResponse.json({
      totalActive,
      totalBlocked,
      classifications: classificationCounts,
    });
  } catch (error) {
    console.error('GET /api/vendors/classification-summary error:', error);
    return NextResponse.json({ error: 'Erro ao processar resumo de fornecedores' }, { status: 500 });
  }
}
