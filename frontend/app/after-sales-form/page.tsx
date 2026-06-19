'use client';

import React, { useState } from 'react';

export default function AfterSalesForm() {
  const [rating, setRating] = useState<number>(5);
  const [nps, setNps] = useState<number>(10);
  const [feedbackText, setFeedbackText] = useState('');
  const [problemText, setProblemText] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div style={{ maxWidth: '600px', margin: '100px auto', textAlign: 'center', fontFamily: 'sans-serif', padding: '20px' }}>
        <div style={{ fontSize: '48px', marginBottom: '24px' }}>🙏</div>
        <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#111827', marginBottom: '12px' }}>Obrigado pelo seu feedback!</h2>
        <p style={{ color: '#4B5563', lineHeight: '1.5' }}>
          {rating < 4 
            ? 'Lamentamos que sua experiência não tenha sido excelente. Nossa gerência foi notificada e entrará em contato em breve para resolver a situação.' 
            : 'Ficamos felizes que tenha gostado do atendimento! Sua avaliação nos ajuda a manter a qualidade dos nossos serviços.'}
        </p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '600px', margin: '40px auto', fontFamily: 'sans-serif', padding: '24px', border: '1px solid #E5E7EB', borderRadius: '12px', backgroundColor: '#FFFFFF', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
      <h1 style={{ fontSize: '22px', fontWeight: 'bold', color: '#111827', marginBottom: '8px', textAlign: 'center' }}>Sua Opinião é Importante</h1>
      <p style={{ color: '#6B7280', fontSize: '14px', marginBottom: '32px', textAlign: 'center' }}>Ajude-nos a melhorar nossos serviços residenciais respondendo a esta breve pesquisa.</p>

      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '24px' }}>
        {/* Satisfação Geral */}
        <div>
          <label style={{ display: 'block', fontWeight: 600, fontSize: '15px', color: '#374151', marginBottom: '12px' }}>
            Como você avalia a qualidade geral do serviço prestado? (1 a 5)
          </label>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            {[1, 2, 3, 4, 5].map(val => (
              <button
                key={val}
                type="button"
                onClick={() => setRating(val)}
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  border: rating === val ? '2px solid #2563EB' : '1px solid #D1D5DB',
                  backgroundColor: rating === val ? '#EFF6FF' : '#FFFFFF',
                  color: rating === val ? '#2563EB' : '#374151',
                  fontWeight: 'bold',
                  fontSize: '16px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                {val}
              </button>
            ))}
          </div>
        </div>

        {/* NPS */}
        <div>
          <label style={{ display: 'block', fontWeight: 600, fontSize: '15px', color: '#374151', marginBottom: '12px' }}>
            Em uma escala de 0 a 10, o quanto você recomendaria o ClickMarido para um amigo ou familiar?
          </label>
          <div style={{ display: 'flex', gap: '4px', justifyContent: 'space-between', overflowX: 'auto', paddingBottom: '8px' }}>
            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(val => (
              <button
                key={val}
                type="button"
                onClick={() => setNps(val)}
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '6px',
                  border: nps === val ? '2px solid #2563EB' : '1px solid #D1D5DB',
                  backgroundColor: nps === val ? '#EFF6FF' : '#FFFFFF',
                  color: nps === val ? '#2563EB' : '#374151',
                  fontWeight: 600,
                  fontSize: '13px',
                  cursor: 'pointer'
                }}
              >
                {val}
              </button>
            ))}
          </div>
        </div>

        {/* Comentários Livres */}
        <div>
          <label style={{ display: 'block', fontWeight: 600, fontSize: '15px', color: '#374151', marginBottom: '8px' }}>
            Conte-nos mais sobre sua experiência (Opcional)
          </label>
          <textarea
            value={feedbackText}
            onChange={e => setFeedbackText(e.target.value)}
            placeholder="Algum detalhe extra ou sugestão?"
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '6px',
              border: '1px solid #D1D5DB',
              minHeight: '80px',
              fontSize: '14px',
              boxSizing: 'border-box'
            }}
          />
        </div>

        {/* Escalação Condicional se satisfação < 4 */}
        {rating < 4 && (
          <div style={{ padding: '16px', backgroundColor: '#FFFBEB', borderRadius: '8px', borderLeft: '4px solid #F59E0B' }}>
            <label style={{ display: 'block', fontWeight: 600, fontSize: '14px', color: '#92400E', marginBottom: '8px' }}>
              Identificamos que sua nota foi insatisfatória. Qual problema ocorreu com o serviço?
            </label>
            <textarea
              required
              value={problemText}
              onChange={e => setProblemText(e.target.value)}
              placeholder="Descreva o problema para que possamos providenciar um ajuste gratuito..."
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '6px',
                border: '1px solid #F59E0B',
                minHeight: '60px',
                fontSize: '14px',
                boxSizing: 'border-box'
              }}
            />
          </div>
        )}

        <button
          type="submit"
          style={{
            backgroundColor: '#2563EB',
            color: '#FFFFFF',
            border: 'none',
            padding: '12px 24px',
            borderRadius: '6px',
            fontWeight: 600,
            fontSize: '15px',
            cursor: 'pointer',
            textAlign: 'center',
            transition: 'background-color 0.15s ease'
          }}
        >
          Enviar Avaliação
        </button>
      </form>
    </div>
  );
}
