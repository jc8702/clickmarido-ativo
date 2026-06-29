'use client';

import React, { useState, useEffect } from 'react';
import Button from '@/components/Button';
import { DollarSign } from 'lucide-react';
import toast from 'react-hot-toast';

interface LeadQualificationFormProps {
  lead: {
    id: string;
    priority?: string;
    estimatedValue?: number | null;
    status?: string;
    intention?: string | null;
    nextAction?: string | null;
    qualificationStage?: string;
    tags?: string | null;
    qualificationData?: any;
  };
  token: string;
  onSuccess: () => void;
}

const METHODOLOGY_FIELDS: Record<string, { labels: string[]; placeholders: string[] }> = {
  BANT: {
    labels: ['Budget (Orçamento)', 'Authority (Autoridade)', 'Need (Necessidade)', 'Timing (Urgência)'],
    placeholders: ['', '', '', ''],
  },
  CHAMP: {
    labels: ['Challenges (Desafios)', 'Authority (Autoridade)', 'Money (Dinheiro)', 'Prioritization (Prioridade)'],
    placeholders: ['', '', '', ''],
  },
  GPCT: {
    labels: ['Goals (Metas)', 'Plans (Planos)', 'Challenges (Desafios)', 'Timeline (Cronograma)'],
    placeholders: ['O que o cliente quer obter?', 'Quais soluções já tentadas?', 'Quais os obstáculos?', 'Quando deve estar pronto?'],
  },
  SPIN: {
    labels: ['Situation (Situação)', 'Problem (Problema)', 'Implication (Implicação)', 'Need-payoff (Necessidade)'],
    placeholders: ['Estado atual das instalações?', 'Insatisfações ou problemas?', 'Risco de não consertar?', 'Valor de resolver?'],
  },
};

const SELECT_OPTIONS: Record<string, { value: string; label: string }[]> = {
  budget: [
    { value: '', label: 'Selecione...' },
    { value: 'sim', label: 'Sim - Tem orçamento' },
    { value: 'em_analise', label: 'Em análise - Em aprovação' },
    { value: 'nao', label: 'Não - Sem orçamento' },
    { value: 'indefinido', label: 'Indefinido' },
  ],
  authority: [
    { value: '', label: 'Selecione...' },
    { value: 'decisor', label: 'Decisor - Decide a compra' },
    { value: 'influenciador', label: 'Influenciador - Influencia decisão' },
    { value: 'nao_identificado', label: 'Não identificado' },
  ],
  need: [
    { value: '', label: 'Selecione...' },
    { value: 'critico', label: 'Crítico - Precisa urgente' },
    { value: 'importante', label: 'Importante - Melhoria significativa' },
    { value: 'nice_to_have', label: 'Nice to have - Desejável' },
    { value: 'sem_necessidade', label: 'Sem necessidade' },
  ],
  timing: [
    { value: '', label: 'Selecione...' },
    { value: 'imediato', label: 'Imediato - 1-2 semanas' },
    { value: '1_3_meses', label: '1-3 meses' },
    { value: '3_6_meses', label: '3-6 meses' },
    { value: 'acima_6_meses', label: 'Acima de 6 meses' },
    { value: 'indefinido', label: 'Indefinido' },
  ],
  challenge: [
    { value: '', label: 'Selecione...' },
    { value: 'critico', label: 'Crítico - Dor principal' },
    { value: 'importante', label: 'Importante - Afeta operação' },
    { value: 'moderado', label: 'Moderado - Melhoria desejada' },
    { value: 'sem_desafio', label: 'Sem desafio identificado' },
  ],
  money: [
    { value: '', label: 'Selecione...' },
    { value: 'disponivel', label: 'Disponível - Verba alocada' },
    { value: 'aprovado', label: 'Aprovado - Orçamento liberado' },
    { value: 'em_analise', label: 'Em análise - Aguardando' },
    { value: 'sem_orcamento', label: 'Sem orçamento' },
  ],
  prioritization: [
    { value: '', label: 'Selecione...' },
    { value: 'urgente', label: 'Urgente - Precisa agora' },
    { value: 'alta', label: 'Alta - Importante' },
    { value: 'media', label: 'Média - Pode aguardar' },
    { value: 'baixa', label: 'Baixa - Quando possível' },
  ],
};

const BANT_SELECTS = ['budget', 'authority', 'need', 'timing'];
const CHAMP_SELECTS = ['challenge', 'authority', 'money', 'prioritization'];

export function LeadQualificationForm({ lead, token, onSuccess }: LeadQualificationFormProps) {
  const [editPriority, setEditPriority] = useState(lead.priority || 'MEDIA');
  const [editEstimatedValue, setEditEstimatedValue] = useState(lead.estimatedValue ? String(lead.estimatedValue) : '');
  const [editStatus, setEditStatus] = useState(lead.status || 'FRIO');
  const [editIntention, setEditIntention] = useState(lead.intention || '');
  const [editNextAction, setEditNextAction] = useState(lead.nextAction || '');
  const [editQualificationStage, setEditQualificationStage] = useState(lead.qualificationStage || 'SEM_VALIDACAO');
  const [editTags, setEditTags] = useState(lead.tags || '');
  const [selectedMethodology, setSelectedMethodology] = useState(lead.qualificationData?.methodology || 'BANT');
  const [methFields, setMethFields] = useState(['', '', '', '']);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const qData = lead.qualificationData || {};
    const method = qData.methodology || 'BANT';
    setSelectedMethodology(method);
    
    if (method === 'BANT') {
      setMethFields([qData.bantBudget || '', qData.bantAuthority || '', qData.bantNeed || '', qData.bantTiming || '']);
    } else if (method === 'CHAMP') {
      setMethFields([qData.champChallenges || '', qData.champAuthority || '', qData.champMoney || '', qData.champPrioritization || '']);
    } else if (method === 'GPCT') {
      setMethFields([qData.gpctGoals || '', qData.gpctPlans || '', qData.gpctChallenges || '', qData.gpctTimeline || '']);
    } else if (method === 'SPIN') {
      setMethFields([qData.spinSituation || '', qData.spinProblem || '', qData.spinImplication || '', qData.spinNeedPayoff || '']);
    }
  }, [lead]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const qData: any = { methodology: selectedMethodology };
    if (selectedMethodology === 'BANT') {
      qData.bantBudget = methFields[0];
      qData.bantAuthority = methFields[1];
      qData.bantNeed = methFields[2];
      qData.bantTiming = methFields[3];
    } else if (selectedMethodology === 'CHAMP') {
      qData.champChallenges = methFields[0];
      qData.champAuthority = methFields[1];
      qData.champMoney = methFields[2];
      qData.champPrioritization = methFields[3];
    } else if (selectedMethodology === 'GPCT') {
      qData.gpctGoals = methFields[0];
      qData.gpctPlans = methFields[1];
      qData.gpctChallenges = methFields[2];
      qData.gpctTimeline = methFields[3];
    } else if (selectedMethodology === 'SPIN') {
      qData.spinSituation = methFields[0];
      qData.spinProblem = methFields[1];
      qData.spinImplication = methFields[2];
      qData.spinNeedPayoff = methFields[3];
    }

    let calculatedScore = 30;
    if (editPriority === 'ALTA') calculatedScore += 30;
    else if (editPriority === 'URGENTE') calculatedScore += 35;
    if (editPriority === 'MEDIA') calculatedScore += 15;
    if (editStatus === 'URGENTE') calculatedScore += 30;
    if (editStatus === 'QUENTE') calculatedScore += 20;
    if (editStatus === 'MORNO') calculatedScore += 10;
    if (methFields[0].trim()) calculatedScore += 10;
    if (methFields[2].trim()) calculatedScore += 10;

    try {
      const res = await fetch(`/api/leads/${lead.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          priority: editPriority,
          estimatedValue: editEstimatedValue ? Number(editEstimatedValue) : null,
          status: editStatus,
          intention: editIntention || null,
          nextAction: editNextAction || null,
          qualificationStage: editQualificationStage || null,
          tags: editTags || null,
          qualificationData: qData,
          bantBudget: selectedMethodology === 'BANT' ? methFields[0] || null : null,
          bantAuthority: selectedMethodology === 'BANT' ? methFields[1] || null : null,
          bantNeed: selectedMethodology === 'BANT' ? methFields[2] || null : null,
          bantTiming: selectedMethodology === 'BANT' ? methFields[3] || null : null,
          champChallenge: selectedMethodology === 'CHAMP' ? methFields[0] || null : null,
          champMoney: selectedMethodology === 'CHAMP' ? methFields[2] || null : null,
          champPriority: selectedMethodology === 'CHAMP' ? methFields[3] || null : null,
          score: Math.min(100, calculatedScore),
        }),
      });

      if (!res.ok) throw new Error();
      toast.success('Qualificação salva com sucesso!');
      onSuccess();
    } catch (err) {
      console.error(err);
      toast.error('Erro ao salvar qualificação.');
    } finally {
      setSaving(false);
    }
  };

  const getSelectType = (index: number): string => {
    if (selectedMethodology === 'BANT') return BANT_SELECTS[index];
    if (selectedMethodology === 'CHAMP') return CHAMP_SELECTS[index];
    return '';
  };

  const methInfo = METHODOLOGY_FIELDS[selectedMethodology];

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Parâmetros Gerais */}
      <div className="grid grid-cols-2 gap-4 bg-neutral-50 dark:bg-neutral-950/20 p-4 border border-neutral-200/40 dark:border-neutral-800/40 rounded-xl">
        <h4 className="col-span-2 text-xs font-bold uppercase text-neutral-400 tracking-wider">Parâmetros de Classificação</h4>
        
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Prioridade</label>
          <select
            className="p-2 text-xs rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200"
            value={editPriority}
            onChange={(e) => setEditPriority(e.target.value)}
          >
            <option value="BAIXA">Baixa</option>
            <option value="MEDIA">Média</option>
            <option value="ALTA">Alta</option>
            <option value="URGENTE">Urgente</option>
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Valor Estimado (R$)</label>
          <input
            type="number"
            className="p-2 text-xs rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200 font-bold"
            placeholder="1500"
            value={editEstimatedValue}
            onChange={(e) => setEditEstimatedValue(e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Temperatura</label>
          <select
            className="p-2 text-xs rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200"
            value={editStatus}
            onChange={(e) => setEditStatus(e.target.value)}
          >
            <option value="FRIO">Frio</option>
            <option value="MORNO">Morno</option>
            <option value="QUENTE">Quente</option>
            <option value="URGENTE">Urgente</option>
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Nível de Intenção</label>
          <select
            className="p-2 text-xs rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200"
            value={editIntention}
            onChange={(e) => setEditIntention(e.target.value)}
          >
            <option value="">Não definida</option>
            <option value="PESQUISANDO">Pesquisando</option>
            <option value="COMPARANDO">Comparando opções</option>
            <option value="PRONTO_PARA_ORCAMENTO">Pronto para orçamento</option>
            <option value="PRONTO_PARA_FECHAMENTO">Pronto para fechamento</option>
            <option value="ACOMPANHAR_DEPOIS">Acompanhar depois</option>
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Próxima Ação</label>
          <select
            className="p-2 text-xs rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200 font-semibold"
            value={editNextAction}
            onChange={(e) => setEditNextAction(e.target.value)}
          >
            <option value="">Nenhuma</option>
            <option value="LIGAR">Ligar</option>
            <option value="RESPONDER_WHATSAPP">Responder WhatsApp</option>
            <option value="ENVIAR_PROPOSTA">Enviar proposta</option>
            <option value="AGENDAR_VISITA">Agendar visita</option>
            <option value="AGENDAR_REUNIAO">Agendar reunião</option>
            <option value="PEDIR_MAIS_INFORMACOES">Pedir informações</option>
            <option value="NUTRIR_LEAD">Nutrir lead</option>
            <option value="ENCAMINHAR_ORCAMENTO">Encaminhar para orçamento</option>
            <option value="DESCARTAR">Descartar</option>
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Estágio de Qualificação</label>
          <select
            className="p-2 text-xs rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200"
            value={editQualificationStage}
            onChange={(e) => setEditQualificationStage(e.target.value)}
          >
            <option value="SEM_VALIDACAO">Sem qualificação</option>
            <option value="EM_VALIDACAO">Em validação</option>
            <option value="PARCIALMENTE_QUALIFICADO">Parcialmente qualificado</option>
            <option value="QUALIFICADO">Qualificado</option>
            <option value="DESQUALIFICADO">Desqualificado</option>
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Tags (Separadas por vírgula)</label>
          <input
            type="text"
            className="p-2 text-xs rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200"
            placeholder="eletrica, urgente, residencial"
            value={editTags}
            onChange={(e) => setEditTags(e.target.value)}
          />
        </div>
      </div>

      {/* Metodologias de Vendas */}
      <div className="p-4 bg-neutral-50 dark:bg-neutral-950/20 border border-neutral-200/40 dark:border-neutral-800/40 rounded-xl space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold uppercase text-neutral-400 tracking-wider">Metodologia de Vendas</h4>
          <select
            className="p-1 text-xs rounded bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 font-bold"
            value={selectedMethodology}
            onChange={(e) => {
              setSelectedMethodology(e.target.value);
              setMethFields(['', '', '', '']);
            }}
          >
            <option value="BANT">BANT</option>
            <option value="CHAMP">CHAMP</option>
            <option value="GPCT">GPCT</option>
            <option value="SPIN">SPIN Selling</option>
          </select>
        </div>

        <div className="space-y-3">
          {methInfo.labels.map((label, idx) => {
            const selectType = getSelectType(idx);
            const options = selectType ? SELECT_OPTIONS[selectType] : null;
            
            return (
              <div key={idx} className="flex flex-col gap-1">
                <label className="text-[10px] font-bold uppercase text-neutral-400">
                  {idx === 0 && <DollarSign className="w-3 h-3 inline mr-1" />}
                  {label}
                </label>
                {options ? (
                  <select
                    className="p-2 text-xs rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200"
                    value={methFields[idx]}
                    onChange={(e) => {
                      const newFields = [...methFields];
                      newFields[idx] = e.target.value;
                      setMethFields(newFields);
                    }}
                  >
                    {options.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    className="p-2 text-xs rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-800"
                    placeholder={methInfo.placeholders[idx]}
                    value={methFields[idx]}
                    onChange={(e) => {
                      const newFields = [...methFields];
                      newFields[idx] = e.target.value;
                      setMethFields(newFields);
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-2 border-t border-neutral-100 dark:border-neutral-800">
        <Button
          type="submit"
          variant="primary"
          size="sm"
          className="font-bold px-6 shadow-md"
          isLoading={saving}
        >
          Salvar Qualificação
        </Button>
      </div>
    </form>
  );
}
