import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    totalLeads: 145,
    qualifiedLeads: 85,
    winRate: 24,
    avgResponseTime: '15 min',
    leadsBySource: [
      { name: 'WhatsApp', value: 80 },
      { name: 'Instagram', value: 30 },
      { name: 'Google Ads', value: 20 },
      { name: 'Indicação', value: 15 },
    ],
    funnelDrops: [
      { stage: 'Novo Lead', count: 145 },
      { stage: 'Contato', count: 120 },
      { stage: 'Qualificado', count: 85 },
      { stage: 'Proposta', count: 45 },
      { stage: 'Ganho', count: 20 },
    ]
  });
}
