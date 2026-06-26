import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const reviews = await prisma.review.findMany({
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
      },
      orderBy: { createdAt: 'desc' },
    });

    // Calcular estatísticas gerais
    const totalReviews = reviews.length;
    const averageRating = totalReviews > 0
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews
      : 0;

    // Reviews recentes (últimas 5)
    const recentReviews = reviews.slice(0, 5).map((review) => ({
      clientName: review.customer.name,
      technicianName: review.technician.name,
      rating: review.rating,
      comment: review.comment,
      date: review.createdAt,
    }));

    // Técnicos com piores ratings
    const technicianStats: Record<string, { name: string; totalRating: number; count: number }> = {};

    reviews.forEach((review) => {
      const techId = review.technicianId;
      if (!technicianStats[techId]) {
        technicianStats[techId] = {
          name: review.technician.name,
          totalRating: 0,
          count: 0,
        };
      }
      technicianStats[techId].totalRating += review.rating;
      technicianStats[techId].count += 1;
    });

    const worstRatedTechnicians = Object.entries(technicianStats)
      .map(([id, stats]) => ({
        id,
        name: stats.name,
        rating: Math.round((stats.totalRating / stats.count) * 10) / 10,
        reviewCount: stats.count,
      }))
      .sort((a, b) => a.rating - b.rating)
      .slice(0, 5);

    // Reviews com rating baixo esta semana
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const lowRatingsThisWeek = reviews.filter(
      (review) => review.rating <= 2 && review.createdAt >= oneWeekAgo
    ).length;

    return NextResponse.json({
      averageRating: Math.round(averageRating * 10) / 10,
      totalReviews,
      recentReviews,
      worstRatedTechnicians,
      lowRatingsThisWeek,
    });
  } catch (error) {
    console.error('Error fetching reviews summary:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar resumo de avaliações' },
      { status: 500 }
    );
  }
}
