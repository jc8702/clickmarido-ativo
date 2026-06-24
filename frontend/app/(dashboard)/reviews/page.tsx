'use client';

import { useState, useEffect } from 'react';
import { Star, User, Calendar, TrendingUp, AlertTriangle } from 'lucide-react';

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  customer: {
    id: string;
    name: string;
  };
  technician: {
    id: string;
    name: string;
  };
  serviceOrder: {
    id: string;
    number: string;
  };
}

interface ReviewsSummary {
  averageRating: number;
  totalReviews: number;
  recentReviews: {
    clientName: string;
    technicianName: string;
    rating: number;
    comment: string | null;
    date: string;
  }[];
  worstRatedTechnicians: {
    id: string;
    name: string;
    rating: number;
    reviewCount: number;
  }[];
  lowRatingsThisWeek: number;
}

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [summary, setSummary] = useState<ReviewsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterTechnician, setFilterTechnician] = useState<string>('');

  useEffect(() => {
    fetchReviews();
    fetchSummary();
  }, [filterTechnician]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filterTechnician) params.append('technicianId', filterTechnician);

      const response = await fetch(`/api/reviews?${params.toString()}`);
      const data = await response.json();
      setReviews(data.data || []);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSummary = async () => {
    try {
      const response = await fetch('/api/reviews/summary');
      const data = await response.json();
      setSummary(data);
    } catch (error) {
      console.error('Error fetching reviews summary:', error);
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={16}
            className={star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}
          />
        ))}
      </div>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Avaliações</h1>
      </div>

      {/* Resumo */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white border rounded-lg p-4">
            <div className="flex items-center gap-2 text-gray-600 mb-2">
              <Star size={20} className="text-yellow-500" />
              <span className="font-medium">Média Geral</span>
            </div>
            <div className="text-3xl font-bold">{summary.averageRating}</div>
            <div className="text-sm text-gray-500">de 5.0</div>
          </div>

          <div className="bg-white border rounded-lg p-4">
            <div className="flex items-center gap-2 text-gray-600 mb-2">
              <User size={20} className="text-blue-500" />
              <span className="font-medium">Total de Avaliações</span>
            </div>
            <div className="text-3xl font-bold">{summary.totalReviews}</div>
          </div>

          <div className="bg-white border rounded-lg p-4">
            <div className="flex items-center gap-2 text-gray-600 mb-2">
              <AlertTriangle size={20} className="text-orange-500" />
              <span className="font-medium">Avaliações Baixas (Semana)</span>
            </div>
            <div className="text-3xl font-bold">{summary.lowRatingsThisWeek}</div>
            <div className="text-sm text-gray-500">rating ≤ 2</div>
          </div>

          <div className="bg-white border rounded-lg p-4">
            <div className="flex items-center gap-2 text-gray-600 mb-2">
              <TrendingUp size={20} className="text-green-500" />
              <span className="font-medium">Piores Técnicos</span>
            </div>
            <div className="space-y-1">
              {summary.worstRatedTechnicians.slice(0, 3).map((tech) => (
                <div key={tech.id} className="flex justify-between text-sm">
                  <span>{tech.name}</span>
                  <span className="text-red-500">{tech.rating}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className="flex gap-2 mb-6">
        <select
          value={filterTechnician}
          onChange={(e) => setFilterTechnician(e.target.value)}
          className="px-4 py-2 border rounded-lg"
        >
          <option value="">Todos os técnicos</option>
          {/* Adicionar opções de técnicos dinamicamente */}
        </select>
      </div>

      {/* Lista de Reviews */}
      {loading ? (
        <div className="text-center py-8">Carregando avaliações...</div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          Nenhuma avaliação encontrada.
        </div>
      ) : (
        <div className="grid gap-4">
          {reviews.map((review) => (
            <div key={review.id} className="bg-white border rounded-lg p-4">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    {renderStars(review.rating)}
                    <span className="text-sm text-gray-500">
                      OS #{review.serviceOrder.number}
                    </span>
                  </div>

                  {review.comment && (
                    <p className="text-gray-700 mb-3">"{review.comment}"</p>
                  )}

                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <User size={14} />
                      <span>{review.customer.name}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar size={14} />
                      <span>{formatDate(review.createdAt)}</span>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-sm text-gray-600">Técnico</div>
                  <div className="font-medium">{review.technician.name}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
