import { NotificationQueue } from '../src/modules/notifications/queue/notification.queue';
import { NotificationsService } from '../src/modules/notifications/notifications.service';
import { TwilioSmsProvider } from '../src/modules/notifications/providers/twilio-sms.provider';
import { TwilioWhatsAppProvider } from '../src/modules/notifications/providers/twilio-whatsapp.provider';
import { ResendEmailProvider } from '../src/modules/notifications/providers/resend-email.provider';

async function runTests() {
  console.log('=== INICIANDO TESTES DO MODULE DE NOTIFICAÇÕES ===');

  const sms = new TwilioSmsProvider();
  const wa = new TwilioWhatsAppProvider();
  const email = new ResendEmailProvider();
  const queue = new NotificationQueue(sms, wa, email);
  const service = new NotificationsService(queue);

  // Teste 1: Enfileirar e Processar Imediato
  console.log('\n--- Teste 1: Enfileiramento e Processo de Sucesso ---');
  const result1 = await queue.add('sms_job', {
    to: '+5511999999999',
    message: 'Olá, teste de sucesso imediato!',
    notification_id: 'notif_success_123',
  });

  if (!result1.success || !result1.jobId) {
    throw new Error('Falha ao adicionar job de SMS');
  }
  console.log('Job adicionado:', result1.jobId);

  // Aguarda processamento assíncrono do setTimeout
  let status1 = await queue.getJobStatus(result1.jobId);
  while (status1 === 'pending' || status1 === 'processing') {
    await new Promise((resolve) => setTimeout(resolve, 50));
    status1 = await queue.getJobStatus(result1.jobId);
  }
  console.log('Status do Job 1:', status1);
  if (status1 !== 'completed') throw new Error('Job 1 deveria ter sido concluído com sucesso');

  // Teste 2: Idempotência
  console.log('\n--- Teste 2: Idempotência (Duas chamadas com mesmo ID) ---');
  const idUnique = 'notif_idempotency_unique_999';
  const r1 = await queue.add('whatsapp_job', {
    to: '+5511888888888',
    message: 'Mensagem única',
    notification_id: idUnique,
  });
  const r2 = await queue.add('whatsapp_job', {
    to: '+5511888888888',
    message: 'Mensagem repetida',
    notification_id: idUnique,
  });

  console.log('Primeira inserção duplicate?:', r1.duplicate);
  console.log('Segunda inserção duplicate?:', r2.duplicate);
  if (r1.duplicate !== undefined || r2.duplicate !== true) {
    throw new Error('Falha no controle de idempotência');
  }

  // Teste 3: Retry automático de 3x e envio para DLQ
  console.log('\n--- Teste 3: Retry automático e DLQ ---');
  // Ajustamos temporariamente o backoff para não esperar minutos no teste
  (queue as any).backoffTimes = [10, 20, 30];

  const result3 = await queue.add('sms_job', {
    to: 'fail-sms-mock-number',
    message: 'Isto irá falhar 3x',
    notification_id: 'notif_fail_retry_123',
  });

  let status3 = await queue.getJobStatus(result3.jobId!);
  while (status3 === 'pending' || status3 === 'processing') {
    await new Promise((resolve) => setTimeout(resolve, 50));
    status3 = await queue.getJobStatus(result3.jobId!);
  }

  console.log('Status final do Job 3:', status3);
  const dlqCount = await queue.getFailedCount();
  console.log('Total na DLQ:', dlqCount);

  if (status3 !== 'failed' || dlqCount !== 1) {
    throw new Error('Job 3 deveria ter falhado e ido para a DLQ');
  }

  console.log('\n=== TODOS OS TESTES PASSARAM COM SUCESSO! ===');
}

runTests().catch(err => {
  console.error('Falha nos testes:', err);
  process.exit(1);
});
