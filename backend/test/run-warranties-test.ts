import { WarrantiesService, warrantiesDb } from '../src/modules/warranties/warranties.service';
import { AfterSalesService, afterSalesDb } from '../src/modules/after-sales/after-sales.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Test } from '@nestjs/testing';
import { WarrantiesModule } from '../src/modules/warranties/warranties.module';
import { EventEmitterModule } from '@nestjs/event-emitter';

async function runTests() {
  console.log('=== INICIANDO TESTES DO MODULE DE WARRANTIES & AFTER-SALES ===');

  const moduleRef = await Test.createTestingModule({
    imports: [
      EventEmitterModule.forRoot(),
      WarrantiesModule,
    ],
  }).compile();

  const app = moduleRef.createNestApplication();
  await app.init();

  const eventEmitter = moduleRef.get<EventEmitter2>(EventEmitter2);
  const wService = moduleRef.get<WarrantiesService>(WarrantiesService);
  const asService = moduleRef.get<AfterSalesService>(AfterSalesService);

  await wService.clear();
  await asService.clear();

  // Teste 1: Fluxo payment.approved
  console.log('\n--- Teste 1: Trigger de Garantia e Pós-Venda automáticos ao Pagar ---');
  await eventEmitter.emitAsync('payment.approved', {
    id: 'pay-777',
    serviceOrderId: 'so-888',
    tenantId: 'tenant-test',
  });

  const active = await wService.findActive('tenant-test');
  console.log('Garantias ativas após o evento:', active.length);
  if (active.length !== 1 || active[0].service_order_id !== 'so-888') {
    throw new Error('Falha ao gerar garantia automática');
  }

  console.log('Pós-venda agendado no DB:', afterSalesDb.length);
  if (afterSalesDb.length !== 1 || afterSalesDb[0].service_order_id !== 'so-888') {
    throw new Error('Falha ao agendar pós-venda automática');
  }

  // Teste 2: NPS Baixo escalação
  console.log('\n--- Teste 2: Avaliação Baixa (< 4) com Alerta de Suporte ---');
  const token = afterSalesDb[0].token;
  const feedback = await asService.submitFeedback(token, 2, 3, 'Serviço deixou a desejar.');

  console.log('Problema identificado:', feedback.problem_identified);
  console.log('Ação de escalação:', feedback.action_required);
  if (feedback.problem_identified !== true || !feedback.action_required) {
    throw new Error('Nota baixa deveria gerar escalação automática');
  }

  console.log('\n=== TODOS OS TESTES PASSARAM COM SUCESSO! ===');
  await moduleRef.close();
}

runTests().catch(err => {
  console.error('Falha nos testes:', err);
  process.exit(1);
});
