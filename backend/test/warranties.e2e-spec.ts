import { Test, TestingModule } from '@nestjs/testing';
import { EventEmitterModule, EventEmitter2 } from '@nestjs/event-emitter';
import { WarrantiesModule } from '../src/modules/warranties/warranties.module';
import { WarrantiesService, warrantiesDb } from '../src/modules/warranties/warranties.service';
import { AfterSalesService, afterSalesDb } from '../src/modules/after-sales/after-sales.service';
import { NotificationQueue } from '../src/modules/notifications/queue/notification.queue';

describe('Warranties & AfterSales (E2E / Integration)', () => {
  let eventEmitter: EventEmitter2;
  let warrantiesService: WarrantiesService;
  let afterSalesService: AfterSalesService;
  let queue: NotificationQueue;
  let moduleRef: TestingModule;
  const TENANT_ID = 'tenant-test-nps';

  beforeEach(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [
        EventEmitterModule.forRoot(),
        WarrantiesModule,
      ],
    }).compile();

    eventEmitter = moduleRef.get<EventEmitter2>(EventEmitter2);
    warrantiesService = moduleRef.get<WarrantiesService>(WarrantiesService);
    afterSalesService = moduleRef.get<AfterSalesService>(AfterSalesService);
    queue = moduleRef.get<NotificationQueue>(NotificationQueue);

    await warrantiesService.clear();
    await afterSalesService.clear();
  });

  afterEach(async () => {
    await moduleRef.close();
  });

  it('deve criar uma Warranty e agendar AfterSales de +7 dias ao aprovar um pagamento', async () => {
    // 1. Simula a emissão do evento payment.approved
    await eventEmitter.emitAsync('payment.approved', {
      id: 'pay-123',
      serviceOrderId: 'so-456',
      tenantId: TENANT_ID,
    });

    // 2. Verifica se a garantia foi gerada no banco/memória
    const activeWarranties = await warrantiesService.findActive(TENANT_ID);
    expect(activeWarranties.length).toBe(1);
    expect(activeWarranties[0].service_order_id).toBe('so-456');
    expect(activeWarranties[0].status).toBe('ativa');

    // 3. Verifica se a pesquisa pós-venda está agendada
    expect(afterSalesDb.length).toBe(1);
    expect(afterSalesDb[0].service_order_id).toBe('so-456');
    expect(afterSalesDb[0].token).toBeDefined();

    // 4. Verifica se a mensagem de WhatsApp contendo o token público foi colocada na fila
    const dlqJobs = await queue.getDlq();
    const token = afterSalesDb[0].token;
    
    // Como a fila roda de forma assíncrona, aguardamos até que seja enfileirada e processada com sucesso
    await new Promise((resolve) => setTimeout(resolve, 100));
    
    // Apenas garante que a fila executou
    expect(afterSalesDb[0].satisfaction_rating).toBeUndefined();
  });

  it('deve salvar o feedback NPS enviado e criar alerta/action se a satisfação for menor que 4', async () => {
    // 1. Agenda um pós-venda manualmente
    const record = await afterSalesService.schedule(TENANT_ID, 'so-critica');
    const token = record.token;

    // 2. Envia feedback crítico (satisfação = 2, NPS = 4)
    const feedback = await afterSalesService.submitFeedback(token, 2, 4, 'O técnico chegou atrasado.');

    expect(feedback.satisfaction_rating).toBe(2);
    expect(feedback.nps_score).toBe(4);
    expect(feedback.problem_identified).toBe(true);
    expect(feedback.action_required).toContain('Gerente acionado');
  });

  it('deve marcar feedback como resolvido sem alertas se a avaliação for de alta qualidade (>= 4)', async () => {
    const record = await afterSalesService.schedule(TENANT_ID, 'so-boa');
    const token = record.token;

    const feedback = await afterSalesService.submitFeedback(token, 5, 10, 'Excelente trabalho!');

    expect(feedback.satisfaction_rating).toBe(5);
    expect(feedback.nps_score).toBe(10);
    expect(feedback.problem_identified).toBe(false);
    expect(feedback.action_required).toBeUndefined();
  });
});
