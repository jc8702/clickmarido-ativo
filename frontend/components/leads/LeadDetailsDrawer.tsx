'use client';

import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/Badge';
import { Card } from '@/components/Card';
import Button from '@/components/Button';
import { 
  X, 
  Calendar, 
  Phone, 
  Mail, 
  Clock, 
  User, 
  MessageSquare, 
  CheckCircle, 
  AlertTriangle,
  History,
  TrendingUp,
  ExternalLink,
  ChevronRight,
  ShieldAlert,
  Zap,
  Target,
  DollarSign,
  Tag,
  Award,
  XCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

interface UserOption {
  id: string;
  name: string;
}

interface Lead {
  id: string;
  name: string;
  phone?: string | null;
  email?: string | null;
  status: string; // FRIO, MORNO, QUENTE, URGENTE
  funnelStage: string;
  responsavelId?: string | null;
  customerId?: string | null;
  quotationId?: string | null;
  slaBreachCount: number;
  createdAt: string;
  updatedAt: string;
  source?: {
    channel: string;
    campaign?: string | null;
  } | null;
  responsavel?: {
    name: string;
  } | null;

  // Novos campos estruturais do CRM avançado
  priority: string;
  estimatedValue?: number | null;
  qualificationStage: string;
  intention?: string | null;
  nextAction?: string | null;
  prioritizationMethod?: string | null;
  qualificationData?: any | null;
  tags?: string | null;
  score: number;
}

interface LeadEvent {
  id: string;
  type: string;
  oldValue?: string | null;
  newValue?: string | null;
  notes?: string | null;
  createdAt: string;
  user?: {
    name: string;
  } | null;
}

interface LeadDetailsDrawerProps {
  leadId: string | null;
  onClose: () => void;
  onLeadUpdated: () => void;
  token: string;
}

const STAGES_LABELS: Record<string, string> = {
  NOVO_LEAD: 'Novo Lead',
  EM_TRIAGEM: 'Em Triagem',
  QUALIFICADO: 'Qualificado',
  EM_FOLLOWUP: 'Em Follow-up',
  AGENDADO: 'Agendado',
  ENCAMINHADO_ORCAMENTO: 'Encaminhado',
  DESCARTADO: 'Descartado',
};

const STAGE_OPTIONS = Object.entries(STAGES_LABELS).map(([id, label]) => ({ id, label }));

export function LeadDetailsDrawer({ leadId, onClose, onLeadUpdated, token }: LeadDetailsDrawerProps) {
  const [lead, setLead] = useState<Lead | null>(null);
  const [events, setEvents] = useState<LeadEvent[]>([]);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'timeline' | 'followup' | 'schedule' | 'qualification'>('timeline');
  
  // States para formulários
  const [followupText, setFollowupText] = useState('');
  const [submittingFollowup, setSubmittingFollowup] = useState(false);
  
  const [appointmentDate, setAppointmentDate] = useState('');
  const [appointmentNotes, setAppointmentNotes] = useState('');
  const [submittingAppointment, setSubmittingAppointment] = useState(false);

  const [qualifying, setQualifying] = useState(false);

  // Modal de descarte
  const [showLossModal, setShowLossModal] = useState(false);
  const [targetStage, setTargetStage] = useState<string | null>(null);
  const [lossReason, setLossReason] = useState('sem orçamento');
  const [lossNotes, setLossNotes] = useState('');

  // States para a aba de Qualificação Avançada
  const [editPriority, setEditPriority] = useState('MEDIA');
  const [editEstimatedValue, setEditEstimatedValue] = useState('');
  const [editStatus, setEditStatus] = useState('FRIO');
  const [editIntention, setEditIntention] = useState('');
  const [editNextAction, setEditNextAction] = useState('');
  const [editPrioritizationMethod, setEditPrioritizationMethod] = useState('');
  const [editTags, setEditTags] = useState('');
  const [selectedMethodology, setSelectedMethodology] = useState('BANT');
  
  // Campos das metodologias (BANT, CHAMP, GPCT, SPIN)
  const [methField1, setMethField1] = useState(''); // Budget / Challenges / Goals / Situation
  const [methField2, setMethField2] = useState(''); // Authority / Authority / Plans / Problem
  const [methField3, setMethField3] = useState(''); // Need / Money / Challenges / Implication
  const [methField4, setMethField4] = useState(''); // Timing / Prioritization / Timeline / Need-payoff
  const [savingQualification, setSavingQualification] = useState(false);

  // Carregar dados do lead
  const fetchLeadData = async () => {
    if (!leadId) return;
    setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      
      const [leadRes, eventsRes] = await Promise.all([
        fetch(`/api/leads/${leadId}`, { headers }),
        fetch(`/api/leads/${leadId}/events`, { headers })
      ]);

      if (leadRes.ok) {
        const leadData = await leadRes.json();
        setLead(leadData);
        
        // Inicializar os campos de edição
        setEditPriority(leadData.priority || 'MEDIA');
        setEditEstimatedValue(leadData.estimatedValue ? String(leadData.estimatedValue) : '');
        setEditStatus(leadData.status || 'FRIO');
        setEditIntention(leadData.intention || '');
        setEditNextAction(leadData.nextAction || '');
        setEditPrioritizationMethod(leadData.prioritizationMethod || '');
        setEditTags(leadData.tags || '');
        
        // Inicializar metodologia
        const qData = leadData.qualificationData || {};
        const method = qData.methodology || 'BANT';
        setSelectedMethodology(method);
        
        if (method === 'BANT') {
          setMethField1(qData.bantBudget || '');
          setMethField2(qData.bantAuthority || '');
          setMethField3(qData.bantNeed || '');
          setMethField4(qData.bantTiming || '');
        } else if (method === 'CHAMP') {
          setMethField1(qData.champChallenges || '');
          setMethField2(qData.champAuthority || '');
          setMethField3(qData.champMoney || '');
          setMethField4(qData.champPrioritization || '');
        } else if (method === 'GPCT') {
          setMethField1(qData.gpctGoals || '');
          setMethField2(qData.gpctPlans || '');
          setMethField3(qData.gpctChallenges || '');
          setMethField4(qData.gpctTimeline || '');
        } else if (method === 'SPIN') {
          setMethField1(qData.spinSituation || '');
          setMethField2(qData.spinProblem || '');
          setMethField3(qData.spinImplication || '');
          setMethField4(qData.spinNeedPayoff || '');
        }
      }
      if (eventsRes.ok) {
        const eventsData = await eventsRes.json();
        setEvents(eventsData);
      }
    } catch (error) {
      console.error('Erro ao buscar detalhes do lead:', error);
      toast.error('Erro ao carregar dados do lead.');
    } finally {
      setLoading(false);
    }
  };

  // Carregar usuários para responsável
  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
    }
  };

  useEffect(() => {
    if (leadId) {
      fetchLeadData();
      fetchUsers();
      setActiveTab('timeline');
    } else {
      setLead(null);
      setEvents([]);
    }
  }, [leadId]);

  // Atualizar etapa, responsável ou outros campos do lead
  const handleUpdateLeadField = async (fields: any) => {
    try {
      const res = await fetch(`/api/leads/${leadId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(fields),
      });

      if (!res.ok) throw new Error();

      toast.success('Lead atualizado!');
      fetchLeadData();
      onLeadUpdated();
    } catch (error) {
      console.error(error);
      toast.error('Erro ao atualizar o lead.');
    }
  };

  // Tratar alteração de etapa com modal de descarte se for DESCARTADO
  const handleStageChange = (newStage: string) => {
    if (newStage === 'DESCARTADO') {
      setTargetStage(newStage);
      setShowLossModal(true);
    } else {
      handleUpdateLeadField({ funnelStage: newStage });
    }
  };

  // Confirmar perda/descarte do lead
  const handleConfirmLoss = async () => {
    if (!targetStage) return;
    try {
      await handleUpdateLeadField({
        funnelStage: targetStage,
        lossReason,
        lossNotes
      });
      setShowLossModal(false);
      setLossNotes('');
    } catch (error) {
      console.error(error);
    }
  };

  // Salvar qualificação avançada e metodologias
  const handleSaveQualification = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingQualification(true);

    const qData: any = { methodology: selectedMethodology };
    if (selectedMethodology === 'BANT') {
      qData.bantBudget = methField1;
      qData.bantAuthority = methField2;
      qData.bantNeed = methField3;
      qData.bantTiming = methField4;
    } else if (selectedMethodology === 'CHAMP') {
      qData.champChallenges = methField1;
      qData.champAuthority = methField2;
      qData.champMoney = methField3;
      qData.champPrioritization = methField4;
    } else if (selectedMethodology === 'GPCT') {
      qData.gpctGoals = methField1;
      qData.gpctPlans = methField2;
      qData.gpctChallenges = methField3;
      qData.gpctTimeline = methField4;
    } else if (selectedMethodology === 'SPIN') {
      qData.spinSituation = methField1;
      qData.spinProblem = methField2;
      qData.spinImplication = methField3;
      qData.spinNeedPayoff = methField4;
    }

    // Calcular score comercial inicial com base em respostas de qualificação
    let calculatedScore = 30; // base
    if (editPriority === 'ALTA') calculatedScore += 30;
    if (editPriority === 'MEDIA') calculatedScore += 15;
    if (editStatus === 'URGENTE') calculatedScore += 30;
    if (editStatus === 'QUENTE') calculatedScore += 20;
    if (editStatus === 'MORNO') calculatedScore += 10;
    if (methField1.trim()) calculatedScore += 10; // respondeu critério 1
    if (methField3.trim()) calculatedScore += 10; // respondeu critério 3

    try {
      await handleUpdateLeadField({
        priority: editPriority,
        estimatedValue: editEstimatedValue ? Number(editEstimatedValue) : null,
        status: editStatus,
        intention: editIntention || null,
        nextAction: editNextAction || null,
        prioritizationMethod: editPrioritizationMethod || null,
        tags: editTags || null,
        qualificationData: qData,
        score: Math.min(100, calculatedScore)
      });
    } catch (err) {
      console.error(err);
    } finally {
      setSavingQualification(false);
    }
  };

  // Submeter follow-up
  const handleSaveFollowup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!followupText.trim()) return;

    setSubmittingFollowup(true);
    try {
      const res = await fetch(`/api/leads/${leadId}/followup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ notes: followupText }),
      });

      if (res.ok) {
        toast.success('Interação registrada!');
        setFollowupText('');
        fetchLeadData();
      } else {
        throw new Error();
      }
    } catch (error) {
      console.error(error);
      toast.error('Erro ao salvar follow-up.');
    } finally {
      setSubmittingFollowup(false);
    }
  };

  // Submeter agendamento
  const handleSaveAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appointmentDate) return;

    setSubmittingAppointment(true);
    try {
      const res = await fetch(`/api/leads/${leadId}/appointment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          scheduledAt: appointmentDate,
          notes: appointmentNotes,
        }),
      });

      if (res.ok) {
        toast.success('Agendamento comercial criado!');
        setAppointmentDate('');
        setAppointmentNotes('');
        fetchLeadData();
      } else {
        throw new Error();
      }
    } catch (error) {
      console.error(error);
      toast.error('Erro ao salvar agendamento.');
    } finally {
      setSubmittingAppointment(false);
    }
  };

  // Qualificar e encaminhar lead
  const handleQualifyLead = async () => {
    setQualifying(true);
    try {
      const res = await fetch(`/api/leads/${leadId}/qualify`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error();

      const result = await res.json();
      toast.success(result.message || 'Lead qualificado com sucesso!');
      fetchLeadData();
      onLeadUpdated();
    } catch (error) {
      console.error(error);
      toast.error('Erro ao qualificar lead.');
    } finally {
      setQualifying(false);
    }
  };

  // Mapear ícones e descrições dos eventos
  const getEventBadge = (type: string) => {
    switch (type) {
      case 'LEAD_CREATED':
        return { label: 'Entrada', color: 'bg-primary-100 text-primary-800 dark:bg-primary-950/40 dark:text-primary-300' };
      case 'LEAD_QUALIFIED':
        return { label: 'Qualificação', color: 'bg-success-100 text-success-800 dark:bg-success-950/40 dark:text-success-300' };
      case 'STAGE_CHANGED':
        return { label: 'Movimentação', color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-300' };
      case 'FOLLOWUP_LOGGED':
        return { label: 'Follow-up', color: 'bg-warning-100 text-warning-800 dark:bg-warning-950/40 dark:text-warning-300' };
      case 'APPOINTMENT_SCHEDULED':
        return { label: 'Agendado', color: 'bg-purple-100 text-purple-800 dark:bg-purple-950/40 dark:text-purple-300' };
      case 'DEAL_LOST':
      case 'LEAD_DISQUALIFIED':
        return { label: 'Descarte', color: 'bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-300' };
      default:
        return { label: 'Histórico', color: 'bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-300' };
    }
  };

  if (!lead) return null;

  return (
    <>
      {/* Background overlay */}
      <div 
        className="fixed inset-0 bg-neutral-950/40 backdrop-blur-sm z-40 transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Drawer Container */}
      <div className="fixed top-0 right-0 h-full w-full sm:w-[480px] bg-white dark:bg-neutral-900 shadow-2xl z-50 flex flex-col border-l border-neutral-200 dark:border-neutral-800 transition-all duration-300 animate-slide-in">
        
        {/* Header do Drawer */}
        <div className="p-5 border-b border-neutral-200/80 dark:border-neutral-800/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="font-extrabold text-lg text-neutral-900 dark:text-neutral-50 max-w-[280px] truncate leading-tight">
              {lead.name}
            </h2>
            <Badge variant={lead.status === 'URGENTE' ? 'danger' : lead.status === 'QUENTE' ? 'warning' : lead.status === 'MORNO' ? 'primary' : 'neutral'} size="sm" className="font-bold">
              {lead.status}
            </Badge>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 dark:text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Corpo Scrollável */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6 scrollbar-thin">
          
          {/* Seção 1: Informações Rápidas e Ações */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-2.5 bg-neutral-50 dark:bg-neutral-950/20 border border-neutral-200/40 dark:border-neutral-800/40 rounded-lg flex flex-col gap-0.5">
              <span className="text-[9px] uppercase font-bold text-neutral-400 dark:text-neutral-500 tracking-wider">Origem</span>
              <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 truncate">
                {lead.source?.channel || 'Captura Direta'}
              </span>
            </div>

            <div className="p-2.5 bg-neutral-50 dark:bg-neutral-950/20 border border-neutral-200/40 dark:border-neutral-800/40 rounded-lg flex flex-col gap-0.5">
              <span className="text-[9px] uppercase font-bold text-neutral-400 dark:text-neutral-500 tracking-wider">Criado em</span>
              <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 flex items-center gap-1">
                <Clock className="w-3 h-3 text-neutral-400" />
                {new Date(lead.createdAt).toLocaleDateString('pt-BR')}
              </span>
            </div>

            <div className="p-2.5 bg-neutral-50 dark:bg-neutral-950/20 border border-neutral-200/40 dark:border-neutral-800/40 rounded-lg flex flex-col gap-0.5">
              <span className="text-[9px] uppercase font-bold text-neutral-400 dark:text-neutral-500 tracking-wider">Score</span>
              <span className="text-xs font-bold text-primary-600 dark:text-primary-400 flex items-center gap-1 font-mono">
                <Award className="w-3.5 h-3.5" />
                {lead.score || 30}/100
              </span>
            </div>
          </div>

          {/* Dados de Contato */}
          <div className="p-4 bg-neutral-50/60 dark:bg-neutral-950/10 border border-neutral-200/60 dark:border-neutral-800/60 rounded-xl space-y-2.5">
            <h3 className="font-bold text-xs uppercase tracking-wider text-neutral-400">Informações de Contato</h3>
            {lead.phone && (
              <a href={`tel:${lead.phone}`} className="flex items-center gap-2 text-sm text-neutral-700 dark:text-neutral-300 hover:text-primary-500 transition-colors">
                <Phone className="w-4 h-4 text-neutral-400" />
                <span className="font-mono">{lead.phone}</span>
              </a>
            )}
            {lead.email && (
              <a href={`mailto:${lead.email}`} className="flex items-center gap-2 text-sm text-neutral-700 dark:text-neutral-300 hover:text-primary-500 transition-colors">
                <Mail className="w-4 h-4 text-neutral-400" />
                <span>{lead.email}</span>
              </a>
            )}
            {!lead.phone && !lead.email && (
              <p className="text-xs text-neutral-400">Nenhum dado de contato registrado.</p>
            )}
          </div>

          {/* Responsabilidade e Funil */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="font-bold text-xs uppercase tracking-wider text-neutral-400">Responsável</label>
              <select 
                className="w-full p-2 text-sm rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200 focus:ring-1 focus:ring-primary-500"
                value={lead.responsavelId || ''}
                onChange={(e) => handleUpdateLeadField({ responsavelId: e.target.value || null })}
              >
                <option value="">Sem Responsável</option>
                {users.map(u => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="font-bold text-xs uppercase tracking-wider text-neutral-400">Etapa do Funil</label>
              <select 
                className="w-full p-2 text-sm rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200 focus:ring-1 focus:ring-primary-500"
                value={lead.funnelStage}
                onChange={(e) => handleStageChange(e.target.value)}
              >
                {STAGE_OPTIONS.map(opt => (
                  <option key={opt.id} value={opt.id}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* SLA e Alertas */}
          {lead.slaBreachCount > 0 && (
            <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200/50 dark:border-red-900/30 rounded-lg flex items-start gap-2 animate-pulse">
              <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-red-800 dark:text-red-400">Alerta de SLA Estourado</p>
                <p className="text-[11px] text-red-600 dark:text-red-500 mt-0.5">
                  Este lead teve {lead.slaBreachCount} estouros de tempo de resposta. Ação imediata é sugerida!
                </p>
              </div>
            </div>
          )}

          {/* AÇÃO PRINCIPAL: QUALIFICAÇÃO / ENCAMINHAMENTO */}
          <div className="pt-2 border-t border-neutral-200/60 dark:border-neutral-800/60">
            {lead.quotationId ? (
              <div className="p-4 bg-success-50/50 dark:bg-success-950/15 border border-success-200/50 dark:border-success-800/20 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-success-600 dark:text-success-400" />
                  <div>
                    <p className="text-sm font-bold text-success-800 dark:text-success-400">Lead Qualificado</p>
                    <p className="text-[11px] text-neutral-500 dark:text-neutral-400">Encaminhado para o módulo de Orçamentos.</p>
                  </div>
                </div>
                <a 
                  href={`/quotations?id=${lead.quotationId}`}
                  className="px-3 py-1.5 text-xs font-bold bg-success-600 hover:bg-success-700 text-white rounded-lg flex items-center gap-1 transition-all shadow-md"
                >
                  Orçamento <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            ) : (
              <div className="space-y-3">
                <Button 
                  variant="primary" 
                  className="w-full py-2.5 font-bold flex items-center justify-center gap-2 shadow-lg shadow-primary-500/10 hover:shadow-primary-500/20"
                  onClick={handleQualifyLead}
                  isLoading={qualifying}
                  icon={<CheckCircle className="w-4 h-4" />}
                >
                  Qualificar & Encaminhar para Orçamento
                </Button>
                <p className="text-[10px] text-neutral-400 text-center">
                  Ao qualificar, um cliente e uma proposta comercial em rascunho serão gerados automaticamente no Kanban de Orçamentos, herdando todo o histórico do lead.
                </p>
              </div>
            )}
          </div>

          {/* Abas e Histórico */}
          <div className="pt-4 border-t border-neutral-200/60 dark:border-neutral-800/60 space-y-4">
            
            {/* Navegação de Abas */}
            <div className="flex bg-neutral-100 dark:bg-neutral-950/40 p-1 rounded-lg">
              <button 
                onClick={() => setActiveTab('timeline')}
                className={`flex-1 py-1.5 text-[11px] font-bold rounded-md flex items-center justify-center gap-1 transition-all ${
                  activeTab === 'timeline' 
                    ? 'bg-white dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 shadow-sm'
                    : 'text-neutral-400 dark:text-neutral-500 hover:text-neutral-600 dark:hover:text-neutral-400'
                }`}
              >
                <History className="w-3.5 h-3.5" />
                Histórico
              </button>
              <button 
                onClick={() => setActiveTab('qualification')}
                className={`flex-1 py-1.5 text-[11px] font-bold rounded-md flex items-center justify-center gap-1 transition-all ${
                  activeTab === 'qualification' 
                    ? 'bg-white dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 shadow-sm'
                    : 'text-neutral-400 dark:text-neutral-500 hover:text-neutral-600 dark:hover:text-neutral-400'
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5" />
                Qualificar
              </button>
              <button 
                onClick={() => setActiveTab('followup')}
                className={`flex-1 py-1.5 text-[11px] font-bold rounded-md flex items-center justify-center gap-1 transition-all ${
                  activeTab === 'followup' 
                    ? 'bg-white dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 shadow-sm'
                    : 'text-neutral-400 dark:text-neutral-500 hover:text-neutral-600 dark:hover:text-neutral-400'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                Interação
              </button>
              <button 
                onClick={() => setActiveTab('schedule')}
                className={`flex-1 py-1.5 text-[11px] font-bold rounded-md flex items-center justify-center gap-1 transition-all ${
                  activeTab === 'schedule' 
                    ? 'bg-white dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 shadow-sm'
                    : 'text-neutral-400 dark:text-neutral-500 hover:text-neutral-600 dark:hover:text-neutral-400'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                Agendar
              </button>
            </div>

            {/* Conteúdo Aba 1: Histórico/Timeline */}
            {activeTab === 'timeline' && (
              <div className="space-y-4 pr-1">
                {events.length === 0 ? (
                  <p className="text-xs text-neutral-400 text-center py-6">Nenhum evento registrado no histórico.</p>
                ) : (
                  <div className="relative border-l-2 border-neutral-100 dark:border-neutral-800 pl-4 ml-2 space-y-5">
                    {events.map((evt) => {
                      const badge = getEventBadge(evt.type);
                      return (
                        <div key={evt.id} className="relative">
                          {/* Ponto indicador */}
                          <div className="absolute -left-[23px] top-1.5 w-3 h-3 rounded-full border-2 border-white dark:border-neutral-900 bg-neutral-400 dark:bg-neutral-700" />
                          
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded ${badge.color}`}>
                                {badge.label}
                              </span>
                              <span className="text-[10px] text-neutral-400">
                                {new Date(evt.createdAt).toLocaleDateString('pt-BR')} às {new Date(evt.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            
                            {evt.notes && (
                              <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed font-medium">
                                {evt.notes}
                              </p>
                            )}

                            {evt.user && (
                              <span className="text-[10px] text-neutral-400 block">
                                Autor: {evt.user.name}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Conteúdo Aba 2: Qualificação Avançada (BANT/CHAMP/GPCT) */}
            {activeTab === 'qualification' && (
              <form onSubmit={handleSaveQualification} className="space-y-5">
                
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
                      <option value="apenas pesquisando">Apenas pesquisando</option>
                      <option value="comparando opções">Comparando opções</option>
                      <option value="pronto para orçamento">Pronto para orçamento</option>
                      <option value="pronto para fechamento">Pronto para fechamento</option>
                      <option value="acompanhamento posterior">Acompanhamento posterior</option>
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
                      <option value="ligar">Ligar</option>
                      <option value="responder WhatsApp">Responder WhatsApp</option>
                      <option value="enviar proposta">Enviar proposta</option>
                      <option value="agendar visita">Agendar visita</option>
                      <option value="agendar reunião">Agendar reunião</option>
                      <option value="pedir mais informações">Pedir informações</option>
                      <option value="nutrir lead">Nutrir lead</option>
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
                        setMethField1('');
                        setMethField2('');
                        setMethField3('');
                        setMethField4('');
                      }}
                    >
                      <option value="BANT">BANT</option>
                      <option value="CHAMP">CHAMP</option>
                      <option value="GPCT">GPCT</option>
                      <option value="SPIN">SPIN Selling</option>
                    </select>
                  </div>

                  {selectedMethodology === 'BANT' && (
                    <div className="space-y-3">
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold uppercase text-neutral-400 flex items-center gap-1">
                          <DollarSign className="w-3 h-3" /> Budget (Orçamento)
                        </label>
                        <input
                          type="text"
                          className="p-2 text-xs rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-800"
                          placeholder="Tem orçamento disponível? Qual o valor aproximado?"
                          value={methField1}
                          onChange={(e) => setMethField1(e.target.value)}
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold uppercase text-neutral-400">👤 Authority (Autoridade)</label>
                        <input
                          type="text"
                          className="p-2 text-xs rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-800"
                          placeholder="É o tomador de decisão final?"
                          value={methField2}
                          onChange={(e) => setMethField2(e.target.value)}
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold uppercase text-neutral-400">🎯 Need (Necessidade)</label>
                        <input
                          type="text"
                          className="p-2 text-xs rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-800"
                          placeholder="Qual o problema técnico a ser solucionado?"
                          value={methField3}
                          onChange={(e) => setMethField3(e.target.value)}
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold uppercase text-neutral-400">📅 Timing (Urgência / Tempo)</label>
                        <input
                          type="text"
                          className="p-2 text-xs rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-800"
                          placeholder="Qual o prazo esperado para execução?"
                          value={methField4}
                          onChange={(e) => setMethField4(e.target.value)}
                        />
                      </div>
                    </div>
                  )}

                  {selectedMethodology === 'CHAMP' && (
                    <div className="space-y-3">
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold uppercase text-neutral-400">⚠️ Challenges (Desafios)</label>
                        <input
                          type="text"
                          className="p-2 text-xs rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-800"
                          placeholder="Qual o desafio ou dor principal do cliente?"
                          value={methField1}
                          onChange={(e) => setMethField1(e.target.value)}
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold uppercase text-neutral-400">👤 Authority (Autoridade)</label>
                        <input
                          type="text"
                          className="p-2 text-xs rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-800"
                          placeholder="Quem aprova o pagamento?"
                          value={methField2}
                          onChange={(e) => setMethField2(e.target.value)}
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold uppercase text-neutral-400">💵 Money (Dinheiro)</label>
                        <input
                          type="text"
                          className="p-2 text-xs rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-800"
                          placeholder="Existe barreira financeira para o projeto?"
                          value={methField3}
                          onChange={(e) => setMethField3(e.target.value)}
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold uppercase text-neutral-400">⚡ Prioritization (Prioridade)</label>
                        <input
                          type="text"
                          className="p-2 text-xs rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-800"
                          placeholder="Qual a prioridade deste conserto na rotina?"
                          value={methField4}
                          onChange={(e) => setMethField4(e.target.value)}
                        />
                      </div>
                    </div>
                  )}

                  {selectedMethodology === 'GPCT' && (
                    <div className="space-y-3">
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold uppercase text-neutral-400">🏁 Goals (Metas)</label>
                        <input
                          type="text"
                          className="p-2 text-xs rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-800"
                          placeholder="O que o cliente quer obter com o serviço?"
                          value={methField1}
                          onChange={(e) => setMethField1(e.target.value)}
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold uppercase text-neutral-400">🗺️ Plans (Planos)</label>
                        <input
                          type="text"
                          className="p-2 text-xs rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-800"
                          placeholder="Quais as soluções já tentadas ou planejadas?"
                          value={methField2}
                          onChange={(e) => setMethField2(e.target.value)}
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold uppercase text-neutral-400">⚠️ Challenges (Desafios)</label>
                        <input
                          type="text"
                          className="p-2 text-xs rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-800"
                          placeholder="Quais os obstáculos enfrentados atualmente?"
                          value={methField3}
                          onChange={(e) => setMethField3(e.target.value)}
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold uppercase text-neutral-400">📅 Timeline (Cronograma)</label>
                        <input
                          type="text"
                          className="p-2 text-xs rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-800"
                          placeholder="Quando a solução deve estar 100% pronta?"
                          value={methField4}
                          onChange={(e) => setMethField4(e.target.value)}
                        />
                      </div>
                    </div>
                  )}

                  {selectedMethodology === 'SPIN' && (
                    <div className="space-y-3">
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold uppercase text-neutral-400">📍 Situation (Situação)</label>
                        <input
                          type="text"
                          className="p-2 text-xs rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-800"
                          placeholder="Qual o estado/cenário atual das instalações?"
                          value={methField1}
                          onChange={(e) => setMethField1(e.target.value)}
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold uppercase text-neutral-400">❓ Problem (Problema)</label>
                        <input
                          type="text"
                          className="p-2 text-xs rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-800"
                          placeholder="Quais as insatisfações ou problemas percebidos?"
                          value={methField2}
                          onChange={(e) => setMethField2(e.target.value)}
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold uppercase text-neutral-400">💥 Implication (Implicação)</label>
                        <input
                          type="text"
                          className="p-2 text-xs rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-800"
                          placeholder="Qual o risco de não consertar isso logo?"
                          value={methField3}
                          onChange={(e) => setMethField3(e.target.value)}
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold uppercase text-neutral-400">💡 Need-payoff (Necessidade de Solução)</label>
                        <input
                          type="text"
                          className="p-2 text-xs rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-800"
                          placeholder="Qual o valor e benefício de resolver este problema?"
                          value={methField4}
                          onChange={(e) => setMethField4(e.target.value)}
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-neutral-100 dark:border-neutral-800">
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    className="font-bold px-6 shadow-md"
                    isLoading={savingQualification}
                  >
                    Salvar Qualificação
                  </Button>
                </div>

              </form>
            )}

            {/* Conteúdo Aba 3: Registrar Follow-up */}
            {activeTab === 'followup' && (
              <form onSubmit={handleSaveFollowup} className="space-y-3">
                <textarea 
                  required
                  className="w-full p-2.5 text-xs rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200 focus:ring-1 focus:ring-primary-500"
                  rows={4}
                  placeholder="Escreva detalhes da ligação, conversa ou mensagem trocada com o lead..."
                  value={followupText}
                  onChange={(e) => setFollowupText(e.target.value)}
                />
                <div className="flex justify-end">
                  <Button 
                    type="submit" 
                    variant="primary" 
                    size="sm"
                    className="font-bold px-4"
                    isLoading={submittingFollowup}
                  >
                    Registrar Interação
                  </Button>
                </div>
              </form>
            )}

            {/* Conteúdo Aba 4: Agendamentos */}
            {activeTab === 'schedule' && (
              <form onSubmit={handleSaveAppointment} className="space-y-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Data e Hora da Reunião</label>
                  <input 
                    type="datetime-local"
                    required
                    className="p-2 text-xs rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200 focus:ring-1 focus:ring-primary-500 font-mono"
                    value={appointmentDate}
                    onChange={(e) => setAppointmentDate(e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Anotações do Agendamento</label>
                  <textarea 
                    className="w-full p-2.5 text-xs rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200 focus:ring-1 focus:ring-primary-500"
                    rows={3}
                    placeholder="Pauta da reunião, endereço de visita ou observações..."
                    value={appointmentNotes}
                    onChange={(e) => setAppointmentNotes(e.target.value)}
                  />
                </div>
                <div className="flex justify-end">
                  <Button 
                    type="submit" 
                    variant="primary" 
                    size="sm"
                    className="font-bold px-4"
                    isLoading={submittingAppointment}
                  >
                    Criar Compromisso
                  </Button>
                </div>
              </form>
            )}

          </div>

        </div>

      </div>

      {/* Modal Justificativa de Perda (Descarte) */}
      {showLossModal && (
        <div className="fixed inset-0 bg-neutral-950/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl max-w-md w-full p-5 space-y-4 shadow-2xl animate-scale-in">
            <h3 className="font-extrabold text-md text-neutral-900 dark:text-neutral-50 flex items-center gap-2">
              <XCircle className="w-5 h-5 text-red-600 shrink-0" />
              Justificar Descarte do Lead
            </h3>
            
            <div className="space-y-3">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Motivo do Descarte</label>
                <select 
                  className="w-full p-2 text-xs rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200 focus:ring-1 focus:ring-primary-500"
                  value={lossReason}
                  onChange={(e) => setLossReason(e.target.value)}
                >
                  <option value="sem orçamento">Sem orçamento</option>
                  <option value="sem timing">Sem timing</option>
                  <option value="sem necessidade">Sem necessidade</option>
                  <option value="sem autoridade">Sem autoridade</option>
                  <option value="fora de perfil">Fora de perfil</option>
                  <option value="concorrência">Concorrência</option>
                  <option value="retorno futuro">Retorno futuro</option>
                  <option value="contato inválido">Contato inválido</option>
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Observações Detalhadas</label>
                <textarea 
                  required
                  className="w-full p-2.5 text-xs rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200 focus:ring-1 focus:ring-primary-500"
                  rows={3}
                  placeholder="Justifique o descarte ou motivo da desqualificação..."
                  value={lossNotes}
                  onChange={(e) => setLossNotes(e.target.value)}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  setShowLossModal(false);
                  setTargetStage(null);
                }}
              >
                Cancelar
              </Button>
              <Button 
                variant="danger" 
                size="sm"
                className="font-bold"
                onClick={handleConfirmLoss}
              >
                Confirmar Descarte
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
