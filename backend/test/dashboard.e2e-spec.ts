import { Test, TestingModule } from '@nestjs/testing';
import { EventEmitterModule, EventEmitter2 } from '@nestjs/event-emitter';
import { DashboardModule } from '../src/modules/dashboard/dashboard.module';
import { DashboardService } from '../src/modules/dashboard/dashboard.service';

describe('Dashboard Module (E2E / Integration)', () => {
  let service: DashboardService;
  let eventEmitter: EventEmitter2;
  let moduleRef: TestingModule;
  const TENANT_ID = 'tenant-dash-test';

  beforeEach(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [
        EventEmitterModule.forRoot(),
        DashboardModule,
      ],
    }).compile();

    service = moduleRef.get<DashboardService>(DashboardService);
    eventEmitter = moduleRef.get<EventEmitter2>(EventEmitter2);
  });

  afterEach(async () => {
    await moduleRef.close();
  });

  it('deve armazenar dados no cache e retornar a mesma instância computada em chamadas repetidas', async () => {
    const startCount = service.getQueryCount();

    // Primeira chamada - deve processar do banco simulado
    const overview1 = await service.getOverview(TENANT_ID);
    expect(service.getQueryCount()).toBe(startCount + 1);

    // Segunda chamada - deve bater no cache
    const overview2 = await service.getOverview(TENANT_ID);
    expect(service.getQueryCount()).toBe(startCount + 1); // Query count não aumenta

    expect(overview1).toEqual(overview2);
  });

  it('deve invalidar o cache e reprocessar as agregações se novos eventos de ordem de serviço forem emitidos', async () => {
    const startCount = service.getQueryCount();

    // Primeira chamada - computa e guarda no cache
    await service.getOverview(TENANT_ID);
    expect(service.getQueryCount()).toBe(startCount + 1);

    // Novo evento emitido (Invalida o cache)
    await eventEmitter.emitAsync('service-order.completed', {
      tenantId: TENANT_ID,
    });

    // Segunda chamada pós evento - deve realizar nova query
    await service.getOverview(TENANT_ID);
    expect(service.getQueryCount()).toBe(startCount + 2); // Query count aumenta
  });
});
