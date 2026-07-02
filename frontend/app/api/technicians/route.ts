import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    if (!validateToken(request)) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const activeOnly = searchParams.get('active') !== 'all';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = (page - 1) * limit;

    const where: any = {};

    if (activeOnly) {
      where.active = true;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { specialty: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [technicians, total] = await Promise.all([
      prisma.technician.findMany({
        where,
        include: {
          _count: {
            select: {
              serviceOrders: true,
              appointments: true,
              reviews: true,
            },
          },
          reviews: {
            select: { rating: true },
          },
        },
        orderBy: { name: 'asc' },
        skip,
        take: limit,
      }),
      prisma.technician.count({ where }),
    ]);

    // Calcular média de avaliações para cada técnico
    const data = technicians.map((tech) => {
      const avgRating =
        tech.reviews.length > 0
          ? Math.round(
              (tech.reviews.reduce((sum, r) => sum + r.rating, 0) / tech.reviews.length) * 10
            ) / 10
          : null;

      const { reviews, ...rest } = tech;
      return {
        ...rest,
        avgRating,
        hourlyRate: tech.hourlyRate ? Number(tech.hourlyRate) : null,
      };
    });

    return NextResponse.json({
      data,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('GET /api/technicians error:', error);
    return NextResponse.json({ error: 'Erro ao listar técnicos' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!validateToken(request)) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const body = await request.json();
    const { name, email, phone, specialty, document, address, bio, hourlyRate, hireDate, avatarUrl } = body;

    if (!name) {
      return NextResponse.json({ error: 'Nome é obrigatório' }, { status: 400 });
    }

    const technician = await prisma.technician.create({
      data: {
        name,
        email: email || '',
        phone: phone || '',
        specialty: specialty || '',
        document: document || '',
        address: address || '',
        bio: bio || '',
        hourlyRate: hourlyRate ? parseFloat(hourlyRate) : null,
        hireDate: hireDate ? new Date(hireDate) : null,
        avatarUrl: avatarUrl || null,
      },
    });

    return NextResponse.json({ success: true, data: technician }, { status: 201 });
  } catch (error: any) {
    console.error('POST /api/technicians error:', error);
    return NextResponse.json({ error: `Erro ao criar técnico: ${error instanceof Error ? error.message : String(error)}` }, { status: 500 });
  }
}