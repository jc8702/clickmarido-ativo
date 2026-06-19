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
export declare class NotificationQueue {
    private readonly smsProvider;
    private readonly whatsappProvider;
    private readonly emailProvider;
    private readonly logger;
    private jobs;
    private dlq;
    private processedNotifications;
    private backoffTimes;
    constructor(smsProvider: TwilioSmsProvider, whatsappProvider: TwilioWhatsAppProvider, emailProvider: ResendEmailProvider);
    add(type: 'sms_job' | 'email_job' | 'whatsapp_job', data: any): Promise<{
        success: boolean;
        jobId?: string;
        duplicate?: boolean;
    }>;
    private processJob;
    getFailedCount(): Promise<number>;
    getDlq(): Promise<Job[]>;
    clearDlq(): Promise<void>;
    getJobStatus(jobId: string): Promise<'pending' | 'processing' | 'completed' | 'failed' | null>;
}
