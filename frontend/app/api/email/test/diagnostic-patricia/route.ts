import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const leads = await prisma.lead.findMany({
      include: {
        source: true,
        responsavel: true,
      }
    });

    const filtrados = leads.map(l => ({
      id: l.id,
      name: l.name,
      phone: l.phone,
      status: l.status,
      funnelStage: l.funnelStage,
      createdAt: l.createdAt,
      updatedAt: l.updatedAt,
      responsavel: l.responsavel ? l.responsavel.name : 'Nenhum'
    }));

    return NextResponse.json({
      success: true,
      totalLeads: leads.length,
      leads: filtrados
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
