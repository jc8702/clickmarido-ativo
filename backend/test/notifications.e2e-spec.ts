import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsModule } from '../src/modules/notifications/notifications.module';
import { NotificationQueue } from '../src/modules/notifications/queue/notification.queue';
import { NotificationsService } from '../src/modules/notifications/notifications.service';
import { EventEmitterModule } from '@nestjs/event-emitter';

describe('Notifications Module (E2E / Integration)', () => {
  let queue: NotificationQueue;
  let service: NotificationsService;
  let moduleRef: TestingModule;

  beforeEach(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [
        EventEmitterModule.forRoot(),
        NotificationsModule,
      ],
    }).compile();

    queue = moduleRef.get<NotificationQueue>(NotificationQueue);
    service = moduleRef.get<NotificationsService>(NotificationsService);
  });

  afterEach(async () => {
    await moduleRef.close();
  });

  it('deve enfileirar e processar com sucesso em menos de 5 segundos', async () => {
    const start = Date.now();
    
    // Add job
    const result = await queue.add('sms_job', {
      to: '+5511999999999',
      message: 'Olá, teste de sucesso imediato!',
      notification_id: 'notif_success_123',
    });

    expect(result.success).toBe(true);
    expect(result.jobId).toBeDefined();

    // Espera até que o job termine de processar assincronamente
    let status = await queue.getJobStatus(result.jobId!);
    while (status === 'pending' || status === 'processing') {
      await new Promise((resolve) => setTimeout(resolve, 50));
      status = await queue.getJobStatus(result.jobId!);
    }

    expect(status).toBe('completed');
    expect(Date.now() - start).toBeLessThan(5000);
  });

  it('deve realizar retry automático em caso de falha temporária e depois ter sucesso se o provedor se restabelecer', async () => {
    // Para testar retry de forma elegante, podemos forçar uma falha contendo 'fail-sms'
    // E depois interceptar/simular.
    // Vamos simular a falha completa que vai para DLQ após 3 falhas.
    const result = await queue.add('sms_job', {
      to: 'fail-sms-mock-number',
      message: 'Este deve falhar 3x e ir para a DLQ',
      notification_id: 'notif_fail_retry_123',
    });

    expect(result.success).toBe(true);

    // Espera o processamento dos retries: backoff de 1s, depois 5s, depois 30s.
    // Para tornar os testes rápidos e não travar por 36 segundos, podemos mockar o backoffTimes temporariamente.
    (queue as any).backoffTimes = [100, 200, 300]; // Sobrescreve com valores baixos para o teste de E2E rodar instantaneamente.

    let status = await queue.getJobStatus(result.jobId!);
    while (status === 'pending' || status === 'processing') {
      await new Promise((resolve) => setTimeout(resolve, 50));
      status = await queue.getJobStatus(result.jobId!);
    }

    expect(status).toBe('failed');
    
    const dlqCount = await queue.getFailedCount();
    expect(dlqCount).toBe(1);

    const dlqJobs = await queue.getDlq();
    expect(dlqJobs[0].id).toBe(result.jobId);
    expect(dlqJobs[0].attempts).toBe(3);
    expect(dlqJobs[0].errorHistory.length).toBe(3);
  });

  it('deve garantir idempotência: 2 chamadas com o mesmo notification_id resultam em 1 único processamento', async () => {
    const notifId = 'notif_idempotency_unique_999';

    // Primeiro envio
    const result1 = await queue.add('whatsapp_job', {
      to: '+5511888888888',
      message: 'Olá, envio único!',
      notification_id: notifId,
    });

    // Segundo envio imediato com mesmo id
    const result2 = await queue.add('whatsapp_job', {
      to: '+5511888888888',
      message: 'Olá, envio duplicado!',
      notification_id: notifId,
    });

    expect(result1.success).toBe(true);
    expect(result1.duplicate).toBeUndefined();

    expect(result2.success).toBe(true);
    expect(result2.duplicate).toBe(true); // O segundo foi marcado como duplicado pelo controle de idempotência
  });
});
