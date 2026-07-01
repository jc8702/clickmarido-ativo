import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateToken } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ technicianId: string }> }
) {
  try {
    if (!validateToken(request)) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const { technicianId } = await params;

    const technician = await prisma.technician.findUnique({
      where: { id: technicianId },
      select: { id: true, name: true },
    });

    if (!technician) {
      return NextResponse.json(
        { error: 'Técnico não encontrado' },
        { status: 404 }
      );
    }

    const reviews = await prisma.review.findMany({
      where: { technicianId },
      include: {
        customer: {
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
    });

    // Calcular estatísticas
    const totalReviews = reviews.length;
    const averageRating = totalReviews > 0
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews
      : 0;

    // Distribuição de ratings
    const ratingDistribution: Record<number, number> = {
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0,
    };

    reviews.forEach((review) => {
      ratingDistribution[review.rating] = (ratingDistribution[review.rating] || 0) + 1;
    });

    return NextResponse.json({
      technicianId,
      technicianName: technician.name,
      averageRating: Math.round(averageRating * 10) / 10,
      totalReviews,
      ratingDistribution,
      reviews: reviews.map((review) => ({
        id: review.id,
        rating: review.rating,
        comment: review.comment,
        customerName: review.customer.name,
        createdAt: review.createdAt,
      })),
    });
  } catch (error) {
    console.error('Error fetching technician reviews:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar avaliações do técnico' },
      { status: 500 }
    );
  }
}
