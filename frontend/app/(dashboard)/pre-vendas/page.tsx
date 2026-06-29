"use client";

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/Card';
import { Badge } from '@/components/Badge';
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
  RefreshCw 
} from 'lucide-react';

type Lead = {
  id: string;
  name: string;
  phone?: string;
  status: string;
  funnelStage: string;
  source?: { channel: string };
};

const STAGES = [
  { id: 'NOVO_LEAD', title: 'Novo Lead', icon: Users, color: 'bg-blue-100 text-blue-800' },
  { id: 'SEM_CONTATO', title: 'Sem Contato', icon: UserMinus, color: 'bg-zinc-100 text-zinc-800' },
  { id: 'EM_CONTATO', title: 'Em Contato', icon: MessageSquare, color: 'bg-amber-100 text-amber-800' },
  { id: 'CONTATO_REALIZADO', title: 'Contato Realizado', icon: PhoneCall, color: 'bg-indigo-100 text-indigo-800' },
  { id: 'LEAD_QUALIFICADO', title: 'Qualificado', icon: CheckCircle2, color: 'bg-green-100 text-green-800' },
  { id: 'LEAD_NAO_QUALIFICADO', title: 'Não Qualificado', icon: XCircle, color: 'bg-red-100 text-red-800' },
  { id: 'REUNIAO_AGENDADA', title: 'Reunião Agendada', icon: Calendar, color: 'bg-purple-100 text-purple-800' },
  { id: 'COMPARECEU', title: 'Compareceu', icon: ThumbsUp, color: 'bg-emerald-100 text-emerald-800' },
  { id: 'PROPOSTA_SOLICITADA', title: 'Proposta Solicitada', icon: FileText, color: 'bg-yellow-100 text-yellow-800' },
  { id: 'PROPOSTA_ENVIADA', title: 'Proposta Enviada', icon: Send, color: 'bg-sky-100 text-sky-800' },
  { id: 'EM_NEGOCIACAO', title: 'Em Negociação', icon: Handshake, color: 'bg-teal-100 text-teal-800' },
  { id: 'GANHO', title: 'Ganho', icon: Trophy, color: 'bg-emerald-500 text-white' },
  { id: 'PERDIDO', title: 'Perdido', icon: Frown, color: 'bg-rose-100 text-rose-800' },
  { id: 'SEM_RESPOSTA', title: 'Sem Resposta', icon: Clock, color: 'bg-slate-100 text-slate-800' },
  { id: 'REATIVADO', title: 'Reativado', icon: RefreshCw, color: 'bg-violet-100 text-violet-800' },
];

export default function PreVendasPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/leads')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setLeads(data);
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-6 h-full flex flex-col space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Pré-Vendas & CRM</h1>
      </div>
      
      {loading ? (
        <p>Carregando pipeline...</p>
      ) : (
        <div className="flex flex-1 gap-4 overflow-x-auto pb-4">
          {STAGES.map((stage) => {
            const stageLeads = leads.filter(l => l.funnelStage === stage.id);
            const Icon = stage.icon;

            return (
              <div key={stage.id} className="flex-shrink-0 w-80 bg-slate-50/50 rounded-xl p-4 flex flex-col border">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Icon className="w-5 h-5 text-slate-500" />
                    <h3 className="font-semibold text-slate-700">{stage.title}</h3>
                  </div>
                  <Badge variant="neutral" size="sm">
                    {stageLeads.length}
                  </Badge>
                </div>

                <div className="flex flex-col gap-3 flex-1 overflow-y-auto">
                  {stageLeads.map(lead => (
                    <Card key={lead.id} className="cursor-pointer hover:border-blue-350 transition-colors">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-medium text-sm line-clamp-1">{lead.name}</h4>
                          {lead.source && (
                            <Badge variant="neutral" size="sm" className="text-[10px]">
                              {lead.source.channel}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 mb-2">{lead.phone || 'Sem telefone'}</p>
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${stage.color}`}>
                            {lead.status}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {stageLeads.length === 0 && (
                    <div className="text-center py-8 border border-dashed rounded-lg border-neutral-300">
                      <p className="text-xs text-neutral-400">Nenhum lead</p>
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
