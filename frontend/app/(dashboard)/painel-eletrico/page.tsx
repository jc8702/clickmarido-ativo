'use client';

import React, { useState, useMemo } from 'react';
import { Plus, Trash2, Download, AlertCircle } from 'lucide-react';

// ============================================================================
// CONSTANTES E FUNÇÕES AUXILIARES
// ============================================================================

const NORMAS = {
  fatorDemanda: {
    residencial: 0.95,
    comercial: 0.75,
    industrial: 0.65,
  },
  curvas: {
    B: { descricao: 'Eletrônica sensível', sobrecarga: 1.13, curtocircuito: 10 },
    C: { descricao: 'Cargas resistivas/motor pequeno', sobrecarga: 1.45, curtocircuito: 10 },
  },
  tabelaCabos: {
    '10A': '1,5 mm²',
    '16A': '2,5 mm²',
    '20A': '2,5 mm²',
    '25A': '4 mm²',
    '32A': '6 mm²',
    '40A': '10 mm²',
    '50A': '16 mm²',
    '63A': '25 mm²',
  },
  dps: {
    classeII: { tensao: 275, corrente: 40 },
  },
};

function calcularAmperagem(potenciaW: number, tensaoV: number) {
  return potenciaW / tensaoV;
}

function dimensionarDisjuntor(amperagemCalculada: number, curva = 'B') {
  const opcoes = [10, 16, 20, 25, 32, 40, 50, 63];
  const selecionado = opcoes.find((a) => a >= amperagemCalculada);
  return { amperagem: selecionado || 63, curva };
}

function dimensionarCabo(amperagemDisjuntor: number) {
  const chave = `${amperagemDisjuntor}A` as keyof typeof NORMAS.tabelaCabos;
  return NORMAS.tabelaCabos[chave] || '25 mm²';
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export default function PainelEletricoPage() {
  const [entrada, setEntrada] = useState({
    tipo: 'trifasica',
    tensao: 220,
    potenciaMaxima: 15200,
  });

  const [cargas, setCargas] = useState([
    {
      id: 1,
      nome: 'Impressora',
      potencia: 600,
      tensao: 220,
      tipo: 'impressora',
      setor: 'Esquerda',
      curva: 'B',
      quantidade: 1,
    },
  ]);

  const [proximoId, setProximoId] = useState(2);

  // ========================================================================
  // CÁLCULOS PRINCIPAIS
  // ========================================================================

  const calculos = useMemo(() => {
    const fases = entrada.tipo === 'trifasica' ? ['R', 'S', 'T'] : entrada.tipo === 'bifasica' ? ['R', 'S'] : ['R'];

    const cargasExpandidas: Array<{
      id: string;
      nome: string;
      nomeDisplay: string;
      potencia: number;
      tensao: number;
      tipo: string;
      setor: string;
      curva: string;
      quantidade: number;
    }> = [];
    cargas.forEach((carga) => {
      for (let i = 0; i < carga.quantidade; i++) {
        cargasExpandidas.push({
          ...carga,
          id: `${carga.id}-${i}`,
          nomeDisplay: carga.quantidade > 1 ? `${carga.nome} ${i + 1}` : carga.nome,
        });
      }
    });

    const demandaSimultanea = cargasExpandidas.reduce((acc, c) => acc + c.potencia, 0) * 0.75;

    const circuitosPorFase: Record<string, typeof circuitos> = {};
    fases.forEach((f) => (circuitosPorFase[f] = []));

    const circuitos = cargasExpandidas.map((carga, idx) => {
      const fase = fases[idx % fases.length];
      const amperagem = calcularAmperagem(carga.potencia, carga.tensao);
      const disjuntor = dimensionarDisjuntor(amperagem, carga.curva);
      const cabo = dimensionarCabo(disjuntor.amperagem);

      const circuito = {
        id: carga.id,
        nome: carga.nomeDisplay,
        nomePai: carga.nome,
        potencia: carga.potencia,
        tensao: carga.tensao,
        amperagem: amperagem.toFixed(2),
        fase,
        disjuntor,
        cabo,
        setor: carga.setor,
      };

      circuitosPorFase[fase].push(circuito);
      return circuito;
    });

    const resumoPorFase: Record<string, { potencia: number; amperagem: string; circuitos: number }> = {};
    Object.entries(circuitosPorFase).forEach(([fase, circs]) => {
      const potencia = circs.reduce((acc, c) => acc + c.potencia, 0);
      const amperagem = circs.reduce((acc, c) => acc + parseFloat(c.amperagem), 0);
      resumoPorFase[fase] = { potencia, amperagem: amperagem.toFixed(2), circuitos: circs.length };
    });

    const bom = {
      entrada: {
        tipo: entrada.tipo,
        tensao: entrada.tensao,
        potenciaMaxima: entrada.potenciaMaxima,
        demandaSimultanea: demandaSimultanea.toFixed(0),
      },
      disjuntores: {
        geral: { amperagem: entrada.tipo === 'trifasica' ? 40 : 25, curva: 'C', polos: entrada.tipo === 'trifasica' ? 3 : 1 },
        circuitos: circuitos.map((c) => ({
          nome: c.nome,
          amperagem: c.disjuntor.amperagem,
          curva: c.disjuntor.curva,
          polos: 1,
        })),
      },
      dps: {
        quantidade: fases.length + 1,
        especificacao: '275V, 40kA, Classe II',
      },
      dr: {
        amperagem: entrada.tipo === 'trifasica' ? 40 : 25,
        sensibilidade: '30mA',
        polos: entrada.tipo === 'trifasica' ? 4 : 2,
      },
      cabos: {
        entrada: { bitola: '10 mm²', quantidade: entrada.tipo === 'trifasica' ? 4 : entrada.tipo === 'bifasica' ? 3 : 2 },
        circuitos: circuitos.map((c) => ({
          nome: c.nome,
          bitola: c.cabo,
          quantidade: 1,
        })),
      },
      quadro: {
        modulos: 24,
        trilhos: 2,
      },
    };

    const alertas: Array<{ nivel: string; mensagem: string }> = [];
    let cargaMaxima = 0;

    Object.values(resumoPorFase).forEach((resume) => {
      cargaMaxima = Math.max(cargaMaxima, parseFloat(resume.amperagem));
    });

    if (fases.length > 1) {
      const amperagens = Object.values(resumoPorFase).map((r) => parseFloat(r.amperagem));
      const desequilibrioFases = (Math.max(...amperagens) / Math.min(...amperagens) - 1) * 100;

      if (desequilibrioFases > 20) {
        alertas.push({
          nivel: 'aviso',
          mensagem: `Desequilíbrio de fases: ${desequilibrioFases.toFixed(1)}% (recomendado < 20%)`,
        });
      }
    }

    if (demandaSimultanea > entrada.potenciaMaxima * 0.9) {
      alertas.push({
        nivel: 'crítico',
        mensagem: `Demanda simultânea (${demandaSimultanea.toFixed(0)}W) > 90% da capacidade (${entrada.potenciaMaxima}W)`,
      });
    }

    if (cargaMaxima > 40) {
      alertas.push({
        nivel: 'aviso',
        mensagem: `Carga máxima por fase > 40A: considere aumentar seção dos cabos de entrada.`,
      });
    }

    if (circuitos.length > 12) {
      alertas.push({
        nivel: 'aviso',
        mensagem: `Total de circuitos (${circuitos.length}) > 12 módulos disponíveis. Será necessário painel maior ou expansão.`,
      });
    }

    return { circuitos, resumoPorFase, bom, alertas, fases, totalCircuitos: circuitos.length };
  }, [entrada, cargas]);

  // ========================================================================
  // HANDLERS
  // ========================================================================

  const adicionarCarga = () => {
    setCargas([
      ...cargas,
      {
        id: proximoId,
        nome: `Carga ${proximoId}`,
        potencia: 600,
        tensao: 220,
        tipo: 'equipamento',
        setor: 'Centro',
        curva: 'B',
        quantidade: 1,
      },
    ]);
    setProximoId(proximoId + 1);
  };

  const removerCarga = (id: number) => {
    setCargas(cargas.filter((c) => c.id !== id));
  };

  const atualizarCarga = (id: number, campo: string, valor: string | number) => {
    setCargas(cargas.map((c) => (c.id === id ? { ...c, [campo]: valor } : c)));
  };

  const exportarJSON = () => {
    const dados = {
      timestamp: new Date().toISOString(),
      entrada: calculos.bom.entrada,
      circuitos: calculos.circuitos,
      resumoPorFase: calculos.resumoPorFase,
      bom: calculos.bom,
      alertas: calculos.alertas,
    };
    const blob = new Blob([JSON.stringify(dados, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `painel-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  // ========================================================================
  // RENDER SVG DO PAINEL - VERSÃO COM LEGIBILIDADE MELHORADA
  // ========================================================================

  const renderPainel = () => {
    const width = 1200;
    const height = 1050;
    const moduloWidth = 40;
    const moduloHeight = 55;

    // Layout Y positions - mais espaçamento entre seções
    const secDiagramaY = 0;
    const secDiagramaH = 340;
    const secTrilhoY = secDiagramaY + secDiagramaH + 60;
    const secTrilhoH = 220;
    const secLegendaY = secTrilhoY + secTrilhoH + 40;
    const secLegendaH = 100;
    const secSetoresY = secLegendaY + secLegendaH + 40;

    const coresFios: Record<string, string> = {
      R: '#000000',
      S: '#8B4513',
      T: '#CC0000',
      N: '#0055DD',
      PE: '#009933',
    };

    // Posições X das fases - mais espaçadas
    const faseX: Record<string, number> = { R: 50, S: 100, T: 150 };

    // Agrupar circuitos por setor
    const circuitosPorSetor: Record<string, typeof calculos.circuitos> = {};
    calculos.circuitos.forEach((c) => {
      if (!circuitosPorSetor[c.setor]) {
        circuitosPorSetor[c.setor] = [];
      }
      circuitosPorSetor[c.setor].push(c);
    });

    return (
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ background: '#FAFAFA' }}>
        {/* Fundo claro com borda */}
        <rect x="0" y="0" width={width} height={height} fill="#FAFAFA" rx="8" />

        {/* ================================================================== */}
        {/* SEÇÃO 1: DIAGRAMA UNIFILAR */}
        {/* ================================================================== */}
        <g>
          <rect x="20" y="10" width="300" height="32" fill="#E8EDF2" rx="4" />
          <text x="30" y="32" fontSize="15" fontWeight="bold" fill="#1A2332">
            ⚡ DIAGRAMA UNIFILAR
          </text>

          {/* Fonte/Entrada */}
          <circle cx="100" cy="80" r="12" fill="none" stroke="#333" strokeWidth="2.5" />
          <circle cx="100" cy="80" r="4" fill="#333" />
          <text x="120" y="84" fontSize="13" fontWeight="600" fill="#1A2332">
            {entrada.tipo === 'trifasica' ? 'TRIFÁSICA' : entrada.tipo === 'bifasica' ? 'BIFÁSICA' : 'MONOFÁSICA'} {entrada.tensao}V
          </text>

          {/* Linha de alimentação principal */}
          <line x1="100" y1="92" x2="100" y2="120" stroke="#333" strokeWidth="3" />

          {/* Fios das fases */}
          {calculos.fases.map((fase) => (
            <g key={`fase-${fase}`}>
              <line
                x1={faseX[fase]}
                y1="120"
                x2={faseX[fase]}
                y2="200"
                stroke={coresFios[fase]}
                strokeWidth="4"
              />
            </g>
          ))}

          {/* Fio Neutro */}
          <line x1="200" y1="120" x2="200" y2="200" stroke={coresFios['N']} strokeWidth="4" />
          {/* Fio Terra */}
          <line x1="250" y1="120" x2="250" y2="200" stroke={coresFios['PE']} strokeWidth="4" strokeDasharray="8,4" />

          {/* Labels das fases - abaixo dos fios, bem espaçados */}
          {calculos.fases.map((fase) => (
            <g key={`label-${fase}`}>
              <rect x={faseX[fase] - 22} y="210" width="44" height="22" fill={coresFios[fase]} rx="3" />
              <text x={faseX[fase]} y="226" fontSize="12" fontWeight="bold" fill="#FFFFFF" textAnchor="middle">
                {fase}
              </text>
              <text x={faseX[fase]} y="248" fontSize="10" fill="#555" textAnchor="middle">
                10 mm²
              </text>
            </g>
          ))}

          {/* Label Neutro */}
          <rect x="178" y="210" width="44" height="22" fill={coresFios['N']} rx="3" />
          <text x="200" y="226" fontSize="11" fontWeight="bold" fill="#FFFFFF" textAnchor="middle">
            N
          </text>
          <text x="200" y="248" fontSize="10" fill="#555" textAnchor="middle">
            10 mm²
          </text>

          {/* Label Terra */}
          <rect x="228" y="210" width="44" height="22" fill={coresFios['PE']} rx="3" />
          <text x="250" y="226" fontSize="11" fontWeight="bold" fill="#FFFFFF" textAnchor="middle">
            PE
          </text>
          <text x="250" y="248" fontSize="10" fill="#555" textAnchor="middle">
            10 mm²
          </text>

          {/* Seção Proteções */}
          <rect x="30" y="265" width="280" height="70" fill="#FFF8E1" stroke="#F0C040" strokeWidth="1" rx="4" />
          <text x="40" y="283" fontSize="12" fontWeight="bold" fill="#8B6914">
            🛡️ PROTEÇÕES
          </text>
          <text x="40" y="300" fontSize="11" fill="#333">
            • Disjuntor Geral: {calculos.bom.disjuntores.geral.amperagem}A Curva {calculos.bom.disjuntores.geral.curva}
          </text>
          <text x="40" y="316" fontSize="11" fill="#333">
            • DPS: {calculos.bom.dps.especificacao}
          </text>
          <text x="40" y="332" fontSize="11" fill="#333">
            • DR: {calculos.bom.dr.amperagem}A / {calculos.bom.dr.sensibilidade}
          </text>
        </g>

        {/* ================================================================== */}
        {/* SEÇÃO 2: PAINEL DE DISTRIBUIÇÃO */}
        {/* ================================================================== */}
        <g>
          <rect x="380" y="10" width="400" height="32" fill="#E8EDF2" rx="4" />
          <text x="390" y="32" fontSize="15" fontWeight="bold" fill="#1A2332">
            🔲 PAINEL DE DISTRIBUIÇÃO
          </text>

          {/* Label ENTRADA */}
          <text x="380" y={secTrilhoY + 10} fontSize="11" fontWeight="bold" fill="#555">
            ENTRADA
          </text>

          {/* Trilho Superior (barra de entrada) */}
          <rect x="440" y={secTrilhoY} width={12 * moduloWidth + 10} height="30" fill="#D0D0D0" stroke="#888" strokeWidth="1" rx="3" />

          {/* Módulos Trilho Superior */}
          {[...Array(12)].map((_, i) => (
            <g key={`sup-${i}`}>
              <rect
                x={445 + i * moduloWidth}
                y={secTrilhoY + 3}
                width={moduloWidth - 4}
                height={moduloHeight - 20}
                fill={i === 0 ? '#FFB84D' : i < 4 ? '#A8E6A3' : i < 8 ? '#A3D4F7' : '#E8E8E8'}
                stroke="#666"
                strokeWidth="1"
                rx="2"
              />
              <text x={445 + i * moduloWidth + (moduloWidth - 4) / 2} y={secTrilhoY + 22} fontSize="10" textAnchor="middle" fill="#333" fontWeight="600">
                {i + 1}
              </text>
            </g>
          ))}

          {/* Labels dos módulos superiores */}
          <text x="445" y={secTrilhoY - 10} fontSize="11" fontWeight="bold" fill="#C06000">Geral</text>
          <text x="570" y={secTrilhoY - 10} fontSize="11" fontWeight="bold" fill="#2E7D32">DPS</text>
          <text x="700" y={secTrilhoY - 10} fontSize="11" fontWeight="bold" fill="#1565C0">DR</text>

          {/* Label SAÍDA */}
          <text x="380" y={secTrilhoY + secTrilhoH - 25} fontSize="11" fontWeight="bold" fill="#555">
            SAÍDA
          </text>

          {/* Trilho Inferior (circuitos) */}
          <rect x="440" y={secTrilhoY + secTrilhoH - 50} width={12 * moduloWidth + 10} height="30" fill="#D0D0D0" stroke="#888" strokeWidth="1" rx="3" />

          {/* Módulos Trilho Inferior */}
          {calculos.circuitos.slice(0, 12).map((circuito, i) => (
            <g key={`inf-${circuito.id}`}>
              <rect
                x={445 + i * moduloWidth}
                y={secTrilhoY + secTrilhoH - 47}
                width={moduloWidth - 4}
                height={moduloHeight + 5}
                fill={circuito.disjuntor.curva === 'B' ? '#B3E5FC' : '#FFE082'}
                stroke="#666"
                strokeWidth="1"
                rx="2"
              />
              <text x={445 + i * moduloWidth + (moduloWidth - 4) / 2} y={secTrilhoY + secTrilhoH - 32} fontSize="11" textAnchor="middle" fill="#000" fontWeight="bold">
                {circuito.disjuntor.amperagem}A
              </text>
              <text x={445 + i * moduloWidth + (moduloWidth - 4) / 2} y={secTrilhoY + secTrilhoH - 18} fontSize="10" textAnchor="middle" fill="#333">
                {circuito.fase}
              </text>
              <text x={445 + i * moduloWidth + (moduloWidth - 4) / 2} y={secTrilhoY + secTrilhoH - 5} fontSize="9" textAnchor="middle" fill="#555" fontFamily="monospace">
                {circuito.cabo}
              </text>
            </g>
          ))}

          {/* Slots de reserva */}
          {[...Array(Math.max(0, 12 - calculos.circuitos.length))].map((_, i) => {
            const idx = calculos.circuitos.length + i;
            return (
              <g key={`reserva-${i}`}>
                <rect
                  x={445 + idx * moduloWidth}
                  y={secTrilhoY + secTrilhoH - 47}
                  width={moduloWidth - 4}
                  height={moduloHeight + 5}
                  fill="#F5F5F5"
                  stroke="#BBB"
                  strokeWidth="1"
                  strokeDasharray="4,3"
                  rx="2"
                />
                <text x={445 + idx * moduloWidth + (moduloWidth - 4) / 2} y={secTrilhoY + secTrilhoH - 25} fontSize="9" textAnchor="middle" fill="#CCC">
                  Reserva
                </text>
              </g>
            );
          })}
        </g>

        {/* ================================================================== */}
        {/* SEÇÃO 3: LEGENDA DE CORES */}
        {/* ================================================================== */}
        <g>
          <rect x="380" y={secLegendaY - 5} width="520" height={secLegendaH} fill="#F0F4F8" stroke="#CCC" strokeWidth="1" rx="6" />
          <text x="390" y={secLegendaY + 15} fontSize="12" fontWeight="bold" fill="#1A2332">
            🎨 CORES DOS FIOS (NBR 5410)
          </text>

          {/* Coluna 1 */}
          <line x1="400" y1={secLegendaY + 35} x2="430" y2={secLegendaY + 35} stroke={coresFios['R']} strokeWidth="4" />
          <text x="438" y={secLegendaY + 39} fontSize="11" fill="#333">Fase R — Preto (10mm²)</text>

          <line x1="400" y1={secLegendaY + 55} x2="430" y2={secLegendaY + 55} stroke={coresFios['T']} strokeWidth="4" />
          <text x="438" y={secLegendaY + 59} fontSize="11" fill="#333">Fase T — Vermelho (10mm²)</text>

          <line x1="400" y1={secLegendaY + 75} x2="430" y2={secLegendaY + 75} stroke={coresFios['PE']} strokeWidth="4" strokeDasharray="8,4" />
          <text x="438" y={secLegendaY + 79} fontSize="11" fill="#333">Terra — Verde (10mm²)</text>

          {/* Coluna 2 */}
          <line x1="650" y1={secLegendaY + 35} x2="680" y2={secLegendaY + 35} stroke={coresFios['S']} strokeWidth="4" />
          <text x="688" y={secLegendaY + 39} fontSize="11" fill="#333">Fase S — Marrom (10mm²)</text>

          <line x1="650" y1={secLegendaY + 55} x2="680" y2={secLegendaY + 55} stroke={coresFios['N']} strokeWidth="4" />
          <text x="688" y={secLegendaY + 59} fontSize="11" fill="#333">Neutro — Azul (10mm²)</text>

          <line x1="650" y1={secLegendaY + 75} x2="680" y2={secLegendaY + 75} stroke="#666" strokeWidth="3" />
          <text x="688" y={secLegendaY + 79} fontSize="11" fill="#333">Circuitos — Cinza (2,5mm²)</text>
        </g>

        {/* ================================================================== */}
        {/* SEÇÃO 4: DISTRIBUIÇÃO POR SETORES */}
        {/* ================================================================== */}
        <g>
          <rect x="20" y={secSetoresY} width="350" height="32" fill="#E8EDF2" rx="4" />
          <text x="30" y={secSetoresY + 22} fontSize="15" fontWeight="bold" fill="#1A2332">
            🏭 DISTRIBUIÇÃO POR SETORES
          </text>

          {Object.entries(circuitosPorSetor).map(([setor, circuitos], setorIdx) => {
            const cores = ['#FFEBEE', '#E3F2FD', '#E8F5E9', '#FFF8E1', '#F3E5F5'];
            const corBorda = ['#E53935', '#1E88E5', '#43A047', '#FDD835', '#8E24AA'];
            const boxWidth = 270;
            const boxX = 20 + setorIdx * (boxWidth + 20);

            return (
              <g key={`setor-${setor}`}>
                <rect
                  x={boxX}
                  y={secSetoresY + 45}
                  width={boxWidth}
                  height="150"
                  fill={cores[setorIdx % cores.length]}
                  stroke={corBorda[setorIdx % corBorda.length]}
                  strokeWidth="2"
                  rx="6"
                />
                <text x={boxX + 12} y={secSetoresY + 68} fontSize="14" fontWeight="bold" fill={corBorda[setorIdx % corBorda.length]}>
                  {setor}
                </text>
                <text x={boxX + 12} y={secSetoresY + 86} fontSize="11" fill="#555">
                  {circuitos.length} circuito{circuitos.length > 1 ? 's' : ''} • {circuitos.reduce((a, c) => a + c.potencia, 0).toLocaleString()}W
                </text>

                {circuitos.slice(0, 5).map((c, idx) => (
                  <text key={`${setor}-${idx}`} x={boxX + 12} y={secSetoresY + 105 + idx * 17} fontSize="10" fill="#333">
                    • {c.nome} — {c.fase}, {c.disjuntor.amperagem}A, {c.cabo}
                  </text>
                ))}

                {circuitos.length > 5 && (
                  <text x={boxX + 12} y={secSetoresY + 105 + 5 * 17} fontSize="10" fill="#888" fontStyle="italic">
                    ... e mais {circuitos.length - 5} circuitos
                  </text>
                )}
              </g>
            );
          })}
        </g>
      </svg>
    );
  };

  // ========================================================================
  // RENDER PRINCIPAL
  // ========================================================================

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">⚡ Dimensionador de Painéis Elétricos</h1>
          <p className="text-gray-400">
            Especifique cargas TUG/TUE e dimensione automaticamente disjuntores, DPS, cabos e layout (NBR 5410)
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* PAINEL ESQUERDO: ENTRADA */}
          <div className="lg:col-span-1">
            <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
              <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                ⚙️ Configuração da Entrada
              </h2>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">Tipo de Alimentação</label>
                <select
                  value={entrada.tipo}
                  onChange={(e) => setEntrada({ ...entrada, tipo: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm"
                >
                  <option value="monofasica">Monofásica (1F + N + T)</option>
                  <option value="bifasica">Bifásica (2F + N + T)</option>
                  <option value="trifasica">Trifásica (3F + N + T)</option>
                </select>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">Tensão (V)</label>
                <input
                  type="number"
                  value={entrada.tensao}
                  onChange={(e) => setEntrada({ ...entrada, tensao: parseInt(e.target.value) || 220 })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm"
                />
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-300 mb-2">Potência Máxima (W)</label>
                <input
                  type="number"
                  value={entrada.potenciaMaxima}
                  onChange={(e) => setEntrada({ ...entrada, potenciaMaxima: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm"
                />
              </div>

              <div className="bg-gray-900 border border-gray-700 rounded p-4 mb-6">
                <h3 className="text-sm font-semibold text-yellow-400 mb-3">Resumo da Entrada</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Demanda Simultânea:</span>
                    <span className="text-white font-mono">{calculos.bom.entrada.demandaSimultanea} W</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Capacidade:</span>
                    <span className="text-white font-mono">{entrada.potenciaMaxima} W</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Ocupação:</span>
                    <span
                      className={`font-mono ${
                        (Number(calculos.bom.entrada.demandaSimultanea) / entrada.potenciaMaxima) * 100 > 90
                          ? 'text-red-400'
                          : 'text-green-400'
                      }`}
                    >
                      {((Number(calculos.bom.entrada.demandaSimultanea) / entrada.potenciaMaxima) * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>

              {calculos.alertas.length > 0 && (
                <div className="space-y-2 mb-6">
                  {calculos.alertas.map((alerta, idx) => (
                    <div
                      key={idx}
                      className={`flex gap-2 p-3 rounded text-sm ${
                        alerta.nivel === 'crítico'
                          ? 'bg-red-900/30 border border-red-700 text-red-300'
                          : 'bg-yellow-900/30 border border-yellow-700 text-yellow-300'
                      }`}
                    >
                      <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
                      <span>{alerta.mensagem}</span>
                    </div>
                  ))}
                </div>
              )}

              <button
                onClick={exportarJSON}
                className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium text-sm flex items-center justify-center gap-2 transition"
              >
                <Download size={16} />
                Exportar JSON
              </button>
            </div>
          </div>

          {/* PAINEL DIREITO: SVG */}
          <div className="lg:col-span-2">
            <div className="bg-gray-800 rounded-lg border border-gray-700 p-6 mb-6">
              <h2 className="text-lg font-bold text-white mb-4">📋 Layout do Painel</h2>
              <div className="bg-white rounded-lg p-2 shadow-inner">{renderPainel()}</div>
            </div>

            <div className="bg-gray-800 rounded-lg border border-gray-700 p-6 mb-6">
              <h2 className="text-lg font-bold text-white mb-4">⚡ Circuitos</h2>

              <div className="space-y-3 mb-4 max-h-96 overflow-y-auto">
                {calculos.circuitos.map((circuito, idx) => (
                  <div key={circuito.id} className="bg-gray-900 border border-gray-700 rounded p-3 text-sm">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <div className="font-semibold text-white">{circuito.nome}</div>
                        <div className="text-gray-400">C{idx + 1} • Fase {circuito.fase}</div>
                      </div>
                      <button
                        onClick={() => {
                          const paiId = parseInt(circuito.id.split('-')[0]);
                          removerCarga(paiId);
                        }}
                        className="text-red-400 hover:text-red-300 transition"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-gray-300">
                      <div><span className="text-gray-500">Potência:</span> {circuito.potencia}W</div>
                      <div><span className="text-gray-500">Amperagem:</span> {circuito.amperagem}A</div>
                      <div><span className="text-gray-500">Disjuntor:</span> {circuito.disjuntor.amperagem}A ({circuito.disjuntor.curva})</div>
                      <div><span className="text-gray-500">Cabo:</span> {circuito.cabo}</div>
                    </div>
                  </div>
                ))}
              </div>

              {Object.keys(calculos.resumoPorFase).length > 0 && (
                <div className="bg-gray-900 border border-gray-700 rounded p-4 mb-4">
                  <h3 className="text-sm font-semibold text-yellow-400 mb-3">Resumo por Fase</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {Object.entries(calculos.resumoPorFase).map(([fase, resume]) => (
                      <div key={fase} className="p-2 bg-gray-800 rounded border border-gray-600">
                        <div className="text-xs text-gray-500 mb-1">Fase {fase}</div>
                        <div className="text-sm text-white font-mono">
                          <div>{resume.potencia} W</div>
                          <div className="text-gray-400">{resume.amperagem} A</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* CARGAS */}
        <div className="mt-6 bg-gray-800 rounded-lg border border-gray-700 p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-white">🔌 Cargas Conectadas</h2>
            <button
              onClick={adicionarCarga}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded font-medium text-sm flex items-center gap-2 transition"
            >
              <Plus size={16} />
              Adicionar Carga
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {cargas.map((carga) => (
              <div key={carga.id} className="bg-gray-900 border border-gray-700 rounded p-4">
                <div className="mb-3">
                  <input
                    type="text"
                    value={carga.nome}
                    onChange={(e) => atualizarCarga(carga.id, 'nome', e.target.value)}
                    className="w-full px-2 py-1 bg-gray-800 border border-gray-600 rounded text-white text-sm font-semibold mb-3"
                  />

                  <div className="space-y-2">
                    <div>
                      <label className="text-xs text-gray-400">Potência (W)</label>
                      <input type="number" value={carga.potencia} onChange={(e) => atualizarCarga(carga.id, 'potencia', parseInt(e.target.value) || 0)}
                        className="w-full px-2 py-1 bg-gray-800 border border-gray-600 rounded text-white text-sm" />
                    </div>
                    <div>
                      <label className="text-xs text-gray-400">Tensão (V)</label>
                      <input type="number" value={carga.tensao} onChange={(e) => atualizarCarga(carga.id, 'tensao', parseInt(e.target.value) || 220)}
                        className="w-full px-2 py-1 bg-gray-800 border border-gray-600 rounded text-white text-sm" />
                    </div>
                    <div>
                      <label className="text-xs text-gray-400">Tipo</label>
                      <select value={carga.tipo} onChange={(e) => atualizarCarga(carga.id, 'tipo', e.target.value)}
                        className="w-full px-2 py-1 bg-gray-800 border border-gray-600 rounded text-white text-sm">
                        <option value="impressora">Impressora 3D</option>
                        <option value="soprador">Soprador Térmico</option>
                        <option value="luz">Iluminação</option>
                        <option value="exaustor">Exaustor</option>
                        <option value="equipamento">Equipamento Geral</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-gray-400">Setor</label>
                      <input type="text" value={carga.setor} onChange={(e) => atualizarCarga(carga.id, 'setor', e.target.value)}
                        className="w-full px-2 py-1 bg-gray-800 border border-gray-600 rounded text-white text-sm" />
                    </div>
                    <div>
                      <label className="text-xs text-gray-400">Curva do Disjuntor</label>
                      <select value={carga.curva} onChange={(e) => atualizarCarga(carga.id, 'curva', e.target.value)}
                        className="w-full px-2 py-1 bg-gray-800 border border-gray-600 rounded text-white text-sm">
                        <option value="B">B - Eletrônica (sensível)</option>
                        <option value="C">C - Resistiva (motor, soprador)</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-gray-400">Quantidade</label>
                      <input type="number" min="1" max="100" value={carga.quantidade}
                        onChange={(e) => atualizarCarga(carga.id, 'quantidade', Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-full px-2 py-1 bg-gray-800 border border-gray-600 rounded text-white text-sm" />
                      {carga.quantidade > 1 && (
                        <div className="text-xs text-gray-500 mt-1">📊 {carga.quantidade} × {carga.potencia}W = {carga.quantidade * carga.potencia}W total</div>
                      )}
                    </div>
                  </div>
                </div>
                <button onClick={() => removerCarga(carga.id)}
                  className="w-full px-2 py-1 bg-red-900/50 hover:bg-red-900 text-red-300 rounded text-sm font-medium transition flex items-center justify-center gap-2">
                  <Trash2 size={14} /> Remover
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* BOM */}
        <div className="mt-6 bg-gray-800 rounded-lg border border-gray-700 p-6">
          <h2 className="text-lg font-bold text-white mb-4">📦 Lista de Materiais (BOM)</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-gray-900 border border-gray-700 rounded p-4">
              <h3 className="text-sm font-semibold text-yellow-400 mb-3">Disjuntores</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Geral (Tripolar):</span>
                  <span className="text-white font-mono">{calculos.bom.disjuntores.geral.amperagem}A</span>
                </div>
                {calculos.bom.disjuntores.circuitos.map((dj, idx) => (
                  <div key={idx} className="flex justify-between text-xs">
                    <span className="text-gray-400">C{idx + 1}:</span>
                    <span className="text-white font-mono">{dj.amperagem}A ({dj.curva})</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-gray-900 border border-gray-700 rounded p-4">
              <h3 className="text-sm font-semibold text-yellow-400 mb-3">Proteção de Surto (DPS)</h3>
              <div className="text-sm text-gray-300">
                <div className="flex justify-between mb-1">
                  <span className="text-gray-400">Quantidade:</span>
                  <span className="text-white font-mono">{calculos.bom.dps.quantidade}</span>
                </div>
                <div className="text-xs text-gray-500 mt-2">{calculos.bom.dps.especificacao}</div>
              </div>
            </div>
            <div className="bg-gray-900 border border-gray-700 rounded p-4">
              <h3 className="text-sm font-semibold text-yellow-400 mb-3">Interruptor DR</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Amperagem:</span>
                  <span className="text-white font-mono">{calculos.bom.dr.amperagem}A</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Sensibilidade:</span>
                  <span className="text-white font-mono">{calculos.bom.dr.sensibilidade}</span>
                </div>
              </div>
            </div>
            <div className="bg-gray-900 border border-gray-700 rounded p-4 md:col-span-2 lg:col-span-3">
              <h3 className="text-sm font-semibold text-yellow-400 mb-3">Cabeamento</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                <div>
                  <div className="text-gray-400">Entrada (Fase):</div>
                  <div className="text-white font-mono">{calculos.bom.cabos.entrada.bitola}</div>
                </div>
                {calculos.bom.cabos.circuitos.slice(0, 3).map((cabo, idx) => (
                  <div key={idx}>
                    <div className="text-gray-400 truncate">C{idx + 1}:</div>
                    <div className="text-white font-mono">{cabo.bitola}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
