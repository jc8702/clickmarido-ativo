'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Script from 'next/script';
export default function PrintQuotationPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const router = useRouter();
  const [quote, setQuote] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [libLoaded, setLibLoaded] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  
  // States para aprovação digital
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [signatureName, setSignatureName] = useState('');
  const [signatureAgreed, setSignatureAgreed] = useState(false);
  const [approvalLoading, setApprovalLoading] = useState(false);
  const [approvedSuccess, setApprovedSuccess] = useState(false);

  useEffect(() => {
    if (!id) return;

    const loadData = async () => {
      try {
        setIsLoading(true);
        // 1. Tenta buscar da API autenticada se houver token no localStorage
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        let response = null;
        if (token) {
          response = await fetch(`/api/quotations/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
        }

        // 2. Se falhar ou não tiver token, usa a API pública
        if (!response || !response.ok) {
          response = await fetch(`/api/quotations/public/${id}`);
        }

        if (response && response.ok) {
          const rawData = await response.json();
          // Mapeia os dados da API pública/privada para o formato esperado pelo layout
          const mapped = {
            id: rawData.id,
            number: rawData.number,
            createdAt: rawData.valid_until || rawData.createdAt || new Date().toISOString(),
            validUntil: rawData.valid_until,
            status: rawData.status,
            total: rawData.total,
            discountPercentage: rawData.discountPercentage || 0,
            notes: rawData.notes,
            customer: rawData.customer || {
              name: rawData.customer_name,
              phone: rawData.customer_phone,
              email: rawData.customer_email || 'Não informado',
            },
            items: rawData.items ? rawData.items.map((item: any) => ({
              product: { name: item.name || item.product?.name || '' },
              quantity: item.quantity,
              unitPrice: item.unit_price || item.unitPrice,
            })) : []
          };
          setQuote(mapped);
        } else {
          setQuote(null);
        }
      } catch (err) {
        console.error('Erro ao buscar orçamento na página de impressão:', err);
        setQuote(null);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [id]);

  useEffect(() => {
    // Escuta tecla Escape para fechar
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowApprovalModal((prev) => {
          if (prev) return false;
          window.close();
          return prev;
        });
      }
    };
    window.addEventListener('keydown', handleEscape);
    
    // Força light mode removendo classe dark do html, já que o tailwind injeta lá
    document.documentElement.classList.remove('dark');
    document.documentElement.classList.add('light');

    return () => window.removeEventListener('keydown', handleEscape);
  }, []);

  useEffect(() => {
    if (libLoaded && quote) {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('autoDownload') === 'true') {
        // Aguarda um instante para garantir a renderização completa das fontes
        setTimeout(async () => {
          handleDownloadPDF();
          
          const redirectToChat = urlParams.get('redirectToChat');
          if (redirectToChat) {
             const element = document.getElementById('pdf-content');
             if (element) {
               const opt = {
                 margin: 10,
                 filename: `Orcamento_Click_Marido_${quote.id.slice(0, 8)}.pdf`,
                 image: { type: 'jpeg', quality: 1.0 },
                 html2canvas: { scale: 2, useCORS: true, logging: false, backgroundColor: '#ffffff', windowWidth: 794 },
                 jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
                 pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
               };
               try {
                 // @ts-ignore
                 const pdfBase64Url = await window.html2pdf().from(element).set(opt).outputPdf('datauristring');
                 const pureBase64 = pdfBase64Url.split(',')[1];
                 
                 localStorage.setItem('auto_attach_pdf', pureBase64);
                 localStorage.setItem('auto_attach_name', opt.filename);
                 
                 const message = `Olá! Segue em anexo a nossa proposta comercial #${quote.id.slice(0, 8).toUpperCase()}. Qualquer dúvida, estamos à disposição.`;
                 window.location.href = `/chat?phone=${redirectToChat}&autoAttach=true&text=${encodeURIComponent(message)}`;
               } catch (err) {
                 console.error('Erro ao gerar base64 para redirecionamento:', err);
               }
             }
          }
        }, 1000);
      }
    }
  }, [libLoaded, quote]);

  const handleDownloadPDF = () => {
    const element = document.getElementById('pdf-content');
    if (!element) return;

    const opt = {
      margin: 0,
      filename: `Orcamento_Click_Marido_${quote?.number || quote?.id?.slice(0, 8) || 'PROP'}.pdf`,
      image: { type: 'jpeg', quality: 1.0 },
      html2canvas: { scale: 2, useCORS: true, logging: false, backgroundColor: '#ffffff' },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
    };

    // @ts-ignore
    if (window.html2pdf) {
      // @ts-ignore
      window.html2pdf().from(element).set(opt).save();
    } else {
      alert('Biblioteca de PDF ainda carregando. Por favor, aguarde um instante.');
    }
  };

  const handleClientApproval = async () => {
    if (!signatureName.trim() || !signatureAgreed) {
      alert("Por favor, preencha seu nome e confirme o aceite dos termos.");
      return;
    }

    let signatureImage = null;
    if (canvasRef.current) {
      signatureImage = canvasRef.current.toDataURL('image/png');
    }

    setApprovalLoading(true);
    try {
      const res = await fetch(`/api/quotations/public/${id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ signatureName, signatureImage }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Erro ao aprovar proposta');
      }
      setApprovedSuccess(true);
      setShowApprovalModal(false);
      setQuote({ ...quote, status: 'aceito', approvedBy: signatureName, signatureImage });
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Erro ao aprovar proposta. Tente novamente.');
    } finally {
      setApprovalLoading(false);
    }
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.beginPath();
    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !canvasRef.current) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  const handleApproveAndSend = async () => {
    const element = document.getElementById('pdf-content');
    // @ts-ignore
    if (!element || !window.html2pdf || !quote) return;
    
    setActionLoading(true);
    
    const opt = {
      margin: 0,
      filename: `Orcamento_Click_Marido_${quote.number || quote.id.slice(0, 8)}.pdf`,
      image: { type: 'jpeg', quality: 1.0 },
      html2canvas: { scale: 2, useCORS: true, logging: false, backgroundColor: '#ffffff' },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
    };

    try {
      // Atualiza o status para enviado na API (opcional, mas recomendado se for "Aprovar e Enviar")
      await fetch(`/api/quotations/${quote.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify({ status: 'enviado' })
      });
      
      // @ts-ignore
      const pdfBase64Url = await window.html2pdf().from(element).set(opt).outputPdf('datauristring');
      const pureBase64 = pdfBase64Url.split(',')[1];
      
      localStorage.setItem('auto_attach_pdf', pureBase64);
      localStorage.setItem('auto_attach_name', opt.filename);
      const quoteDisplayId = quote.number || quote.id.slice(0, 8).toUpperCase();
      const msgText = `Olá! Segue em anexo a nossa proposta comercial #${quoteDisplayId}. Qualquer dúvida, estamos à disposição.`;
      
      const customerPhone = quote.customer?.phone ? quote.customer.phone.replace(/\D/g, '') : '';
      const targetUrl = `/chat?phone=${customerPhone}&autoAttach=true&text=${encodeURIComponent(msgText)}`;
      
      if (window.opener && !window.opener.closed) {
        window.opener.location.href = targetUrl;
        window.close();
      } else {
        window.location.href = targetUrl;
      }
    } catch (err) {
      console.error(err);
      alert('Erro ao gerar PDF ou enviar.');
      setActionLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100">
        <p className="animate-pulse font-medium">Preparando proposta de impressão...</p>
      </div>
    );
  }

  if (!quote) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-neutral-900 text-red-500">
        <p>Orçamento não encontrado.</p>
      </div>
    );
  }

  const customerName = quote.customer?.name || 'Não informado';
  const customerPhone = quote.customer?.phone || 'Não informado';
  const customerEmail = quote.customer?.email || 'Não informado';
  const formattedCreatedAt = new Date(quote.createdAt).toLocaleDateString('pt-BR');
  
  // Usar a data de validade que vem do banco se disponível, caso contrário calcular 15 dias
  const validUntilDate = quote.validUntil 
    ? new Date(quote.validUntil).toLocaleDateString('pt-BR')
    : new Date(new Date(quote.createdAt).getTime() + 15 * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR');

  const getQuotationItems = (itemsField: any): any[] => {
    try {
      return typeof itemsField === 'string'
        ? JSON.parse(itemsField)
        : itemsField || [];
    } catch {
      return [];
    }
  };

  const getNotesText = (notes: string) => {
    if (!notes) return '';
    const trimmed = notes.trim();
    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      try {
        const parsed = JSON.parse(notes);
        return parsed.notes || parsed.description_notes || '';
      } catch {
        return notes;
      }
    }
    return notes;
  };

  const items = getQuotationItems(quote.items);

  const discountPercentage = Number(quote.discountPercentage || 0);
  const totalAmount = Number(quote.total || 0);
  
  // Recalcular subtotal a partir dos itens
  const itemsForCalc = getQuotationItems(quote.items);
  const subtotal = itemsForCalc.reduce((sum: number, item: any) => {
    const itemPrice = Number(item.unitPrice || item.unit_price || item.price || 0);
    const itemQty = Number(item.quantity || 1);
    return sum + (itemPrice * itemQty);
  }, 0);
  
  // Recalcular desconto
  const discountAmount = subtotal * (discountPercentage / 100);

  return (
    <div className="bg-[#f5f5f5] min-h-screen py-8 print:py-0 print:bg-white transition-colors duration-200">
      {/* Google Fonts para visual Premium */}
      <style dangerouslySetInnerHTML={{__html: `
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Outfit:wght@500;600;700;800;900&display=swap');
        #pdf-content {
          font-family: 'Inter', sans-serif;
        }
        .font-title {
          font-family: 'Outfit', sans-serif;
        }
        .rich-text-content ul {
          list-style-type: disc !important;
          padding-left: 1.5rem !important;
        }
        .rich-text-content ol {
          list-style-type: decimal !important;
          padding-left: 1.5rem !important;
        }
      `}} />

      {/* Script da CDN para geração de PDF */}
      <Script 
        src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js" 
        strategy="afterInteractive"
        onLoad={() => setLibLoaded(true)}
      />

      {/* Barra de Ações Fixa (Oculta na Impressão) */}
      <div className="max-w-[210mm] mx-auto mb-6 flex justify-between items-center px-4 print:hidden">
        <button 
          onClick={() => router.back()} 
          className="px-4 py-2 bg-[#ffffff] hover:bg-[#f5f5f5] text-[#1f2937] text-xs font-bold rounded-2xl border border-[#e5e7eb] shadow-xs transition-all"
        >
          &larr; Voltar
        </button>
        <div className="flex gap-2">
          <button 
            onClick={() => window.print()} 
            className="px-4 py-2 bg-[#ffffff] hover:bg-[#f5f5f5] text-[#1f2937] text-xs font-bold rounded-2xl border border-[#e5e7eb] shadow-xs transition-all flex items-center gap-1.5"
          >
            <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Imprimir
          </button>
          <button 
            onClick={handleDownloadPDF} 
            disabled={!libLoaded}
            className="px-4 py-2 bg-[#ffffff] hover:bg-[#f5f5f5] text-[#9333ea] text-xs font-bold rounded-2xl border border-[#d8b4fe] shadow-xs transition-all disabled:opacity-50 flex items-center gap-1.5"
          >
            Baixar PDF Premium
          </button>
          {quote.status === 'aprovado' || approvedSuccess ? (
            <div className="px-5 py-2 bg-green-100 text-green-800 text-xs font-black rounded-2xl border border-green-200 flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              Proposta Aprovada
            </div>
          ) : (
            <button 
              onClick={() => setShowApprovalModal(true)} 
              className="px-5 py-2 bg-[#00a884] hover:bg-[#008f6f] text-white text-xs font-black rounded-2xl shadow-md transition-all flex items-center gap-1.5"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
              Aprovar e Assinar
            </button>
          )}
        </div>
      </div>

      {/* Conteúdo Otimizado para Folha A4 exata (794px x 1123px) */}
      <div className="flex justify-center w-full">
        <div 
          id="pdf-content" 
          className="relative w-[794px] min-h-[1123px] bg-[#ffffff] text-[#111827] p-[40px] shadow-xl print:shadow-none border border-neutral-200/60 print:border-none rounded-none flex flex-col justify-between overflow-hidden"
        >
          {/* Marca d'água no fundo com a logo */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.035] z-0">
            <img src="/logo.jpg" className="w-[90%] max-w-[620px] object-contain" alt="Click Marido Marca d'água" />
          </div>

          <div className="relative z-10 flex flex-col justify-between h-full w-full">
            <div>
              {/* Header do Documento */}
              <div className="border-b border-neutral-100 pb-6 mb-8">
                <div className="flex justify-between items-start">
                  <div className="flex items-start gap-4">
                    <img src="/logo.jpg" className="h-24 w-auto object-contain flex-shrink-0 mt-1" alt="Click Marido Logo" />
                    <div className="space-y-1.5 pt-1">
                      <p className="text-xl font-extrabold text-neutral-800 font-title tracking-tight">Click Marido Reparos Residenciais</p>
                      <p className="text-[11px] text-neutral-500 font-medium">CNPJ: 62.756.795/0001-10</p>
                      <p className="text-[11px] text-neutral-500 font-medium whitespace-nowrap">Rua Mônaco, N.81 - Fortaleza Alta - CEP 89058-044 - Blumenau/SC</p>
                      <p className="text-[11px] text-neutral-500 font-medium flex items-center gap-1.5">
                        <svg className="w-3.5 h-3.5 text-green-600 inline" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-1.564-.783-2.67-1.428-3.69-2.934-.207-.306.208-.282.64-.135.15-.15.347-.404.518-.606.173-.199.231-.347.33-.578.1-.23.05-.433-.025-.582-.075-.15-.67-1.616-.918-2.214-.242-.58-.487-.502-.67-.512-.172-.01-.371-.01-.57-.01-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                          <path d="M12 0C5.373 0 0 5.373 0 12c0 2.124.553 4.12 1.517 5.86L.231 23.769l6.05-1.587A11.93 11.93 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.984c-1.802 0-3.513-.464-5.02-1.346l-.36-.213-3.731.98.995-3.639-.234-.373A9.948 9.948 0 012.016 12c0-5.514 4.486-10 10-10s10 4.486 10 10-4.486 10-10 10z"/>
                        </svg>
                        (47) 99784-6229 - José Carlos
                      </p>
                    </div>
                  </div>
                  <div className="text-right space-y-1 flex-shrink-0 ml-4">
                    <h2 className="text-sm font-black font-title text-neutral-400 uppercase tracking-widest text-xs">Orçamento / Proposta</h2>
                    <div className="inline-block bg-purple-50 text-purple-700 px-3 py-1 rounded-xl text-lg font-black font-title">
                      {quote.number || quote.id?.slice(0, 8).toUpperCase()}
                    </div>
                    <p className="text-[9px] text-neutral-400 font-medium">Gerado em {formattedCreatedAt}</p>
                  </div>
                </div>
              </div>

              {/* Dados Principais (Grid 2 colunas) */}
              <div className="grid grid-cols-2 gap-6 mb-8">
                <div className="bg-[#fafafa] p-5 rounded-2xl border border-neutral-100 space-y-2.5">
                  <h3 className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider font-title">Cliente</h3>
                  <p className="text-sm font-extrabold text-[#1f2937] leading-tight">{customerName}</p>
                  <div className="text-xs text-neutral-600 space-y-1">
                    <p className="flex items-center gap-1.5"><span className="font-semibold text-neutral-400">Tel:</span> {customerPhone}</p>
                    <p className="flex items-center gap-1.5"><span className="font-semibold text-neutral-400">E-mail:</span> {customerEmail}</p>
                  </div>
                </div>
                <div className="bg-[#fafafa] p-5 rounded-2xl border border-neutral-100 space-y-2.5">
                  <h3 className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider font-title">Condições Comerciais</h3>
                  <div className="text-xs text-neutral-600 space-y-1.5">
                    <p className="flex items-start gap-1.5"><span className="font-semibold text-neutral-400 whitespace-nowrap">Validade da Proposta:</span> <span className="text-neutral-700 font-semibold">{validUntilDate}</span></p>
                    <p className="flex items-start gap-1.5"><span className="font-semibold text-neutral-400 whitespace-nowrap">Prazo de Execução:</span> <span className="text-neutral-700 font-semibold">{quote.executionDeadline || 'Conforme agendamento'}</span></p>
                    <div className="flex flex-col gap-0.5 mt-1">
                      <span className="font-semibold text-neutral-400">Formas de Pagamento Aceito:</span> 
                      <span className="text-neutral-700 font-semibold leading-snug break-words">
                        {quote.paymentMethods || 'PIX / Dinheiro / Cartão de Crédito'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Observações / Descrição Inicial */}
              {getNotesText(quote.notes) && (
                <div className="mb-8">
                  <h3 className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider font-title mb-2">Escopo dos Serviços / Observações</h3>
                  <div 
                    className="bg-[#fafafa] p-4 rounded-2xl border-l-4 border-purple-500 text-xs text-[#374151] leading-relaxed font-medium whitespace-pre-wrap rich-text-content"
                    dangerouslySetInnerHTML={{ __html: getNotesText(quote.notes) }}
                  />
                </div>
              )}

              {/* Selo e Informação de Garantia Assegurada */}
              <div className="flex items-center gap-4 bg-[#fdf4ff] border border-[#f3e8ff] p-4 rounded-2xl mb-8">
                <div className="w-10 h-10 rounded-full bg-[#f3e8ff] flex items-center justify-center text-lg flex-shrink-0">🛡️</div>
                <div>
                  <h4 className="text-xs font-bold text-[#3b0764] uppercase tracking-wide font-title">Garantia Click Marido</h4>
                  <p className="text-[10px] text-[#6b21a8] leading-normal font-medium">
                    Todo serviço contratado conta com a nossa <strong>Garantia de 90 dias</strong>, garantindo sua total tranquilidade contra falhas de material ou mão de obra.
                  </p>
                </div>
              </div>

              {/* Tabela de Serviços e Peças */}
              <div className="mb-8">
                <h3 className="text-[10px] font-bold text-[#9ca3af] uppercase tracking-wider font-title mb-3">Serviços Propostos</h3>
                <div className="border border-[#e5e7eb] rounded-2xl overflow-hidden shadow-xs">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-[#6b21a8] text-[#ffffff] font-bold font-title text-[10px]">
                        <th className="p-3 pl-4 w-[15%]">SKU</th>
                        <th className="p-3 w-[25%]">Item</th>
                        <th className="p-3 w-[30%]">Descrição</th>
                        <th className="p-3 text-center w-[8%]">Qtd</th>
                        <th className="p-3 text-right w-[12%]">Unitário</th>
                        <th className="p-3 text-right pr-4 w-[15%]">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#f3f4f6]">
                      {items.map((item: any, idx: number) => {
                        const itemName = item.product?.name || item.name || item.description || 'Item sem nome';
                        const itemSku = item.product?.sku || item.sku || 'S/N';
                        const itemDesc = item.product?.description || item.notes || '';
                        const itemPrice = Number(item.unitPrice || item.unit_price || item.price || 0);
                        const itemQty = Number(item.quantity || 1);
                        const sub = itemPrice * itemQty;

                        return (
                          <tr key={`quote-item-${idx}`} className="bg-[#ffffff] text-[11px]">
                            <td className="p-3 pl-4 font-mono text-neutral-500 uppercase tracking-tight">{itemSku}</td>
                            <td className="p-3 font-semibold text-[#1f2937]">{itemName}</td>
                            <td className="p-3 text-neutral-500 font-medium whitespace-pre-wrap">{itemDesc}</td>
                            <td className="p-3 text-center text-[#4b5563] font-medium">{itemQty}</td>
                            <td className="p-3 text-right text-[#4b5563] font-medium">R$ {itemPrice.toFixed(2)}</td>
                            <td className="p-3 text-right pr-4 font-bold text-[#1f2937] whitespace-nowrap">R$ {sub.toFixed(2)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Resumo Financeiro */}
              <div className="flex justify-end mb-8">
                <div className="w-[380px] space-y-2 bg-[#f9fafb] p-5 rounded-2xl border border-[#f3f4f6] text-xs">
                  {discountPercentage > 0 && (
                    <div className="flex justify-between text-[#6b7280] font-medium">
                      <span>Desconto ({discountPercentage}%):</span>
                      <span>- R$ {Number(discountAmount || 0).toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm font-black border-t border-[#e5e7eb] pt-3 text-[#1f2937] font-title">
                    <span>Subtotal / Valor a Vista:</span>
                    <span className="text-[#9333ea] text-sm">R$ {Number(totalAmount || 0).toFixed(2)}</span>
                  </div>

                  {/* Tabela de Parcelamento */}
                  <div className="mt-4 pt-3 border-t border-[#e5e7eb]">
                    <h4 className="text-[10px] font-bold text-[#6b7280] uppercase tracking-wider mb-2 font-title">
                      Simulação Parcelamento - Cartão de Crédito
                    </h4>
                    <table className="w-full text-[10px]">
                      <thead>
                        <tr className="text-[#9ca3af] font-medium">
                          <th className="text-left py-1">Parcelas</th>
                          <th className="text-center py-1">Taxa</th>
                          <th className="text-right py-1">Valor Parcela</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          { n: 1, fee: 3.09 },
                          { n: 2, fee: 9.64 },
                          { n: 3, fee: 11.23 },
                          { n: 4, fee: 11.36 },
                          { n: 5, fee: 14.31 },
                          { n: 6, fee: 14.32 },
                          { n: 7, fee: 16.72 },
                          { n: 8, fee: 16.73 },
                          { n: 9, fee: 19.69 },
                          { n: 10, fee: 20.65 },
                        ].map(({ n, fee }) => {
                          const totalWithFee = totalAmount * (1 + fee / 100);
                          const installmentValue = totalWithFee / n;
                          return (
                            <tr key={n} className="border-t border-[#f3f4f6]">
                              <td className="py-1 font-semibold text-[#374151]">{n}x</td>
                              <td className="py-1 text-center text-[#9ca3af]">{fee}%</td>
                              <td className="py-1 text-right font-medium text-[#1f2937]">
                                R$ {installmentValue.toFixed(2)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>

            {/* Rodapé da Proposta */}
            <div>
              {/* Termos e Garantias */}
              <div className="bg-[#f9fafb] p-4.5 rounded-2xl border border-[#f3f4f6] text-[10px] text-[#6b7280] leading-relaxed mb-8 font-medium">
                <h4 className="font-bold text-[#374151] uppercase tracking-wider mb-1 font-title">Garantia e Termos de Contratação</h4>
                1. Esta proposta comercial é válida por 15 dias a contar da data de emissão.
                <br />
                2. Todos os serviços executados possuem a garantia estabelecida de 90 dias a contar da conclusão, cobrindo exclusivamente vícios ou defeitos do serviço prestado (CDC art. 26).
                <br />
                3. A aprovação do orçamento pode ser realizada digitalmente pelo link enviado ao cliente ou mediante assinatura deste termo.
              </div>

              {/* Assinatura de Aceite */}
              <div className="border-t border-dashed border-[#e5e7eb] pt-8 flex justify-between items-center text-center">
                <div className="w-[45%] border-t border-[#d1d5db] pt-2.5 text-[10px] text-[#9ca3af] font-semibold uppercase tracking-wider font-title">
                  Assinatura do Técnico / Emissor
                </div>
                <div className="w-[45%] border-t border-[#d1d5db] pt-2.5 text-[10px] text-[#9ca3af] font-semibold uppercase tracking-wider font-title flex flex-col items-center">
                  {(quote.status === 'aprovado' || quote.status === 'aceito') && quote.signatureImage ? (
                    <div className="mt-2 text-center text-xs text-neutral-800">
                      <img src={quote.signatureImage} alt="Assinatura" className="h-16 object-contain mx-auto border border-neutral-200 rounded mb-1" />
                      <p>Assinado digitalmente</p>
                      <p className="font-bold">{quote.approvedBy}</p>
                      <p className="text-[10px] text-neutral-500">{quote.approvedAt ? new Date(quote.approvedAt).toLocaleString('pt-BR') : ''}</p>
                    </div>
                  ) : (
                    "De Acordo do Cliente"
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Modal de Assinatura */}
      {showApprovalModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 print:hidden">
          <div className="bg-white dark:bg-neutral-900 rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl">
            <h3 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 mb-2 font-title">
              Assinatura Digital
            </h3>
            <p className="text-sm text-neutral-500 mb-6">
              Para aprovar a proposta <strong className="text-neutral-700 dark:text-neutral-300">#{quote.number || quote.id.slice(0, 8).toUpperCase()}</strong>, preencha os dados abaixo.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Nome Completo
                </label>
                <input
                  type="text"
                  value={signatureName}
                  onChange={(e) => setSignatureName(e.target.value)}
                  placeholder="Seu nome completo"
                  className="w-full px-4 py-3 bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Assinatura
                </label>
                <div className="border border-neutral-300 dark:border-neutral-700 rounded-xl bg-white overflow-hidden relative">
                  <canvas 
                    ref={canvasRef}
                    width={400}
                    height={150}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                    className="w-full touch-none cursor-crosshair"
                  />
                  <button 
                    onClick={clearSignature}
                    className="absolute top-2 right-2 text-xs bg-neutral-200 text-neutral-700 px-2 py-1 rounded hover:bg-neutral-300"
                  >
                    Limpar
                  </button>
                </div>
              </div>

              <label className="flex items-start gap-3 p-3 border border-neutral-200 dark:border-neutral-700 rounded-xl cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">
                <input
                  type="checkbox"
                  checked={signatureAgreed}
                  onChange={(e) => setSignatureAgreed(e.target.checked)}
                  className="mt-1 w-4 h-4 text-primary-600 border-neutral-300 rounded focus:ring-primary-500"
                />
                <span className="text-sm text-neutral-600 dark:text-neutral-400">
                  Declaro que li e concordo com os termos e condições comerciais desta proposta.
                </span>
              </label>
            </div>

            <div className="mt-8 flex gap-3">
              <button
                onClick={() => setShowApprovalModal(false)}
                disabled={approvalLoading}
                className="flex-1 py-3 px-4 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 font-bold rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleClientApproval}
                disabled={approvalLoading || !signatureName.trim() || !signatureAgreed}
                className="flex-1 py-3 px-4 bg-primary-600 hover:bg-primary-700 disabled:bg-primary-600/50 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                {approvalLoading ? (
                  <span className="animate-pulse">Aprovando...</span>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                    Assinar
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
