import { Injectable, NotFoundException } from '@nestjs/common';
import { NotificationQueue } from '../notifications/queue/notification.queue';

export interface AfterSales {
  id: string;
  tenantId: string;
  service_order_id: string;
  contact_date: Date;
  satisfaction_rating?: number; // 1-5
  nps_score?: number;           // 0-10
  feedback_text?: string;
  problem_identified?: boolean;
  action_required?: string;
  token: string;
}

export let afterSalesDb: AfterSales[] = [];

@Injectable()
export class AfterSalesService {
  constructor(private readonly notificationQueue: NotificationQueue) {}

  async schedule(tenantId: string, serviceOrderId: string) {
    const afterSalesId = `as_${Math.random().toString(36).substring(7)}`;
    const token = `token_${Math.random().toString(36).substring(10)}`;

    const record: AfterSales = {
      id: afterSalesId,
      tenantId,
      service_order_id: serviceOrderId,
      contact_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // +7 dias
      token,
    };

    afterSalesDb.push(record);

    // Agenda um job no nosso NotificationQueue simulando a fila Bull
    await this.notificationQueue.add('whatsapp_job', {
      to: '+5511999999999', // telefone cliente mock
      message: `Como foi seu atendimento no serviço #${serviceOrderId}? Responda em: https://clickmarido.com/after-sales-form?token=${token}`,
      notification_id: `after_sales_whatsapp_${afterSalesId}`,
    });

    return record;
  }

  async sendFollowUp(afterSalesId: string) {
    const record = afterSalesDb.find(a => a.id === afterSalesId);
    if (!record) throw new NotFoundException('Registro de pós-venda não encontrado');

    console.log(`[WHATSAPP AFTER SALES] Enviando link NPS do token ${record.token} ao cliente`);
    return { success: true };
  }

  async submitFeedback(token: string, rating: number, nps: number, feedback: string) {
    const record = afterSalesDb.find(a => a.token === token);
    if (!record) throw new NotFoundException('Token pós-venda inválido');

    record.satisfaction_rating = rating;
    record.nps_score = nps;
    record.feedback_text = feedback;

    // Escalação e tratamento automático de críticas (Rating < 4)
    if (rating < 4) {
      record.problem_identified = true;
      record.action_required = 'Gerente acionado para agendamento de ajuste grátis';
      
      console.warn(`[NPS ALERT] Nota baixa recebida (${rating}/5). Alerta enviado ao Admin!`);
      // Simula a criação automática de uma nova OS ou Ticket de suporte
    } else {
      record.problem_identified = false;
      console.log(`[NPS SUCCESS] Excelente avaliação recebida: ${rating}/5.`);
    }

    return record;
  }

  async clear() {
    afterSalesDb = [];
  }
}
