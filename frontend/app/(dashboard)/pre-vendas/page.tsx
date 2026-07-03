"use client";

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardContent } from '@/components/Card';
import { Badge } from '@/components/Badge';
import Button from '@/components/Button';
import { useAuth } from '@/hooks/useAuth';
import { LeadDetailsDrawer } from '@/components/leads/LeadDetailsDrawer';
import { LeadCardRich } from '@/components/leads/LeadCardRich';
import { Modal } from '@/components/Modal';
import { useEscapeToClose } from '@/hooks/useEscapeToClose';
import { leadCreateSchema, calculateInitialScore, type LeadCreateValues } from '@/lib/validations/lead.schema';
import { 
  Users, 
  Clock, 
  MessageSquare, 
  Calendar, 
  ThumbsUp, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  RefreshCw,
  Mail,
  Phone,
  Plus,
  Upload,
  UserPlus,
  X,
  DollarSign,
  TrendingUp,
  UserCheck,
  Flame,
  Zap,
  Target,
  Sparkles,
  Trash2
} from 'lucide-react';
import toast from 'react-hot-toast';

type User = {
  id: string;
  name: string;
};

type Lead = {
  id: string;
  name: string;
  phone?: string | null;
  email?: string | null;
  status: string;
  funnelStage: string;
  slaBreachCount: number;
  source?: { channel: string; campaign?: string | null } | null;
  createdAt: string;
  updatedAt: string;
  responsavel?: User | null;
  
  // Classificações
  priority: string;
  estimatedValue?: number | null;
  qualificationStage: string;
  intention?: string | null;
  nextAction?: string | null;
  prioritizationMethod?: string | null;
  tags?: string | null;
  score: number;
  
  // Rastreamento
  lastContactAt?: string | null;
  nextFollowupAt?: string | null;
  cadenceCount: number;
  riskAlert?: string | null;
  riskAlertLevel?: string | null;
  
  // BANT
  bantBudget?: string | null;
  bantAuthority?: string | null;
  bantNeed?: string | null;
  bantTiming?: string | null;
  
  // CHAMP
  champChallenge?: string | null;
  champMoney?: string | null;
  champPriority?: string | null;
  
  // Descarte
  lossReason?: string | null;
  lossNotes?: string | null;
};

const STAGES = [
  { id: 'NOVO_LEAD', title: 'Novo Lead', icon: Users, color: 'text-primary-500 bg-primary-50 dark:bg-primary-950/30' },
  { id: 'EM_TRIAGEM', title: 'Em Triagem', icon: Clock, color: 'text-neutral-500 bg-neutral-100 dark:bg-neutral-800' },
  { id: 'QUALIFICADO', title: 'Qualificado', icon: CheckCircle2, color: 'text-success-600 bg-success-50 dark:bg-success-950/20' },
  { id: 'EM_FOLLOWUP', title: 'Em Follow-up', icon: MessageSquare, color: 'text-warning-600 bg-warning-50 dark:bg-warning-950/20' },
  { id: 'AGENDADO', title: 'Agendado', icon: Calendar, color: 'text-purple-600 bg-purple-50 dark:bg-purple-950/20' },
  { id: 'ENCAMINHADO_ORCAMENTO', title: 'Encaminhado', icon: ThumbsUp, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20' },
  { id: 'DESCARTADO', title: 'Descartado', icon: XCircle, color: 'text-red-600 bg-red-50 dark:bg-red-950/20' }
];

export default function PreVendasPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { getToken } = useAuth();
  
  // States da UI
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [showLossModal, setShowLossModal] = useState(false);
  const [lossLeadId, setLossLeadId] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteLeadId, setDeleteLeadId] = useState<string | null>(null);
  
  // Drag and drop states
  const [draggedLeadId, setDraggedLeadId] = useState<string | null>(null);

  // Form de criação manual (react-hook-form + Zod)
  const {
    register: registerLead,
    handleSubmit: handleSubmitLead,
    reset: resetLead,
    watch: watchLead,
    formState: { errors: leadErrors, isSubmitting: submittingLead },
  } = useForm<LeadCreateValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(leadCreateSchema) as any,
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      channel: 'WhatsApp',
      campaign: '',
      status: 'MORNO',
      priority: 'MEDIA',
      estimatedValue: undefined,
      intention: 'COMPARANDO',
      responsavelId: '',
      notes: '',
      tags: '',
    },
  });

  // Score preview em tempo real
  const watchedStatus = watchLead('status');
  const watchedPriority = watchLead('priority');
  const watchedValue = watchLead('estimatedValue');
  const watchedIntention = watchLead('intention');
  const watchedPhone = watchLead('phone');
  const watchedEmail = watchLead('email');

  const previewScore = calculateInitialScore({
    status: watchedStatus,
    priority: watchedPriority,
    estimatedValue: watchedValue,
    intention: watchedIntention || undefined,
    hasPhone: !!watchedPhone,
    hasEmail: !!watchedEmail,
  });

  // Form de importação em lote
  const [bulkCsvText, setBulkCsvText] = useState('');
  const [submittingBulk, setSubmittingBulk] = useState(false);
  const [bulkPreview, setBulkPreview] = useState<{ name: string; phone?: string; email?: string; channel?: string; campaign?: string }[]>([]);

  // Form de descarte
  const [lossReason, setLossReason] = useState('SEM_ORCAMENTO');
  const [lossNotes, setLossNotes] = useState('');
  const [submittingLoss, setSubmittingLoss] = useState(false);

  useEscapeToClose(showCreateModal, () => { setShowCreateModal(false); resetLead(); });
  useEscapeToClose(showBulkModal, () => { setShowBulkModal(false); setBulkCsvText(''); setBulkPreview([]); });
  useEscapeToClose(showLossModal, () => { setShowLossModal(false); setLossLeadId(null); setLossNotes(''); });
  useEscapeToClose(showDeleteModal, () => { setShowDeleteModal(false); setDeleteLeadId(null); });

  const fetchLeads = () => {
    setRefreshing(true);
    const token = getToken();
    fetch('/api/leads?limit=500', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(result => {
        if (result.data && Array.isArray(result.data)) {
          setLeads(result.data);
        } else if (Array.isArray(result)) {
          setLeads(result);
        }
      })
      .catch(err => console.error(err))
      .finally(() => {
        setLoading(false);
        setRefreshing(false);
      });
  };

  const fetchUsers = () => {
    const token = getToken();
    fetch('/api/users', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setUsers(data);
      })
      .catch(err => console.error('Erro ao buscar usuários:', err));
  };

  useEffect(() => {
    fetchLeads();
    fetchUsers();
  }, []);

  // Calcular idade do lead (tempo decorrido)
  const getLeadAge = (dateStr: string) => {
    const created = new Date(dateStr).getTime();
    const diffMs = Date.now() - created;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    if (diffMins < 60) return `${diffMins} min`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d`;
  };

  // Determinar a borda esquerda do card com base no status do lead (temperatura)
  const getTemperatureBorderClass = (status: string) => {
    switch (status) {
      case 'URGENTE':
        return 'border-l-[5px] border-l-red-500 shadow-red-500/10 dark:shadow-red-500/5 shadow-md';
      case 'QUENTE':
        return 'border-l-[5px] border-l-warning-500';
      case 'MORNO':
        return 'border-l-[5px] border-l-primary-500';
      case 'FRIO':
      default:
        return 'border-l-[5px] border-l-neutral-300 dark:border-l-neutral-700';
    }
  };

  // Determinar a cor do indicador de prioridade
  const getPriorityBadgeClass = (priority: string) => {
    switch (priority) {
      case 'ALTA':
        return 'text-red-700 bg-red-50 dark:text-red-300 dark:bg-red-950/20 border border-red-200/50 dark:border-red-900/30';
      case 'BAIXA':
        return 'text-neutral-500 bg-neutral-100 dark:text-neutral-400 dark:bg-neutral-800 border border-neutral-200/50 dark:border-neutral-700/20';
      case 'MEDIA':
      default:
        return 'text-amber-700 bg-amber-50 dark:text-amber-300 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-900/30';
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

  // Drag and Drop handlers
  const handleDragStart = (e: React.DragEvent, leadId: string) => {
    e.dataTransfer.setData('text/plain', leadId);
    e.dataTransfer.effectAllowed = 'move';
    setDraggedLeadId(leadId);
  };

  const handleDragEnd = () => {
    setDraggedLeadId(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, targetStage: string) => {
    e.preventDefault();
    const leadId = e.dataTransfer.getData('text/plain');
    if (!leadId) return;

    // Se mover para descarte, abrimos o modal de justificativa
    if (targetStage === 'DESCARTADO') {
      setLossLeadId(leadId);
      setShowLossModal(true);
      return;
    }

    try {
      const token = getToken();
      const res = await fetch(`/api/leads/${leadId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ funnelStage: targetStage })
      });

      if (res.ok) {
        toast.success('Etapa do lead atualizada!');
        fetchLeads();
      } else {
        throw new Error();
      }
    } catch (error) {
      console.error(error);
      toast.error('Erro ao atualizar etapa do lead.');
    }
  };

  // Cadastrar lead individual
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const onSubmitLead = async (data: any) => {
    const leadData = data as LeadCreateValues;
    try {
      const token = getToken();
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(leadData)
      });

      if (res.ok) {
        const created = await res.json();
        toast.success(`Lead cadastrado! Score: ${created.score}/100`);
        setShowCreateModal(false);
        resetLead();
        fetchLeads();
      } else {
        const err = await res.json();
        throw new Error(err.error || 'Erro ao criar lead');
      }
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : 'Erro ao cadastrar lead.');
    }
  };

  // Preview da importação em lote (quando o texto muda)
  const handleBulkTextChange = (text: string) => {
    setBulkCsvText(text);
    const lines = text.split('\n').filter(l => l.trim());
    const preview = lines.map(line => {
      const columns = line.split(',');
      return {
        name: columns[0]?.trim() || '',
        phone: columns[1]?.trim() || undefined,
        email: columns[2]?.trim() || undefined,
        channel: columns[3]?.trim() || 'WhatsApp',
        campaign: columns[4]?.trim() || undefined,
      };
    }).filter(item => item.name);
    setBulkPreview(preview);
  };

  // Processar e cadastrar lote de leads
  const handleImportBulkLeads = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulkCsvText.trim()) return;

    setSubmittingBulk(true);
    try {
      const lines = bulkCsvText.split('\n').filter(l => l.trim());
      const parsedLeads = lines.map(line => {
        const columns = line.split(',');
        return {
          name: columns[0]?.trim(),
          phone: columns[1]?.trim() || null,
          email: columns[2]?.trim() || null,
          channel: columns[3]?.trim() || 'WhatsApp',
          campaign: columns[4]?.trim() || null,
        };
      }).filter(item => item.name);

      if (parsedLeads.length === 0) {
        toast.error('Nenhum dado válido para importação.');
        setSubmittingBulk(false);
        return;
      }

      const token = getToken();
      const res = await fetch('/api/leads/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ leads: parsedLeads })
      });

      if (res.ok) {
        const result = await res.json();
        const errorMsg = result.errors?.length > 0
          ? ` (${result.errors.length} erros ignorados)`
          : '';
        toast.success(`${result.count} leads importados com sucesso!${errorMsg}`);
        setShowBulkModal(false);
        setBulkCsvText('');
        setBulkPreview([]);
        fetchLeads();
      } else {
        const err = await res.json();
        throw new Error(err.error || 'Erro na importação');
      }
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : 'Erro ao importar contatos.');
    } finally {
      setSubmittingBulk(false);
    }
  };

  // Confirmar Descarte/Perda de Lead
  const handleConfirmLoss = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lossLeadId) return;

    setSubmittingLoss(true);
    try {
      const token = getToken();
      const res = await fetch(`/api/leads/${lossLeadId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ 
          funnelStage: 'DESCARTADO',
          lossReason,
          lossNotes
        })
      });

      if (res.ok) {
        toast.success('Lead desqualificado com sucesso.');
        setShowLossModal(false);
        setLossLeadId(null);
        setLossNotes('');
        fetchLeads();
      } else {
        throw new Error();
      }
    } catch (error) {
      console.error(error);
      toast.error('Erro ao desqualificar lead.');
    } finally {
      setSubmittingLoss(false);
    }
  };

  const handleDeleteLead = async () => {
    if (!deleteLeadId) return;
    try {
      const token = getToken();
      const res = await fetch(`/api/leads/${deleteLeadId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        toast.success('Lead excluído com sucesso!');
        setShowDeleteModal(false);
        setDeleteLeadId(null);
        setSelectedLeadId(null); // Fecha o drawer se estiver aberto
        fetchLeads();
      } else {
        toast.error('Erro ao excluir lead.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Erro ao excluir lead.');
    }
  };

  // Ação rápida: Alterar prioridade diretamente do card
  const handleQuickPriorityChange = async (e: React.MouseEvent, leadId: string, currentPriority: string) => {
    e.stopPropagation();
    const nextPriorityMap: { [key: string]: string } = {
      'BAIXA': 'MEDIA',
      'MEDIA': 'ALTA',
      'ALTA': 'BAIXA'
    };
    const newPriority = nextPriorityMap[currentPriority] || 'MEDIA';
    
    try {
      const token = getToken();
      const res = await fetch(`/api/leads/${leadId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ priority: newPriority })
      });

      if (res.ok) {
        toast.success(`Prioridade alterada para ${newPriority}!`);
        fetchLeads();
      }
    } catch (err) {
      console.error(err);
      toast.error('Erro ao alterar prioridade do lead.');
    }
  };

  // Ação rápida: Qualificar e encaminhar diretamente do card
  const handleQuickQualify = async (e: React.MouseEvent, leadId: string) => {
    e.stopPropagation();
    try {
      const token = getToken();
      const res = await fetch(`/api/leads/${leadId}/qualify`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (res.ok) {
        const data = await res.json();
        toast.success('Lead qualificado! Orçamento gerado com sucesso.');
        fetchLeads();
      }
    } catch (err) {
      console.error(err);
      toast.error('Erro ao qualificar lead.');
    }
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 min-h-[calc(100vh-4rem)] flex flex-col space-y-6 bg-neutral-50 dark:bg-neutral-950 transition-colors duration-300">
      
      {/* Cabeçalho CRM */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-neutral-200/60 dark:border-neutral-800/60">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-neutral-50 flex items-center gap-2">
            <Target className="w-7 h-7 text-primary-600" />
            Pré-Vendas & CRM
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            Funil curto de qualificação, triagem de oportunidades e encaminhamento rápido para Orçamentos.
          </p>
        </div>
        
        <div className="flex items-center gap-2 flex-wrap">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setShowBulkModal(true)}
            icon={<Upload className="w-4 h-4" />}
          >
            Importar em Lote
          </Button>

          <Button 
            variant="primary" 
            size="sm"
            onClick={() => setShowCreateModal(true)}
            icon={<UserPlus className="w-4 h-4" />}
          >
            Novo Lead
          </Button>

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
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, stage.id)}
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
                <div className="flex flex-col gap-2 flex-1 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-neutral-200 dark:scrollbar-thumb-neutral-800">
                  {stageLeads.map(lead => (
                    <div
                      key={lead.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, lead.id)}
                      onDragEnd={handleDragEnd}
                    >
                      <LeadCardRich
                        lead={lead}
                        onClick={() => setSelectedLeadId(lead.id)}
                        onQuickAction={(action, leadId) => {
                          if (action === 'qualify') handleQuickQualify({ stopPropagation: () => {} } as any, leadId);
                          else if (action === 'discard') {
                            setLossLeadId(leadId);
                            setShowLossModal(true);
                          }
                          else if (action === 'contact') {
                            toast.success('Abrir registro de contato...');
                          }
                          else if (action === 'followup') {
                            toast.success('Abrir registro de follow-up...');
                          }
                          else if (action === 'schedule') {
                            toast.success('Abrir agendamento...');
                          }
                          else if (action === 'reassign') {
                            toast.success('Abrir reatribuição...');
                          }
                          else if (action === 'delete') {
                            setDeleteLeadId(leadId);
                            setShowDeleteModal(true);
                          }
                        }}
                        onPriorityChange={async (leadId, newPriority) => {
                          try {
                            const token = getToken();
                            const res = await fetch(`/api/leads/${leadId}`, {
                              method: 'PUT',
                              headers: {
                                'Content-Type': 'application/json',
                                Authorization: `Bearer ${token}`
                              },
                              body: JSON.stringify({ priority: newPriority })
                            });
                            if (res.ok) {
                              toast.success(`Prioridade alterada para ${newPriority}!`);
                              fetchLeads();
                            } else {
                              toast.error('Erro ao alterar prioridade.');
                            }
                          } catch {
                            toast.error('Erro ao alterar prioridade.');
                          }
                        }}
                      />
                    </div>
                  ))}

                  {/* Empty state da coluna */}
                  {stageLeads.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-10 px-4 border border-dashed border-neutral-200 dark:border-neutral-800/80 rounded-lg bg-neutral-50/40 dark:bg-neutral-900/10 gap-1.5">
                      <Users className="w-6 h-6 text-neutral-300 dark:text-neutral-700 mb-1" />
                      <p className="text-xs text-neutral-400 dark:text-neutral-500 font-bold text-center">
                        Coluna sem leads
                      </p>
                      <p className="text-[10px] text-neutral-400 dark:text-neutral-600 text-center max-w-[180px]">
                        Arraste um contato para esta etapa ou crie um novo lead no botão acima.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Drawer lateral de Detalhes */}
      {selectedLeadId && (
        <LeadDetailsDrawer
          leadId={selectedLeadId}
          onClose={() => setSelectedLeadId(null)}
          onLeadUpdated={fetchLeads}
          token={getToken() || ''}
        />
      )}

      {/* Modal Criar Lead Manual */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-neutral-950/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl max-w-lg w-full p-6 space-y-4 shadow-2xl animate-scale-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-3">
              <h3 className="font-extrabold text-lg text-neutral-900 dark:text-neutral-50 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-primary-500" />
                Cadastrar Novo Lead
              </h3>
              <button onClick={() => { setShowCreateModal(false); resetLead(); }} className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Preview de Score */}
            <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-primary-50 to-success-50 dark:from-primary-950/30 dark:to-success-950/20 rounded-lg border border-primary-200/50 dark:border-primary-800/30">
              <Sparkles className="w-5 h-5 text-primary-600 dark:text-primary-400" />
              <div className="flex-1">
                <p className="text-[10px] font-bold uppercase tracking-wider text-primary-600 dark:text-primary-400">Score Estimado</p>
                <p className="text-lg font-extrabold text-primary-700 dark:text-primary-300">{previewScore}/100</p>
              </div>
              <div className={`px-2 py-1 rounded-md text-[10px] font-bold ${
                previewScore >= 70 ? 'bg-success-100 text-success-700 dark:bg-success-900/30 dark:text-success-300'
                : previewScore >= 40 ? 'bg-warning-100 text-warning-700 dark:bg-warning-900/30 dark:text-warning-300'
                : 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400'
              }`}>
                {previewScore >= 70 ? 'QUENTE' : previewScore >= 40 ? 'MORNO' : 'FRIO'}
              </div>
            </div>

            <form onSubmit={handleSubmitLead(onSubmitLead)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1 col-span-2">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Nome do Lead *</label>
                  <input 
                    type="text"
                    {...registerLead('name')}
                    className="p-2 text-xs rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200 focus:ring-1 focus:ring-primary-500"
                    placeholder="Nome completo do contato"
                  />
                  {leadErrors.name && <span className="text-[10px] text-red-500">{leadErrors.name.message}</span>}
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Celular / WhatsApp</label>
                  <input 
                    type="text"
                    {...registerLead('phone')}
                    className="p-2 text-xs rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200 focus:ring-1 focus:ring-primary-500 font-mono"
                    placeholder="(00) 00000-0000"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">E-mail</label>
                  <input 
                    type="email"
                    {...registerLead('email')}
                    className="p-2 text-xs rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200 focus:ring-1 focus:ring-primary-500"
                    placeholder="exemplo@email.com"
                  />
                  {leadErrors.email && <span className="text-[10px] text-red-500">{leadErrors.email.message}</span>}
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Canal de Origem *</label>
                  <select 
                    {...registerLead('channel')}
                    className="p-2 text-xs rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200 focus:ring-1 focus:ring-primary-500"
                  >
                    <option value="WhatsApp">WhatsApp</option>
                    <option value="Instagram">Instagram</option>
                    <option value="Google Ads">Google Ads</option>
                    <option value="Indicação">Indicação</option>
                    <option value="Facebook">Facebook</option>
                    <option value="Telefone">Telefone</option>
                    <option value="Site">Site Institucional</option>
                  </select>
                  {leadErrors.channel && <span className="text-[10px] text-red-500">{leadErrors.channel.message}</span>}
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Campanha</label>
                  <input 
                    type="text"
                    {...registerLead('campaign')}
                    className="p-2 text-xs rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200 focus:ring-1 focus:ring-primary-500"
                    placeholder="Ex: Campanha Julho OS"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Prioridade</label>
                  <select 
                    {...registerLead('priority')}
                    className="p-2 text-xs rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200 focus:ring-1 focus:ring-primary-500 font-bold"
                  >
                    <option value="BAIXA">Baixa</option>
                    <option value="MEDIA">Média</option>
                    <option value="ALTA">Alta</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Valor Previsto (R$)</label>
                  <input 
                    type="number"
                    step="0.01"
                    {...registerLead('estimatedValue', { valueAsNumber: true })}
                    className="p-2 text-xs rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200 focus:ring-1 focus:ring-primary-500 font-bold"
                    placeholder="1500"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Intenção</label>
                  <select 
                    {...registerLead('intention')}
                    className="p-2 text-xs rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200 focus:ring-1 focus:ring-primary-500"
                  >
                    <option value="PESQUISANDO">Apenas pesquisando</option>
                    <option value="COMPARANDO">Comparando opções</option>
                    <option value="PRONTO_PARA_ORCAMENTO">Pronto para orçamento</option>
                    <option value="PRONTO_PARA_FECHAMENTO">Pronto para fechamento</option>
                    <option value="ACOMPANHAR_DEPOIS">Acompanhamento posterior</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Responsável</label>
                  <select 
                    {...registerLead('responsavelId')}
                    className="p-2 text-xs rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200 focus:ring-1 focus:ring-primary-500"
                  >
                    <option value="">Sem responsável</option>
                    {users.map(u => (
                      <option key={u.id} value={u.id}>{u.name}</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1 col-span-2">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Temperatura Comercial</label>
                  <div className="flex gap-4 mt-1">
                    {['FRIO', 'MORNO', 'QUENTE', 'URGENTE'].map(t => (
                      <label key={t} className="flex items-center gap-1.5 text-xs text-neutral-700 dark:text-neutral-300 cursor-pointer">
                        <input 
                          type="radio" 
                          {...registerLead('status')}
                          value={t}
                        />
                        {t}
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-1 col-span-2">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Observações Iniciais</label>
                  <textarea 
                    {...registerLead('notes')}
                    className="p-2 text-xs rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200 focus:ring-1 focus:ring-primary-500"
                    rows={3}
                    placeholder="Anotações ou solicitações do lead no primeiro contato..."
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 border-t border-neutral-100 dark:border-neutral-800 pt-3">
                <Button variant="outline" size="sm" type="button" onClick={() => { setShowCreateModal(false); resetLead(); }}>
                  Cancelar
                </Button>
                <Button variant="primary" size="sm" type="submit" isLoading={submittingLead} className="font-bold px-6">
                  Salvar Lead
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Descartar Lead com Justificativa */}
      {showLossModal && (
        <div className="fixed inset-0 bg-neutral-950/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-scale-in">
            <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-3">
              <h3 className="font-extrabold text-lg text-neutral-900 dark:text-neutral-50 flex items-center gap-2">
                <XCircle className="w-5 h-5 text-red-500" />
                Desqualificar e Descartar Lead
              </h3>
              <button onClick={() => { setShowLossModal(false); setLossLeadId(null); }} className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmLoss} className="space-y-4">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Motivo de Desqualificação</label>
                <select 
                  className="p-2.5 text-xs rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200 focus:ring-1 focus:ring-primary-500"
                  value={lossReason}
                  onChange={(e) => setLossReason(e.target.value)}
                >
                  <option value="SEM_ORCAMENTO">Sem orçamento</option>
                  <option value="SEM_TIMING">Sem timing</option>
                  <option value="SEM_NECESSIDADE">Sem necessidade</option>
                  <option value="SEM_AUTORIDADE">Sem autoridade</option>
                  <option value="FORA_DE_PERFIL">Fora de perfil</option>
                  <option value="CONCORRENCIA">Concorrência</option>
                  <option value="RETORNO_FUTURO">Retorno futuro</option>
                  <option value="CONTATO_INVALIDO">Contato inválido</option>
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Anotações do Descarte</label>
                <textarea 
                  required
                  className="p-2 text-xs rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200 focus:ring-1 focus:ring-primary-500"
                  rows={3}
                  placeholder="Justifique o motivo do descarte comercial..."
                  value={lossNotes}
                  onChange={(e) => setLossNotes(e.target.value)}
                />
              </div>

              <div className="flex justify-end gap-2 border-t border-neutral-100 dark:border-neutral-800 pt-3">
                <Button variant="outline" size="sm" type="button" onClick={() => { setShowLossModal(false); setLossLeadId(null); }}>
                  Cancelar
                </Button>
                <Button variant="primary" size="sm" type="submit" isLoading={submittingLoss} className="font-bold px-6 bg-red-600 hover:bg-red-700 text-white">
                  Descartar Lead
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Importar Leads em Lote */}
      {showBulkModal && (
        <div className="fixed inset-0 bg-neutral-950/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl max-w-xl w-full p-6 space-y-4 shadow-2xl animate-scale-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-3">
              <h3 className="font-extrabold text-lg text-neutral-900 dark:text-neutral-50 flex items-center gap-2">
                <Upload className="w-5 h-5 text-primary-500" />
                Importar Contatos em Lote (CSV)
              </h3>
              <button onClick={() => { setShowBulkModal(false); setBulkCsvText(''); setBulkPreview([]); }} className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-neutral-50 dark:bg-neutral-950/20 border border-neutral-200/40 dark:border-neutral-800/40 rounded-lg text-xs text-neutral-500 space-y-1">
              <p className="font-bold">Como funciona a importação:</p>
              <p>Cole as informações dos leads abaixo, um contato por linha, no formato CSV:</p>
              <p className="font-mono bg-neutral-100 dark:bg-neutral-800 p-1.5 rounded mt-1.5 font-bold">
                Nome completo, Celular, E-mail, Origem, Campanha
              </p>
              <p className="font-bold text-[10px] text-primary-600 uppercase pt-1">Exemplo prático:</p>
              <p className="font-mono bg-neutral-100 dark:bg-neutral-800 p-1.5 rounded">
                João Silva, (11) 98888-7777, joao@email.com, Instagram, Promocional Julho<br/>
                Maria Souza, (21) 97777-6666, maria@email.com, WhatsApp, Orgânico
              </p>
            </div>

            <form onSubmit={handleImportBulkLeads} className="space-y-4">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Cole a Lista de Contatos</label>
                <textarea 
                  required
                  className="p-2.5 text-xs rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200 focus:ring-1 focus:ring-primary-500 font-mono"
                  rows={8}
                  placeholder="Nome, Telefone, Email, Canal, Campanha"
                  value={bulkCsvText}
                  onChange={(e) => handleBulkTextChange(e.target.value)}
                />
              </div>

              {/* Preview dos leads detectados */}
              {bulkPreview.length > 0 && (
                <div className="space-y-2">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                    Preview — {bulkPreview.length} lead{bulkPreview.length !== 1 ? 's' : ''} detectado{bulkPreview.length !== 1 ? 's' : ''}
                  </p>
                  <div className="max-h-40 overflow-y-auto border border-neutral-200 dark:border-neutral-800 rounded-lg divide-y divide-neutral-100 dark:divide-neutral-800">
                    {bulkPreview.slice(0, 10).map((item, idx) => (
                      <div key={idx} className="px-3 py-2 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-neutral-800 dark:text-neutral-200">{item.name}</span>
                          {item.phone && <span className="text-neutral-400 font-mono">{item.phone}</span>}
                        </div>
                        <Badge variant="primary" size="sm" className="text-[9px]">{item.channel}</Badge>
                      </div>
                    ))}
                    {bulkPreview.length > 10 && (
                      <div className="px-3 py-2 text-[10px] text-neutral-400 text-center">
                        +{bulkPreview.length - 10} leads adicionais...
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 border-t border-neutral-100 dark:border-neutral-800 pt-3">
                <Button variant="outline" size="sm" type="button" onClick={() => { setShowBulkModal(false); setBulkCsvText(''); setBulkPreview([]); }}>
                  Cancelar
                </Button>
                <Button variant="primary" size="sm" type="submit" isLoading={submittingBulk} className="font-bold px-6" disabled={bulkPreview.length === 0}>
                  Importar {bulkPreview.length > 0 ? `${bulkPreview.length} Leads` : ''}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Excluir Lead */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-neutral-950/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl max-w-sm w-full p-6 space-y-4 shadow-2xl animate-scale-in">
            <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-3">
              <h3 className="font-extrabold text-lg text-neutral-900 dark:text-neutral-50 flex items-center gap-2">
                <Trash2 className="w-5 h-5 text-red-500" />
                Excluir Lead
              </h3>
              <button onClick={() => { setShowDeleteModal(false); setDeleteLeadId(null); }} className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              Tem certeza que deseja excluir permanentemente este lead? Esta ação não pode ser desfeita.
            </p>

            <div className="flex justify-end gap-2 border-t border-neutral-100 dark:border-neutral-800 pt-3">
              <Button variant="outline" size="sm" type="button" onClick={() => { setShowDeleteModal(false); setDeleteLeadId(null); }}>
                Cancelar
              </Button>
              <Button variant="primary" size="sm" type="button" onClick={handleDeleteLead} className="font-bold px-6 bg-red-600 hover:bg-red-700 text-white">
                Excluir
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Estilos CSS Inline de Animação para o Drawer e Modals */}
      <style jsx global>{`
        @keyframes slideIn {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        @keyframes scaleIn {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .animate-slide-in {
          animation: slideIn 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .animate-scale-in {
          animation: scaleIn 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
    </div>
  );
}
