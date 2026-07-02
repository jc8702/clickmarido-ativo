import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest, { params }: { params: { id: string } }): Promise<Response> {
  try {
    const { id } = params;

    const technician = await prisma.technician.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        avatarUrl: true,
        specialty: true,
      }
    });

    if (!technician) {
      return NextResponse.json({ error: 'Técnico não encontrado' }, { status: 404 });
    }

    return NextResponse.json({ success: true, technician });
  } catch (error) {
    console.error('[NPS_TECH_GET]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
