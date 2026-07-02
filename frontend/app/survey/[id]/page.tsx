'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { Card, CardContent } from '@/components/Card';
import { Button } from '@/components/Button';

export default function SurveyPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const clientId = params?.id as string;
  const serviceOrderId = searchParams?.get('os');
  const technicianId = searchParams?.get('tech');

  const [customerName, setCustomerName] = useState<string>('');
  const [technicianName, setTechnicianName] = useState<string>('');
  const [score, setScore] = useState<number | null>(null);
  const [technicianScore, setTechnicianScore] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<string>('');
  const [selectedReasons, setSelectedReasons] = useState<string[]>([]);
  const [loadingName, setLoadingName] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submitted, setSubmitted] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleScoreChange = (value: number) => {
    setScore(value);
    setSelectedReasons([]);
  };

  const handleTechScoreChange = (value: number) => {
    setTechnicianScore(value);
  };

  const handleReasonToggle = (reason: string) => {
    setSelectedReasons(prev =>
      prev.includes(reason) ? prev.filter(r => r !== reason) : [...prev, reason]
    );
  };

  useEffect(() => {
    if (!clientId) return;

    const fetchCustomerName = async () => {
      try {
        const res = await fetch(`/api/nps/customer/${clientId}`);
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.name) {
            setCustomerName(data.name);
          }
        }
      } catch (err) {
        console.error('Erro ao carregar nome do cliente:', err);
      } finally {
        setLoadingName(false);
      }
    };

    const fetchTechnicianName = async () => {
      if (!technicianId) return;
      try {
        const res = await fetch(`/api/nps/technician/${technicianId}`);
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.technician && data.technician.name) {
            setTechnicianName(data.technician.name);
          }
        }
      } catch (err) {
        console.error('Erro ao carregar nome do técnico:', err);
      }
    };

    fetchCustomerName();
    fetchTechnicianName();
  }, [clientId, technicianId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (score === null || !clientId) return;

    setSubmitting(true);
    setError(null);

    const formattedFeedback = selectedReasons.length > 0
      ? `[Opções: ${selectedReasons.join(', ')}] ${feedback}`
      : feedback;

    try {
      const res = await fetch('/api/nps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId,
          score,
          feedback: formattedFeedback,
          serviceOrderId,
          technicianId,
          technicianScore,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Erro ao enviar avaliação');
      }

      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || 'Erro ao enviar a resposta. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  const getPlaceholder = () => {
    if (score === null) return 'Escreva seu comentário aqui (opcional)...';
    if (score >= 9) return 'O que você mais gostou no nosso serviço? (opcional)';
    if (score >= 7) return 'O que faltou para a sua experiência ser nota 10? (opcional)';
    return 'Conte-nos o que deu errado e como podemos melhorar. (opcional)';
  };

  const getScoreColor = (value: number) => {
    if (value >= 9) return 'hover:bg-emerald-500 hover:text-white border-emerald-300 dark:border-emerald-700 active:bg-emerald-600';
    if (value >= 7) return 'hover:bg-amber-500 hover:text-white border-amber-300 dark:border-amber-700 active:bg-amber-600';
    return 'hover:bg-rose-500 hover:text-white border-rose-300 dark:border-rose-700 active:bg-rose-600';
  };

  const getSelectedColor = (value: number) => {
    if (value >= 9) return 'bg-emerald-500 text-white border-emerald-500 shadow-lg shadow-emerald-500/20 scale-110';
    if (value >= 7) return 'bg-amber-500 text-white border-amber-500 shadow-lg shadow-amber-500/20 scale-110';
    return 'bg-rose-500 text-white border-rose-500 shadow-lg shadow-rose-500/20 scale-110';
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-neutral-900 dark:to-neutral-950 p-4">
        <Card className="w-full max-w-lg shadow-2xl border-neutral-100 dark:border-neutral-800 transform scale-100 transition-all duration-300">
          <CardContent className="flex flex-col items-center justify-center text-center py-12 px-6 space-y-6">
            <div className="h-20 w-20 bg-emerald-100 dark:bg-emerald-950/50 rounded-full flex items-center justify-center animate-bounce">
              <svg className="h-10 w-10 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-black text-neutral-900 dark:text-neutral-100">Avaliação Enviada!</h2>
              <p className="text-neutral-500 dark:text-neutral-400 text-sm max-w-md">
                Muito obrigado{customerName ? `, ${customerName}` : ''}! Seu feedback é muito valioso para mantermos a qualidade do nosso serviço.
              </p>
              {score !== null && score >= 9 && (
                <div className="pt-4 animate-fadeIn">
                  <div className="bg-primary-50 dark:bg-primary-950/20 border border-primary-100 dark:border-primary-900/50 p-4 rounded-2xl space-y-3">
                    <p className="text-xs font-bold text-primary-700 dark:text-primary-400">
                      Ficamos muito felizes! Que tal compartilhar sua nota no Google da Click Marido?
                    </p>
                    <a
                      href="https://search.google.com/local/writereview?placeid=ChIJN1t_tDeuEmsRUrcGqqljv_U"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center bg-primary-600 hover:bg-primary-700 text-white text-xs font-black py-2 px-5 rounded-xl shadow-md transition-all gap-1.5"
                    >
                      ⭐ Avaliar no Google
                    </a>
                  </div>
                </div>
              )}
            </div>
            <div className="pt-2 text-xs text-neutral-400 font-mono">
              Click Marido — Atendimento Residencial
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-neutral-900 dark:to-neutral-950 p-4 py-12">
      <div className="w-full max-w-lg space-y-6">
        {/* Header/Logo */}
        <div className="text-center space-y-1">
          <div className="inline-block bg-primary-600 text-white font-black text-xl py-2 px-6 rounded-2xl shadow-md tracking-wider">
            CLICK MARIDO
          </div>
          <p className="text-xs text-neutral-400 font-semibold uppercase tracking-widest mt-2">Satisfação do Cliente</p>
        </div>

        <Card className="shadow-2xl border-neutral-100 dark:border-neutral-800">
          <CardContent className="p-6 md:p-8 space-y-8">
            <div className="text-center space-y-2">
              <h1 className="text-xl md:text-2xl font-black text-neutral-900 dark:text-neutral-100 leading-tight">
                {loadingName ? 'Olá!' : `Olá, ${customerName || 'Cliente Click Marido'}!`}
              </h1>
              <p className="text-neutral-500 dark:text-neutral-400 text-sm">
                Em uma escala de <span className="font-bold">0 a 10</span>, qual a probabilidade de você recomendar a Click Marido para um amigo ou colega?
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Régua de notas */}
              <div className="space-y-2">
                <div className="grid grid-cols-6 gap-2 md:flex md:flex-wrap md:justify-center md:gap-2.5">
                  {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => handleScoreChange(num)}
                      className={`h-11 w-11 md:h-12 md:w-12 text-sm font-bold rounded-full border transition-all duration-200 flex items-center justify-center select-none ${
                        score === num
                          ? getSelectedColor(num)
                          : \`bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-neutral-800 \${getScoreColor(num)}\`
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
                {/* Rótulos da Régua */}
                <div className="flex justify-between text-[11px] text-neutral-400 dark:text-neutral-500 font-semibold px-1 pt-1">
                  <span>0 - Pouco provável</span>
                  <span>10 - Extremamente provável</span>
                </div>
              </div>

              {/* Opções de Justificativa com base na nota */}
              {score !== null && (
                <div className="space-y-3 animate-fadeIn">
                  <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300 block">
                    {score >= 9
                      ? "O que você mais gostou no nosso serviço? (Selecione)"
                      : score >= 7
                      ? "O que faltou para a sua experiência ser nota 10? (Selecione)"
                      : "O que poderíamos ter feito melhor? (Selecione)"}
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {(score >= 9
                      ? [
                          'Pontualidade e compromisso',
                          'Limpeza e zelo pelo ambiente',
                          'Educação e postura do técnico',
                          'Agilidade na resolução do serviço'
                        ]
                      : score >= 7
                      ? [
                          'Preços mais competitivos',
                          'Agilidade no início do atendimento',
                          'Mais opções de parcelamento',
                          'Explicações técnicas detalhadas'
                        ]
                      : [
                          'Pontualidade do técnico',
                          'Limpeza do ambiente pós-serviço',
                          'Qualidade e acabamento do serviço',
                          'Preço cobrado',
                          'Cordialidade / Atendimento'
                        ]
                    ).map((reason) => (
                      <button
                        key={reason}
                        type="button"
                        onClick={() => handleReasonToggle(reason)}
                        className={`text-left text-xs py-2.5 px-3.5 rounded-xl border font-semibold transition-all duration-200 flex items-center justify-between ${
                          selectedReasons.includes(reason)
                            ? 'bg-primary-50 dark:bg-primary-950/20 text-primary-600 dark:text-primary-400 border-primary-500 font-bold'
                            : 'bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/50'
                        }`}
                      >
                        <span>{reason}</span>
                        {selectedReasons.includes(reason) && (
                          <svg className="h-4.5 w-4.5 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Avaliação do Técnico (só mostra se tiver técnico e se já deu a nota principal) */}
              {score !== null && technicianId && (
                <div className="space-y-3 pt-4 border-t border-neutral-100 dark:border-neutral-800 animate-fadeIn">
                  <label className="text-sm font-bold text-neutral-800 dark:text-neutral-200 block text-center">
                    Como você avalia o serviço executado pelo técnico {technicianName ? <span className="text-primary-600 dark:text-primary-400">{technicianName}</span> : ''}?
                  </label>
                  <div className="flex justify-center gap-2 md:gap-4">
                    {[1, 2, 3, 4, 5].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => handleTechScoreChange(num)}
                        className={`transition-all duration-200 transform hover:scale-110 ${
                          technicianScore && technicianScore >= num 
                            ? 'text-amber-400' 
                            : 'text-neutral-300 dark:text-neutral-700'
                        }`}
                      >
                        <svg className="w-10 h-10 md:w-12 md:h-12 drop-shadow-sm" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      </button>
                    ))}
                  </div>
                  <div className="flex justify-between text-[11px] text-neutral-400 dark:text-neutral-500 font-semibold px-4 pt-1">
                    <span>Ruim</span>
                    <span>Excelente</span>
                  </div>
                </div>
              )}

              {/* Área de Comentário */}
              {score !== null && (
                <div className="space-y-2 pt-2 animate-fadeIn">
                  <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300 block">
                    Comentários adicionais (opcional):
                  </label>
                  <textarea
                    rows={3}
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder={getPlaceholder()}
                    className="w-full rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50 p-3 text-sm text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none transition-all resize-none"
                  />
                </div>
              )}

              {error && (
                <div className="text-xs font-semibold text-rose-600 bg-rose-50 dark:bg-rose-950/20 dark:text-rose-400 p-3 rounded-lg border border-rose-200 dark:border-rose-900/50">
                  {error}
                </div>
              )}

              {/* Botão de Envio */}
              <Button
                type="submit"
                variant="primary"
                fullWidth
                size="lg"
                disabled={score === null || submitting || (technicianId !== null && technicianScore === null)}
                isLoading={submitting}
                className="rounded-xl font-bold py-3 transition-transform hover:scale-[1.01]"
              >
                Enviar Avaliação
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
