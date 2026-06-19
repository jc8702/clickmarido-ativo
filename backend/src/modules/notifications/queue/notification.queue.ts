import { Injectable, Logger } from '@nestjs/common';
import { TwilioSmsProvider } from '../providers/twilio-sms.provider';
import { TwilioWhatsAppProvider } from '../providers/twilio-whatsapp.provider';
import { ResendEmailProvider } from '../providers/resend-email.provider';

export interface Job {
  id: string;
  type: 'sms_job' | 'email_job' | 'whatsapp_job';
  data: any;
  attempts: number;
  maxAttempts: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  errorHistory: string[];
}

@Injectable()
export class NotificationQueue {
  private readonly logger = new Logger(NotificationQueue.name);
  
  // Banco de dados em memória para simular o Redis/Bull
  private jobs: Map<string, Job> = new Map();
  private dlq: Job[] = [];
  private processedNotifications: Set<string> = new Set(); // Controle de idempotência

  // Backoffs configurados: [1s, 5s, 30s] (convertidos em ms para o setTimeout)
  private backoffTimes = [1000, 5000, 30000];

  constructor(
    private readonly smsProvider: TwilioSmsProvider,
    private readonly whatsappProvider: TwilioWhatsAppProvider,
    private readonly emailProvider: ResendEmailProvider,
  ) {}

  async add(type: 'sms_job' | 'email_job' | 'whatsapp_job', data: any): Promise<{ success: boolean; jobId?: string; duplicate?: boolean }> {
    const notificationId = data.notification_id;

    // 1. Verificação de idempotência
    if (notificationId && this.processedNotifications.has(notificationId)) {
      this.logger.warn(`[IDEMPOTÊNCIA] Job com notification_id ${notificationId} já foi processado/ignorado.`);
      return { success: true, duplicate: true };
    }

    const jobId = `job_${Math.random().toString(36).substring(7)}`;
    const newJob: Job = {
      id: jobId,
      type,
      data,
      attempts: 0,
      maxAttempts: 3,
      status: 'pending',
      errorHistory: [],
    };

    this.jobs.set(jobId, newJob);
    this.logger.log(`Job ${jobId} do tipo ${type} enfileirado com sucesso.`);

    // Inicia processamento assíncrono (não-bloqueante, emula Bull)
    this.processJob(jobId);

    return { success: true, jobId };
  }

  private async processJob(jobId: string) {
    const job = this.jobs.get(jobId);
    if (!job) return;

    job.status = 'processing';
    job.attempts++;

    try {
      let result: { success: boolean; error?: any };

      switch (job.type) {
        case 'sms_job':
          result = await this.smsProvider.sendSms(job.data.to, job.data.message);
          break;
        case 'whatsapp_job':
          result = await this.whatsappProvider.sendWhatsApp(job.data.to, job.data.message);
          break;
        case 'email_job':
          result = await this.emailProvider.sendEmail(job.data.to, job.data.subject, job.data.body);
          break;
      }

      if (result.success) {
        job.status = 'completed';
        if (job.data.notification_id) {
          this.processedNotifications.add(job.data.notification_id);
        }
        this.logger.log(`[Job Success] Job ${job.id} concluído na tentativa ${job.attempts}`);
      } else {
        throw new Error(result.error || 'Erro desconhecido no provedor');
      }

    } catch (err: any) {
      const errorMsg = err.message || String(err);
      job.errorHistory.push(errorMsg);

      this.logger.error(`[Job Failure] Tentativa ${job.attempts}/${job.maxAttempts} falhou para o Job ${job.id}. Erro: ${errorMsg}`);

      if (job.attempts < job.maxAttempts) {
        job.status = 'pending';
        const delay = this.backoffTimes[job.attempts - 1] || 1000;
        this.logger.warn(`Agendando nova tentativa para o Job ${job.id} em ${delay}ms`);
        setTimeout(() => this.processJob(jobId), delay);
      } else {
        job.status = 'failed';
        this.dlq.push(job);
        this.logger.error(`[DLQ] Job ${job.id} excedeu o limite de tentativas e foi movido para a Dead Letter Queue (DLQ). Alerta admin!`);
      }
    }
  }

  async getFailedCount(): Promise<number> {
    return this.dlq.length;
  }

  async getDlq(): Promise<Job[]> {
    return this.dlq;
  }

  async clearDlq() {
    this.dlq = [];
  }

  async getJobStatus(jobId: string): Promise<'pending' | 'processing' | 'completed' | 'failed' | null> {
    const job = this.jobs.get(jobId);
    return job ? job.status : null;
  }
}
