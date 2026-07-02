'use client';

import React, { useState } from 'react';
import { Card } from '@/components/Card';
import { Badge } from '@/components/Badge';
import {
  DollarSign,
  Target,
  Zap,
  AlertTriangle,
  Clock,
  UserCheck,
  Phone,
  Mail,
  Calendar,
  MoreVertical,
  ChevronDown,
  ArrowRight,
  XCircle,
  MessageSquare,
  Edit3,
  UserPlus,
  Flag,
  Tag,
  Shield,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  History,
  Trash2,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface LeadCardRichProps {
  lead: {
    id: string;
    name: string;
    email?: string | null;
    phone?: string | null;
    status: string;
    funnelStage: string;
    score: number;
    priority: string;
    estimatedValue?: number | null;
    qualificationStage: string;
    intention?: string | null;
    nextAction?: string | null;
    lossReason?: string | null;
    lossNotes?: string | null;
    slaBreachCount: number;
    createdAt: string;
    updatedAt: string;
    lastContactAt?: string | null;
    nextFollowupAt?: string | null;
    cadenceCount: number;
    riskAlert?: string | null;
    riskAlertLevel?: string | null;
    bantBudget?: string | null;
    bantAuthority?: string | null;
    bantNeed?: string | null;
    bantTiming?: string | null;
    tags?: string | null;
    responsavel?: { name: string } | null;
    source?: { channel: string; campaign?: string | null } | null;
  };
  onClick: () => void;
  onQuickAction: (action: string, leadId: string) => void;
  onPriorityChange: (leadId: string, newPriority: string) => void;
}

// Mapeamento de labels para enums
const INTENTION_LABELS: Record<string, string> = {
  PESQUISANDO: 'Pesquisando',
  COMPARANDO: 'Comparando',
  PRONTO_PARA_ORCAMENTO: 'Pronto p/ Orçamento',
  PRONTO_PARA_FECHAMENTO: 'Pronto p/ Fechamento',
  ACOMPANHAR_DEPOIS: 'Acompanhar depois',
};

const NEXT_ACTION_LABELS: Record<string, string> = {
  LIGAR: 'Ligar',
  RESPONDER_WHATSAPP: 'WhatsApp',
  ENVIAR_PROPOSTA: 'Enviar proposta',
  AGENDAR_VISITA: 'Agendar visita',
  AGENDAR_REUNIAO: 'Agendar reunião',
  PEDIR_MAIS_INFORMACOES: 'Pedir infos',
  NUTRIR_LEAD: 'Nutrir lead',
  ENCAMINHAR_ORCAMENTO: 'Orçamento',
  DESCARTAR: 'Descartar',
};

const QUALIFICATION_LABELS: Record<string, string> = {
  QUALIFICADO: 'Qualificado',
  PARCIALMENTE_QUALIFICADO: 'Parcial',
  EM_VALIDACAO: 'Em validação',
  DESQUALIFICADO: 'Desqualificado',
  SEM_VALIDACAO: 'Sem qualif.',
};

const LOSS_REASON_LABELS: Record<string, string> = {
  SEM_ORCAMENTO: 'Sem orçamento',
  SEM_TIMING: 'Sem timing',
  SEM_NECESSIDADE: 'Sem necessidade',
  SEM_AUTORIDADE: 'Sem autoridade',
  FORA_DE_PERFIL: 'Fora de perfil',
  CONCORRENCIA: 'Concorrência',
  RETORNO_FUTURO: 'Retorno futuro',
  CONTATO_INVALIDO: 'Contato inválido',
};

function getLeadAge(dateStr: string): string {
  const created = new Date(dateStr).getTime();
  const diffMs = Date.now() - created;
  const diffMins = Math.floor(diffMs / (1000 * 60));
  if (diffMins < 60) return `${diffMins}min`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d`;
}

function getTemperatureBorderClass(status: string): string {
  switch (status) {
    case 'URGENTE':
      return 'border-l-[5px] border-l-red-500 shadow-red-500/10 shadow-md';
    case 'QUENTE':
      return 'border-l-[5px] border-l-warning-500';
    case 'MORNO':
      return 'border-l-[5px] border-l-primary-500';
    case 'FRIO':
    default:
      return 'border-l-[5px] border-l-neutral-300 dark:border-l-neutral-700';
  }
}

function getPriorityConfig(priority: string): { color: string; icon: React.ReactNode; label: string } {
  switch (priority) {
    case 'URGENTE':
      return { color: 'text-red-700 bg-red-50 dark:text-red-300 dark:bg-red-950/20 border-red-200/50', icon: <AlertCircle className="w-2.5 h-2.5" />, label: 'Urgente' };
    case 'ALTA':
      return { color: 'text-red-600 bg-red-50 dark:text-red-300 dark:bg-red-950/20 border-red-200/50', icon: <Flag className="w-2.5 h-2.5" />, label: 'Alta' };
    case 'BAIXA':
      return { color: 'text-neutral-500 bg-neutral-100 dark:text-neutral-400 dark:bg-neutral-800 border-neutral-200/50', icon: <ChevronDown className="w-2.5 h-2.5" />, label: 'Baixa' };
    case 'MEDIA':
    default:
      return { color: 'text-amber-700 bg-amber-50 dark:text-amber-300 dark:bg-amber-950/20 border-amber-200/50', icon: <Flag className="w-2.5 h-2.5" />, label: 'Média' };
  }
}

function getSourceBadgeVariant(channel?: string): 'success' | 'primary' | 'warning' | 'neutral' {
  if (!channel) return 'neutral';
  const c = channel.toLowerCase();
  if (c === 'whatsapp') return 'success';
  if (c === 'google ads' || c === 'google') return 'primary';
  if (c === 'instagram') return 'warning';
  return 'neutral';
}

function getQualificationColor(stage: string): string {
  switch (stage) {
    case 'QUALIFICADO':
      return 'text-success-700 bg-success-50 dark:text-success-300 dark:bg-success-950/30';
    case 'PARCIALMENTE_QUALIFICADO':
      return 'text-warning-700 bg-warning-50 dark:text-warning-300 dark:bg-warning-950/30';
    case 'EM_VALIDACAO':
      return 'text-primary-700 bg-primary-50 dark:text-primary-300 dark:bg-primary-950/30';
    case 'DESQUALIFICADO':
      return 'text-red-600 bg-red-50 dark:text-red-300 dark:bg-red-950/30';
    default:
      return 'text-neutral-500 bg-neutral-100 dark:text-neutral-400 dark:bg-neutral-800';
  }
}

function getRiskAlertConfig(level?: string | null): { color: string; icon: React.ReactNode } | null {
  if (!level) return null;
  switch (level) {
    case 'CRITICO':
      return { color: 'text-red-700 bg-red-50 dark:text-red-300 dark:bg-red-950/20 border-red-200', icon: <AlertCircle className="w-3 h-3 animate-pulse" /> };
    case 'ALTO':
      return { color: 'text-red-600 bg-red-50 dark:text-red-300 dark:bg-red-950/20 border-red-200/50', icon: <AlertTriangle className="w-3 h-3" /> };
    case 'MEDIO':
      return { color: 'text-warning-600 bg-warning-50 dark:text-warning-300 dark:bg-warning-950/20 border-warning-200/50', icon: <AlertTriangle className="w-3 h-3" /> };
    case 'BAIXO':
      return { color: 'text-neutral-500 bg-neutral-100 dark:text-neutral-400 dark:bg-neutral-800 border-neutral-200/50', icon: <AlertCircle className="w-3 h-3" /> };
    default:
      return null;
  }
}

function getSLAStatus(lead: LeadCardRichProps['lead']): { label: string; color: string; urgent: boolean } {
  if (lead.slaBreachCount > 0) {
    return { label: `SLA ${lead.slaBreachCount}x`, color: 'text-red-600 dark:text-red-400', urgent: true };
  }
  
  const created = new Date(lead.createdAt).getTime();
  const hoursSinceCreation = (Date.now() - created) / (1000 * 60 * 60);
  
  if (lead.status === 'URGENTE' && hoursSinceCreation > 1) {
    return { label: 'Resposta atrasada', color: 'text-red-600 dark:text-red-400', urgent: true };
  }
  if (lead.status === 'QUENTE' && hoursSinceCreation > 4) {
    return { label: 'Follow-up atrasado', color: 'text-warning-600 dark:text-warning-400', urgent: false };
  }
  if (hoursSinceCreation > 24) {
    return { label: 'Lead stale', color: 'text-neutral-500 dark:text-neutral-400', urgent: false };
  }
  
  return { label: 'OK', color: 'text-success-600 dark:text-success-400', urgent: false };
}

export function LeadCardRich({ lead, onClick, onQuickAction, onPriorityChange }: LeadCardRichProps) {
  const [showActions, setShowActions] = useState(false);
  
  const priorityConfig = getPriorityConfig(lead.priority);
  const slaStatus = getSLAStatus(lead);
  const riskConfig = getRiskAlertConfig(lead.riskAlertLevel);
  
  const priorityOrder = ['BAIXA', 'MEDIA', 'ALTA', 'URGENTE'];
  const cyclePriority = () => {
    const currentIdx = priorityOrder.indexOf(lead.priority);
    const nextIdx = (currentIdx + 1) % priorityOrder.length;
    return priorityOrder[nextIdx];
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(value);
  };

  return (
    <div
      onClick={onClick}
      className={`cursor-pointer group relative ${getTemperatureBorderClass(lead.status)}`}
    >
      <Card
        gradient="none"
        shadow="sm"
        interactive
        className="bg-white dark:bg-neutral-800/90 border border-neutral-200/80 dark:border-neutral-700/60 p-3 flex flex-col gap-2 rounded-lg relative overflow-hidden transition-all duration-200 hover:border-primary-500/50 dark:hover:border-primary-400/30 hover:shadow-md"
      >
        {/* Header: Nome + Idade + Menu */}
        <div className="flex justify-between items-start gap-1.5">
          <div className="flex-1 min-w-0">
            <h4 className="font-bold text-[13px] text-neutral-900 dark:text-neutral-100 truncate leading-tight">
              {lead.name}
            </h4>
            {lead.source && (
              <div className="flex items-center gap-1 mt-0.5">
                <Badge
                  variant={getSourceBadgeVariant(lead.source.channel)}
                  size="sm"
                  className="text-[8px] px-1 py-0 font-bold"
                >
                  {lead.source.channel}
                </Badge>
                {lead.source.campaign && (
                  <span className="text-[8px] text-neutral-400 truncate max-w-[80px]" title={lead.source.campaign}>
                    {lead.source.campaign}
                  </span>
                )}
              </div>
            )}
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <span className="text-[9px] text-neutral-400 font-semibold" title={`Entrada: ${new Date(lead.createdAt).toLocaleString('pt-BR')}`}>
              {getLeadAge(lead.createdAt)}
            </span>
            <div className="relative">
              <button
                onClick={(e) => { e.stopPropagation(); setShowActions(!showActions); }}
                className="p-0.5 rounded hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors"
              >
                <MoreVertical className="w-3.5 h-3.5" />
              </button>
              {showActions && (
                <div className="absolute right-0 top-6 z-50 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg shadow-xl py-1 min-w-[160px] animate-in fade-in slide-in-from-top-2">
                  <button
                    onClick={(e) => { e.stopPropagation(); onQuickAction('contact', lead.id); setShowActions(false); }}
                    className="w-full px-3 py-1.5 text-left text-xs text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700 flex items-center gap-2"
                  >
                    <Phone className="w-3 h-3" /> Registrar contato
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); onQuickAction('followup', lead.id); setShowActions(false); }}
                    className="w-full px-3 py-1.5 text-left text-xs text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700 flex items-center gap-2"
                  >
                    <MessageSquare className="w-3 h-3" /> Registrar follow-up
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); onQuickAction('schedule', lead.id); setShowActions(false); }}
                    className="w-full px-3 py-1.5 text-left text-xs text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700 flex items-center gap-2"
                  >
                    <Calendar className="w-3 h-3" /> Agendar retorno
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); onQuickAction('reassign', lead.id); setShowActions(false); }}
                    className="w-full px-3 py-1.5 text-left text-xs text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700 flex items-center gap-2"
                  >
                    <UserPlus className="w-3 h-3" /> Reatribuir
                  </button>
                  <div className="border-t border-neutral-100 dark:border-neutral-700 my-1" />
                  <button
                    onClick={(e) => { e.stopPropagation(); onQuickAction('delete', lead.id); setShowActions(false); }}
                    className="w-full px-3 py-1.5 text-left text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 flex items-center gap-2"
                  >
                    <Trash2 className="w-3 h-3" /> Excluir
                  </button>
                  <div className="border-t border-neutral-100 dark:border-neutral-700 my-1" />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onPriorityChange(lead.id, cyclePriority());
                      setShowActions(false);
                    }}
                    className="w-full px-3 py-1.5 text-left text-xs text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700 flex items-center gap-2"
                  >
                    <Flag className="w-3 h-3" /> Alterar prioridade
                  </button>
                  {lead.funnelStage !== 'ENCAMINHADO_ORCAMENTO' && lead.funnelStage !== 'DESCARTADO' && (
                    <button
                      onClick={(e) => { e.stopPropagation(); onQuickAction('qualify', lead.id); setShowActions(false); }}
                      className="w-full px-3 py-1.5 text-left text-xs text-success-700 dark:text-success-300 hover:bg-success-50 dark:hover:bg-success-950/20 flex items-center gap-2"
                    >
                      <UserCheck className="w-3 h-3" /> Qualificar
                    </button>
                  )}
                  {lead.funnelStage !== 'DESCARTADO' && (
                    <button
                      onClick={(e) => { e.stopPropagation(); onQuickAction('discard', lead.id); setShowActions(false); }}
                      className="w-full px-3 py-1.5 text-left text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 flex items-center gap-2"
                    >
                      <XCircle className="w-3 h-3" /> Descartar
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Badges: Prioridade + Qualificação + Score */}
        <div className="flex flex-wrap gap-1 items-center">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onPriorityChange(lead.id, cyclePriority());
            }}
            className={`text-[8px] px-1.5 py-0.5 rounded-md font-bold border flex items-center gap-0.5 transition-transform hover:scale-105 active:scale-95 ${priorityConfig.color}`}
            title={`Prioridade: ${lead.priority}. Clique para alterar.`}
          >
            {priorityConfig.icon}
            {priorityConfig.label}
          </button>
          
          <span className={`text-[8px] px-1.5 py-0.5 rounded-md font-bold ${getQualificationColor(lead.qualificationStage)}`}>
            {QUALIFICATION_LABELS[lead.qualificationStage] || lead.qualificationStage}
          </span>
          
          {lead.score > 0 && (
            <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-md ${
              lead.score >= 70 ? 'text-success-700 bg-success-100 dark:text-success-300 dark:bg-success-900/30'
              : lead.score >= 40 ? 'text-warning-700 bg-warning-100 dark:text-warning-300 dark:bg-warning-900/30'
              : 'text-neutral-500 bg-neutral-100 dark:text-neutral-400 dark:bg-neutral-800'
            }`}>
              {lead.score}
            </span>
          )}
          
          <span className={`text-[8px] font-extrabold uppercase tracking-wider px-1.5 py-0.5 rounded-md ${
            lead.status === 'URGENTE'
              ? 'text-red-700 bg-red-100 dark:text-red-300 dark:bg-red-950/40 animate-pulse'
              : lead.status === 'QUENTE'
              ? 'text-warning-700 bg-warning-50 dark:text-warning-300 dark:bg-warning-950/30'
              : lead.status === 'MORNO'
              ? 'text-primary-700 bg-primary-50 dark:text-primary-300 dark:bg-primary-950/30'
              : 'text-neutral-600 bg-neutral-100 dark:text-neutral-400 dark:bg-neutral-700/50'
          }`}>
            {lead.status}
          </span>
        </div>

        {/* Valor Estimado */}
        {lead.estimatedValue && lead.estimatedValue > 0 && (
          <div className="flex items-center gap-1 text-success-600 dark:text-success-400">
            <DollarSign className="w-3 h-3" />
            <span className="text-[11px] font-bold">{formatCurrency(lead.estimatedValue)}</span>
          </div>
        )}

        {/* Intenção + Próxima Ação */}
        <div className="space-y-0.5">
          {lead.intention && (
            <div className="flex items-center gap-1 text-[10px] text-neutral-500 dark:text-neutral-400">
              <Target className="w-3 h-3 text-neutral-400" />
              <span className="truncate">{INTENTION_LABELS[lead.intention] || lead.intention}</span>
            </div>
          )}
          {lead.nextAction && (
            <div className="flex items-center gap-1 text-[10px] text-indigo-600 dark:text-indigo-400 font-medium">
              <Zap className="w-3 h-3" />
              <span className="truncate">{NEXT_ACTION_LABELS[lead.nextAction] || lead.nextAction}</span>
            </div>
          )}
        </div>

        {/* Tags */}
        {lead.tags && (
          <div className="flex flex-wrap gap-1">
            {lead.tags.split(',').slice(0, 3).map((tag, i) => (
              <span key={i} className="text-[8px] px-1 py-0.5 bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 rounded">
                {tag.trim()}
              </span>
            ))}
            {lead.tags.split(',').length > 3 && (
              <span className="text-[8px] text-neutral-400">+{lead.tags.split(',').length - 3}</span>
            )}
          </div>
        )}

        {/* Alerta de Risco */}
        {riskConfig && (
          <div className={`flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded border ${riskConfig.color}`}>
            {riskConfig.icon}
            <span className="truncate">{lead.riskAlert || 'Risco identificado'}</span>
          </div>
        )}

        {/* Desqualificação */}
        {lead.lossReason && (
          <div className="flex items-center gap-1 text-[9px] text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/20 px-1.5 py-0.5 rounded">
            <XCircle className="w-3 h-3" />
            <span className="truncate">{LOSS_REASON_LABELS[lead.lossReason] || lead.lossReason}</span>
          </div>
        )}

        {/* Footer: SLA + Responsável + Cadência */}
        <div className="flex items-center justify-between mt-1 pt-1.5 border-t border-neutral-100 dark:border-neutral-800/40">
          <div className="flex items-center gap-1.5">
            {/* SLA */}
            <div className={`flex items-center gap-0.5 ${slaStatus.color}`} title={slaStatus.label}>
              {slaStatus.urgent ? (
                <AlertTriangle className="w-3 h-3" />
              ) : (
                <Clock className="w-3 h-3" />
              )}
              <span className="text-[9px] font-bold">{slaStatus.label}</span>
            </div>
            
            {/* Cadência */}
            {lead.cadenceCount > 0 && (
              <span className="text-[8px] text-neutral-400" title={`Tentativas: ${lead.cadenceCount}`}>
                <History className="w-3 h-3 inline" /> {lead.cadenceCount}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            {/* Responsável */}
            {lead.responsavel && (
              <span className="text-[9px] text-neutral-400 font-semibold truncate max-w-[60px]" title={`Responsável: ${lead.responsavel.name}`}>
                {lead.responsavel.name.split(' ')[0]}
              </span>
            )}
            
            {/* Próximo follow-up */}
            {lead.nextFollowupAt && (
              <span className="text-[8px] text-primary-500 dark:text-primary-400" title={`Próximo follow-up: ${new Date(lead.nextFollowupAt).toLocaleString('pt-BR')}`}>
                <Calendar className="w-3 h-3 inline" />
              </span>
            )}
          </div>
        </div>

        {/* Indicador de BANT (se tiver dados) */}
        {(lead.bantBudget || lead.bantAuthority || lead.bantNeed || lead.bantTiming) && (
          <div className="flex items-center gap-0.5 text-[8px] text-neutral-400">
            <Shield className="w-3 h-3" />
            <span>BANT:</span>
            {lead.bantBudget && <span className="text-neutral-500">B</span>}
            {lead.bantAuthority && <span className="text-neutral-500">A</span>}
            {lead.bantNeed && <span className="text-neutral-500">N</span>}
            {lead.bantTiming && <span className="text-neutral-500">T</span>}
          </div>
        )}
      </Card>
    </div>
  );
}
