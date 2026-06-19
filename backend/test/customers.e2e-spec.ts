import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { CustomersModule } from '../src/modules/customers/customers.module';
import { JwtGuard } from '../src/shared/guards/jwt.guard';

describe('CustomersController (e2e)', () => {
  let app: INestApplication;
  const TENANT_A = 'tenant-a-123';
  const TENANT_B = 'tenant-b-456';
  
  const mockJwtGuard = {
    canActivate: (context) => {
      const req = context.switchToHttp().getRequest();
      req.user = { userId: 'user-123', role: 'admin', tenantId: req.headers['x-tenant-id'] };
      return true;
    }
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [CustomersModule],
    })
      .overrideGuard(JwtGuard).useValue(mockJwtGuard)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  let createdCustomerId = '';

  it('/customers (POST) - Create Customer Success', () => {
    return request(app.getHttpServer())
      .post('/customers')
      .set('x-tenant-id', TENANT_A)
      .send({
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+5511999999999',
        cpf_cnpj: '12345678901',
        addresses: [{
          street: 'Main St',
          number: '123',
          neighborhood: 'Centro',
          city: 'Blumenau',
          state: 'SC',
          postal_code: '89000000'
        }]
      })
      .expect(201)
      .then(res => {
        expect(res.body.id).toBeDefined();
        createdCustomerId = res.body.id;
      });
  });

  it('/customers (POST) - Duplicated Email = 409', () => {
    return request(app.getHttpServer())
      .post('/customers')
      .set('x-tenant-id', TENANT_A)
      .send({
        name: 'John Another',
        email: 'john@example.com', // Duplicate
        phone: '+5511988888888',
        addresses: [{
          street: 'Main St',
          number: '123',
          neighborhood: 'Centro',
          city: 'Blumenau',
          state: 'SC',
          postal_code: '89000000'
        }]
      })
      .expect(409);
  });

  it('/customers/:id (GET) - Access by wrong tenant = 404/403 (RLS)', () => {
    // Retorna 404 porque no escopo do Tenant B o ID do A não é visível (comportamento de RLS filter)
    return request(app.getHttpServer())
      .get(`/customers/${createdCustomerId}`)
      .set('x-tenant-id', TENANT_B)
      .expect(404);
  });

  it('/customers/:id (PATCH) - Soft update', () => {
    return request(app.getHttpServer())
      .patch(`/customers/${createdCustomerId}`)
      .set('x-tenant-id', TENANT_A)
      .send({ notes: 'VIP Customer' })
      .expect(200)
      .then(res => {
        expect(res.body.notes).toBe('VIP Customer');
      });
  });

  it('/customers/:id (DELETE) - Soft delete', () => {
    return request(app.getHttpServer())
      .delete(`/customers/${createdCustomerId}`)
      .set('x-tenant-id', TENANT_A)
      .expect(200);
  });

  it('/customers/:id (GET) - Should not find after soft delete', () => {
    return request(app.getHttpServer())
      .get(`/customers/${createdCustomerId}`)
      .set('x-tenant-id', TENANT_A)
      .expect(404);
  });
});
