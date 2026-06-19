import { Test } from '@nestjs/testing';
import { EventEmitterModule, EventEmitter2 } from '@nestjs/event-emitter';
import { DashboardModule } from '../src/modules/dashboard/dashboard.module';
import { DashboardService } from '../src/modules/dashboard/dashboard.service';

async function runTests() {
  console.log('=== INICIANDO TESTES DO MODULE DE DASHBOARD (KPIs + CACHE) ===');

  const moduleRef = await Test.createTestingModule({
    imports: [
      EventEmitterModule.forRoot(),
      DashboardModule,
    ],
  }).compile();

  const app = moduleRef.createNestApplication();
  await app.init();

  const service = moduleRef.get<DashboardService>(DashboardService);
  const eventEmitter = moduleRef.get<EventEmitter2>(EventEmitter2);
  const TENANT_ID = 'tenant-cli-test';

  // Teste 1: Testar Cache
  console.log('\n--- Teste 1: Validação do Hit de Cache (TTL 5m) ---');
  const countAntes = service.getQueryCount();
  
  await service.getOverview(TENANT_ID);
  console.log('Queries executadas (1ª chamada):', service.getQueryCount() - countAntes);

  await service.getOverview(TENANT_ID);
  console.log('Queries executadas (2ª chamada - Cache):', service.getQueryCount() - countAntes);

  if (service.getQueryCount() - countAntes !== 1) {
    throw new Error('Cache falhou: deveria ter computado a query apenas uma vez');
  }

  // Teste 2: Invalidação de Cache por Evento
  console.log('\n--- Teste 2: Invalidação de Cache por Evento de Domínio ---');
  await eventEmitter.emitAsync('service-order.completed', { tenantId: TENANT_ID });
  
  await service.getOverview(TENANT_ID);
  console.log('Queries executadas (Pós-invalidação):', service.getQueryCount() - countAntes);

  if (service.getQueryCount() - countAntes !== 2) {
    throw new Error('Invalidação de cache falhou: deveria ter computado nova query após o evento');
  }

  console.log('\n=== TODOS OS TESTES PASSARAM COM SUCESSO! ===');
  await app.close();
}

runTests().catch(err => {
  console.error('Falha nos testes:', err);
  process.exit(1);
});
