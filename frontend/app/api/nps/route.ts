import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';

// Fetch NPS history and metrics - requer autenticação
export async function GET(req: NextRequest): Promise<Response> {
  try {
    // Autenticação obrigatória
    const auth = await verifyAuth(req);
    if (!auth.success) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    const allScores = await prisma.nPS.findMany({
      select: { score: true },
    });

    let promoters = 0;
    let detractors = 0;
    let passives = 0;

    allScores.forEach(item => {
      if (item.score >= 9) promoters++;
      else if (item.score <= 6) detractors++;
      else passives++;
    });

    const totalResponses = allScores.length;
    let npsScore = 0;
    if (totalResponses > 0) {
      npsScore = Math.round(((promoters - detractors) / totalResponses) * 100);
    }

    const history = await prisma.nPS.findMany({
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        customer: {
          select: { name: true, phone: true }
        }
      }
    });

    const total = await prisma.nPS.count();

    return NextResponse.json({
      metrics: {
        npsScore,
        totalResponses,
        promoters,
        detractors,
        passives
      },
      history,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('[NPS_GET]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Submit a new NPS score - requer autenticação para evitar manipulação
export async function POST(req: NextRequest): Promise<Response> {
  try {
    // Autenticação obrigatória
    const auth = await verifyAuth(req);
    if (!auth.success) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await req.json();
    const { clientId, score, feedback } = body;

    if (!clientId || score === undefined) {
      return NextResponse.json({ error: 'clientId and score are required' }, { status: 400 });
    }

    if (score < 0 || score > 10) {
      return NextResponse.json({ error: 'score must be between 0 and 10' }, { status: 400 });
    }

    const nps = await prisma.nPS.create({
      data: {
        clientId,
        score,
        feedback: feedback || null,
      }
    });

    return NextResponse.json({ success: true, nps });
  } catch (error) {
    console.error('[NPS_POST]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
