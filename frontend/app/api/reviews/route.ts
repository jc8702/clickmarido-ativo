import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const technicianId = searchParams.get('technicianId');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const where: any = {};

    if (technicianId) {
      where.technicianId = technicianId;
    }

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where,
        include: {
          customer: {
            select: {
              id: true,
              name: true,
            },
          },
          technician: {
            select: {
              id: true,
              name: true,
            },
          },
          serviceOrder: {
            select: {
              id: true,
              number: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.review.count({ where }),
    ]);

    return NextResponse.json({
      data: reviews,
      total,
      page: Math.floor(offset / limit) + 1,
      pageSize: limit,
    });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar avaliações' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { serviceOrderId, customerId, technicianId, rating, comment, photos } = body;

    if (!serviceOrderId || !customerId || !technicianId || !rating) {
      return NextResponse.json(
        { error: 'Dados obrigatórios não fornecidos' },
        { status: 400 }
      );
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'Rating deve ser entre 1 e 5' },
        { status: 400 }
      );
    }

    // Verificar se já existe review para esta OS
    const existingReview = await prisma.review.findUnique({
      where: { serviceOrderId },
    });

    if (existingReview) {
      return NextResponse.json(
        { error: 'Já existe avaliação para esta ordem de serviço' },
        { status: 400 }
      );
    }

    const review = await prisma.review.create({
      data: {
        serviceOrderId,
        customerId,
        technicianId,
        rating,
        comment,
        photos,
      },
      include: {
        customer: true,
        technician: true,
        serviceOrder: true,
      },
    });

    return NextResponse.json(review, { status: 201 });
  } catch (error) {
    console.error('Error creating review:', error);
    return NextResponse.json(
      { error: 'Erro ao criar avaliação' },
      { status: 500 }
    );
  }
}
