import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { InventoryModule } from '../src/modules/inventory/inventory.module';
import { InventoryService, inventoryDb } from '../src/modules/inventory/inventory.service';
import { JwtGuard } from '../src/shared/guards/jwt.guard';

describe('Inventory Race Conditions (e2e)', () => {
  let app: INestApplication;
  let service: InventoryService;
  const TENANT_A = 'tenant-a-123';
  
  const mockJwtGuard = {
    canActivate: (context) => {
      const req = context.switchToHttp().getRequest();
      req.user = { userId: 'user-123', role: 'admin', tenantId: req.headers['x-tenant-id'] };
      return true;
    }
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [InventoryModule],
    })
      .overrideGuard(JwtGuard).useValue(mockJwtGuard)
      .compile();

    app = moduleFixture.createNestApplication();
    service = moduleFixture.get<InventoryService>(InventoryService);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await service.clear();
  });

  it('RACE CONDITION TEST: Deve evitar reservas duplicadas concorrentes', async () => {
    // 1. Cria item com estoque 10
    let itemId = '';
    await request(app.getHttpServer())
      .post('/inventory')
      .set('x-tenant-id', TENANT_A)
      .send({
        name: 'Tubo de Cobre',
        sku: 'TUB-001',
        quantity_on_hand: 10,
        quantity_minimum: 2,
        unit_cost: 10,
        unit_price: 20
      })
      .expect(201)
      .then(res => {
        itemId = res.body.id;
      });

    // 2. Dispara 2 requests SIMULTÂNEOS pedindo 10 unidades
    const req1 = request(app.getHttpServer())
      .post('/inventory/reserve')
      .set('x-tenant-id', TENANT_A)
      .send({
        serviceOrderId: 'OS-RACE-1',
        items: [{ itemId, quantity: 10 }]
      });

    const req2 = request(app.getHttpServer())
      .post('/inventory/reserve')
      .set('x-tenant-id', TENANT_A)
      .send({
        serviceOrderId: 'OS-RACE-2',
        items: [{ itemId, quantity: 10 }]
      });

    const [res1, res2] = await Promise.all([req1, req2]);

    // 3. Resultado Esperado:
    // Uma requisição passa (201), a outra falha (400) - Insufficient Stock.
    // Sem o lock (mutex), ambas leriam estoque 10 e gravariam reserva 10 (Total 20, Data Corruption).
    const statuses = [res1.status, res2.status].sort();
    
    expect(statuses).toEqual([201, 400]);

    // O item no banco não pode ter reserva maior que o on_hand
    const dbItem = inventoryDb.find(i => i.id === itemId);
    expect(dbItem.quantity_reserved).toBe(10); // Apenas um pedido de 10 passou
    expect(dbItem.quantity_on_hand).toBe(10);
  });

  it('Fluxo Completo: Criar -> Reservar -> Consumir', async () => {
    // 1. Cria item com estoque 10
    let itemId = '';
    await request(app.getHttpServer())
      .post('/inventory')
      .set('x-tenant-id', TENANT_A)
      .send({ name: 'Fita Isolante', sku: 'FIT-01', quantity_on_hand: 10, quantity_minimum: 1, unit_cost: 2, unit_price: 5 })
      .expect(201)
      .then(res => { itemId = res.body.id; });

    // 2. Reservar 3
    await request(app.getHttpServer())
      .post('/inventory/reserve')
      .set('x-tenant-id', TENANT_A)
      .send({ serviceOrderId: 'OS-FLOW', items: [{ itemId, quantity: 3 }] })
      .expect(201);
      
    let dbItem = inventoryDb.find(i => i.id === itemId);
    expect(dbItem.quantity_reserved).toBe(3);
    expect(dbItem.quantity_on_hand).toBe(10); // Estoque real não baixou ainda

    // 3. Consumir (OS Concluída)
    await request(app.getHttpServer())
      .post('/inventory/consume')
      .set('x-tenant-id', TENANT_A)
      .send({ serviceOrderId: 'OS-FLOW' })
      .expect(201);

    dbItem = inventoryDb.find(i => i.id === itemId);
    expect(dbItem.quantity_reserved).toBe(0); // Reserva limpa
    expect(dbItem.quantity_on_hand).toBe(7);  // Estoque real baixou de 10 pra 7
  });
});
