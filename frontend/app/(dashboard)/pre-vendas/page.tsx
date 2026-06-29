"use client";

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/Card';
import { Badge } from '@/components/Badge';
import Button from '@/components/Button';
import { useAuth } from '@/hooks/useAuth';
import { 
  Users, 
  UserMinus, 
  MessageSquare, 
  PhoneCall, 
  CheckCircle2, 
  XCircle, 
  Calendar, 
  ThumbsUp, 
  FileText, 
  Send, 
  Handshake, 
  Trophy, 
  Frown, 
  Clock, 
  RefreshCw,
  AlertTriangle,
  Mail,
  Phone
} from 'lucide-react';

type Lead = {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  status: string; // FRIO, MORNO, QUENTE, PRONTO_ORCAMENTO
  funnelStage: string;
  slaBreachCount: number;
  source?: { channel: string };
  createdAt: string;
  updatedAt: string;
};

const STAGES = [
  { id: 'NOVO_LEAD', title: 'Novo Lead', icon: Users, color: 'text-primary-500 bg-primary-50 dark:bg-primary-950/30' },
  { id: 'SEM_CONTATO', title: 'Sem Contato', icon: UserMinus, color: 'text-neutral-500 bg-neutral-100 dark:bg-neutral-800' },
  { id: 'EM_CONTATO', title: 'Em Contato', icon: MessageSquare, color: 'text-warning-600 bg-warning-50 dark:bg-warning-950/20' },
  { id: 'CONTATO_REALIZADO', title: 'Contato Feito', icon: PhoneCall, color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/20' },
  { id: 'LEAD_QUALIFICADO', title: 'Qualificado', icon: CheckCircle2, color: 'text-success-600 bg-success-50 dark:bg-success-950/20' },
  { id: 'LEAD_NAO_QUALIFICADO', title: 'Não Qualificado', icon: XCircle, color: 'text-red-600 bg-red-50 dark:bg-red-950/20' },
  { id: 'REUNIAO_AGENDADA', title: 'Agendado', icon: Calendar, color: 'text-purple-600 bg-purple-50 dark:bg-purple-950/20' },
  { id: 'COMPARECEU', title: 'Compareceu', icon: ThumbsUp, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20' },
  { id: 'PROPOSTA_SOLICITADA', title: 'Prop. Solicitada', icon: FileText, color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/20' },
  { id: 'PROPOSTA_ENVIADA', title: 'Prop. Enviada', icon: Send, color: 'text-sky-600 bg-sky-50 dark:bg-sky-950/20' },
  { id: 'EM_NEGOCIACAO', title: 'Em Negociação', icon: Handshake, color: 'text-teal-600 bg-teal-50 dark:bg-teal-950/20' },
  { id: 'GANHO', title: 'Ganho', icon: Trophy, color: 'text-success-600 bg-success-100 dark:bg-success-950/40' },
  { id: 'PERDIDO', title: 'Perdido', icon: Frown, color: 'text-rose-600 bg-rose-50 dark:bg-rose-950/20' },
  { id: 'SEM_RESPOSTA', title: 'Sem Resposta', icon: Clock, color: 'text-slate-500 bg-slate-100 dark:bg-slate-800' },
  { id: 'REATIVADO', title: 'Reativado', icon: RefreshCw, color: 'text-violet-600 bg-violet-50 dark:bg-violet-950/20' },
];

export default function PreVendasPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { getToken } = useAuth();

  const fetchLeads = () => {
    setRefreshing(true);
    const token = getToken();
    fetch('/api/leads', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setLeads(data);
      })
      .catch(err => console.error(err))
      .finally(() => {
        setLoading(false);
        setRefreshing(false);
      });
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  // Determinar a borda esquerda do card com base no status do lead (temperatura)
  const getTemperatureBorderClass = (status: string) => {
    switch (status) {
      case 'QUENTE':
      case 'PRONTO_ORCAMENTO':
        return 'border-l-[4px] border-l-warning-500';
      case 'MORNO':
        return 'border-l-[4px] border-l-primary-500';
      case 'FRIO':
      default:
        return 'border-l-[4px] border-l-neutral-300 dark:border-l-neutral-700';
    }
  };

  // Determinar a variante do badge com base no canal
  const getSourceBadgeVariant = (channel?: string) => {
    if (!channel) return 'neutral';
    const c = channel.toLowerCase();
    if (c === 'whatsapp') return 'success';
    if (c === 'google ads' || c === 'google') return 'primary';
    if (c === 'instagram') return 'warning';
    return 'neutral';
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 min-h-[calc(100vh-4rem)] flex flex-col space-y-6 bg-neutral-50 dark:bg-neutral-950 transition-colors duration-300">
      
      {/* Cabeçalho Padronizado */}
      <div className="flex items-center justify-between pb-4 border-b border-neutral-200/60 dark:border-neutral-800/60">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-neutral-50">
            Pré-Vendas & CRM
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            Gerencie o pipeline comercial, qualifique contatos e acompanhe o funil de vendas.
          </p>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={fetchLeads} 
          isLoading={refreshing}
          icon={<RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />}
        >
          Atualizar
        </Button>
      </div>
      
      {loading ? (
        <div className="flex-1 flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-2">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600 mx-auto"></div>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">Carregando pipeline comercial...</p>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex gap-4 overflow-x-auto pb-6 scrollbar-thin scrollbar-thumb-neutral-200 dark:scrollbar-thumb-neutral-800">
          {STAGES.map((stage) => {
            const stageLeads = leads.filter(l => l.funnelStage === stage.id);
            const Icon = stage.icon;

            return (
              <div 
                key={stage.id} 
                className="flex-shrink-0 w-72 md:w-80 bg-neutral-100/50 dark:bg-neutral-900/30 border border-neutral-200/50 dark:border-neutral-800/40 rounded-xl p-4 flex flex-col h-[calc(100vh-13rem)]"
              >
                {/* Header da Coluna */}
                <div className="flex items-center justify-between mb-4 pb-2 border-b border-neutral-200/40 dark:border-neutral-800/40">
                  <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded-lg ${stage.color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <h3 className="font-bold text-sm text-neutral-800 dark:text-neutral-200 line-clamp-1">
                      {stage.title}
                    </h3>
                  </div>
                  <Badge variant={stageLeads.length > 0 ? 'primary' : 'neutral'} size="sm" className="font-semibold px-2 py-0.5">
                    {stageLeads.length}
                  </Badge>
                </div>

                {/* Lista de Cards com scroll vertical */}
                <div className="flex flex-col gap-3 flex-1 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-neutral-200 dark:scrollbar-thumb-neutral-800">
                  {stageLeads.map(lead => (
                    <Card 
                      key={lead.id} 
                      gradient="none" 
                      shadow="sm"
                      interactive
                      className={`bg-white dark:bg-neutral-800/90 border border-neutral-200/80 dark:border-neutral-700/60 p-3.5 flex flex-col gap-2 rounded-lg relative overflow-hidden transition-all duration-300 ${getTemperatureBorderClass(lead.status)} hover:border-primary-500/60 dark:hover:border-primary-400/40`}
                    >
                      {/* Topo do card: Nome + Canal */}
                      <div className="flex justify-between items-start gap-2">
                        <h4 className="font-bold text-sm text-neutral-900 dark:text-neutral-100 line-clamp-1 leading-snug">
                          {lead.name}
                        </h4>
                        {lead.source && (
                          <Badge 
                            variant={getSourceBadgeVariant(lead.source.channel)} 
                            size="sm" 
                            className="text-[10px] px-1.5 py-0 font-medium shrink-0"
                          >
                            {lead.source.channel}
                          </Badge>
                        )}
                      </div>

                      {/* Informações de contato */}
                      <div className="space-y-1 mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                        {lead.phone && (
                          <div className="flex items-center gap-1.5">
                            <Phone className="w-3.5 h-3.5 text-neutral-400 dark:text-neutral-500" />
                            <span className="line-clamp-1 font-mono">{lead.phone}</span>
                          </div>
                        )}
                        {lead.email && (
                          <div className="flex items-center gap-1.5">
                            <Mail className="w-3.5 h-3.5 text-neutral-400 dark:text-neutral-500" />
                            <span className="line-clamp-1">{lead.email}</span>
                          </div>
                        )}
                      </div>

                      {/* Footer do card: Alertas + Status (Temperatura) */}
                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-neutral-100 dark:border-neutral-800/40">
                        <div className="flex items-center gap-1">
                          {/* Alerta de SLA ou Alertas operacionais */}
                          {lead.slaBreachCount > 0 && (
                            <div className="flex items-center text-red-600 dark:text-red-400 gap-0.5" title={`${lead.slaBreachCount} quebras de SLA`}>
                              <AlertTriangle className="w-3.5 h-3.5 fill-red-100 dark:fill-transparent" />
                              <span className="text-[10px] font-bold">{lead.slaBreachCount}</span>
                            </div>
                          )}
                        </div>

                        {/* Temperatura */}
                        <div className="flex items-center gap-1.5">
                          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                            lead.status === 'QUENTE' || lead.status === 'PRONTO_ORCAMENTO'
                              ? 'text-warning-700 bg-warning-50 dark:text-warning-300 dark:bg-warning-950/30'
                              : lead.status === 'MORNO'
                              ? 'text-primary-700 bg-primary-50 dark:text-primary-300 dark:bg-primary-950/30'
                              : 'text-neutral-600 bg-neutral-100 dark:text-neutral-400 dark:bg-neutral-700/50'
                          }`}>
                            {lead.status === 'PRONTO_ORCAMENTO' ? 'P. ORÇAMENTO' : lead.status}
                          </span>
                        </div>
                      </div>
                    </Card>
                  ))}

                  {/* Empty state da coluna */}
                  {stageLeads.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-10 px-4 border border-dashed border-neutral-200 dark:border-neutral-800/80 rounded-lg bg-neutral-50/40 dark:bg-neutral-900/10">
                      <Users className="w-5 h-5 text-neutral-400 dark:text-neutral-700 mb-2" />
                      <p className="text-xs text-neutral-400 dark:text-neutral-600 font-medium text-center">
                        Nenhum lead
                      </p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
