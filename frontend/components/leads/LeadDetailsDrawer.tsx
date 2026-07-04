'use client';

import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/Badge';
import Button from '@/components/Button';
import { 
  X, 
  Calendar, 
  Phone, 
  Mail, 
  Clock, 
  MessageSquare, 
  CheckCircle, 
  AlertTriangle,
  History,
  TrendingUp,
  ExternalLink,
  Award,
  Trash2
} from 'lucide-react';
import { useEscapeToClose } from '@/hooks/useEscapeToClose';
import toast from 'react-hot-toast';
import { LeadTimeline } from './LeadTimeline';
import { LeadFollowupForm } from './LeadFollowupForm';
import { LeadScheduleForm } from './LeadScheduleForm';
import { LeadQualificationForm } from './LeadQualificationForm';
import { LeadLossModal } from './LeadLossModal';

interface UserOption {
  id: string;
  name: string;
}

interface Lead {
  id: string;
  name: string;
  phone?: string | null;
  email?: string | null;
  status: string;
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
  priority: string;
  estimatedValue?: number | null;
  qualificationStage: string;
  intention?: string | null;
  nextAction?: string | null;
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
  
  const [qualifying, setQualifying] = useState(false);
  const [showLossModal, setShowLossModal] = useState(false);
  const [targetStage, setTargetStage] = useState<string | null>(null);

  useEscapeToClose(!showLossModal, onClose);

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

  const handleStageChange = (newStage: string) => {
    if (newStage === 'DESCARTADO') {
      setTargetStage(newStage);
      setShowLossModal(true);
    } else {
      handleUpdateLeadField({ funnelStage: newStage });
    }
  };

  const handleConfirmLoss = async (reason: string, notes: string) => {
    if (!targetStage) return;
    try {
      await handleUpdateLeadField({
        funnelStage: targetStage,
        lossReason: reason,
        lossNotes: notes
      });
      setShowLossModal(false);
    } catch (error) {
      console.error(error);
    }
  };

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

  const handleDelete = async () => {
    if (!window.confirm('Tem certeza que deseja excluir permanentemente este lead? Esta ação não pode ser desfeita.')) return;
    try {
      const res = await fetch(`/api/leads/${leadId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        toast.success('Lead excluído com sucesso!');
        onLeadUpdated();
        onClose();
      } else {
        toast.error('Erro ao excluir lead.');
      }
    } catch (error) {
      toast.error('Erro ao excluir lead.');
    }
  };

  if (!lead) return null;

  return (
    <>
      <div 
        className="fixed inset-0 bg-neutral-950/40 backdrop-blur-sm z-40 transition-opacity duration-300"
        onClick={onClose}
      />

      <div className="fixed top-0 right-0 h-full w-full sm:w-[480px] bg-white dark:bg-neutral-900 shadow-2xl z-50 flex flex-col border-l border-neutral-200 dark:border-neutral-800 transition-all duration-300 animate-slide-in">
        
        {/* Header */}
        <div className="p-5 border-b border-neutral-200/80 dark:border-neutral-800/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="font-extrabold text-lg text-neutral-900 dark:text-neutral-50 max-w-[280px] truncate leading-tight">
              {lead.name}
            </h2>
            <Badge variant={lead.status === 'URGENTE' ? 'danger' : lead.status === 'QUENTE' ? 'warning' : lead.status === 'MORNO' ? 'primary' : 'neutral'} size="sm" className="font-bold">
              {lead.status}
            </Badge>
          </div>
          <div className="flex items-center gap-1">
            <button 
              onClick={handleDelete}
              className="p-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-red-400 dark:text-red-500 hover:text-red-600 dark:hover:text-red-400 transition-all"
              title="Excluir Lead"
            >
              <Trash2 className="w-5 h-5" />
            </button>
            <button 
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 dark:text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Corpo Scrollável */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6 scrollbar-thin">
          
          {/* Quick Info */}
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

          {/* Contact Info */}
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

          {/* Responsibility & Funnel */}
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

          {/* SLA Alert */}
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

          {/* Main Action: Qualify / Forward */}
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

          {/* Tabs */}
          <div className="pt-4 border-t border-neutral-200/60 dark:border-neutral-800/60 space-y-4">
            
            <div className="flex bg-neutral-100 dark:bg-neutral-950/40 p-1 rounded-lg">
              {[
                { id: 'timeline', icon: History, label: 'Histórico' },
                { id: 'qualification', icon: TrendingUp, label: 'Qualificar' },
                { id: 'followup', icon: MessageSquare, label: 'Interação' },
                { id: 'schedule', icon: Calendar, label: 'Agendar' },
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button 
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex-1 py-1.5 text-[11px] font-bold rounded-md flex items-center justify-center gap-1 transition-all ${
                      activeTab === tab.id 
                        ? 'bg-white dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 shadow-sm'
                        : 'text-neutral-400 dark:text-neutral-500 hover:text-neutral-600 dark:hover:text-neutral-400'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Tab Content */}
            <div className="min-h-[200px]">
              {activeTab === 'timeline' && (
                <LeadTimeline events={events} />
              )}

              {activeTab === 'qualification' && (
                <LeadQualificationForm 
                  lead={lead} 
                  token={token} 
                  onSuccess={() => {
                    fetchLeadData();
                    onLeadUpdated();
                  }} 
                />
              )}

              {activeTab === 'followup' && (
                <LeadFollowupForm 
                  leadId={lead.id} 
                  token={token} 
                  onSuccess={fetchLeadData} 
                />
              )}

              {activeTab === 'schedule' && (
                <LeadScheduleForm 
                  leadId={lead.id} 
                  token={token} 
                  onSuccess={fetchLeadData} 
                  currentAppointment={lead.appointments?.[0]}
                  allAppointments={lead.appointments}
                />
              )}
            </div>

          </div>

        </div>

      </div>

      {/* Loss Modal */}
      <LeadLossModal 
        isOpen={showLossModal}
        onClose={() => {
          setShowLossModal(false);
          setTargetStage(null);
        }}
        onConfirm={handleConfirmLoss}
      />
    </>
  );
}
