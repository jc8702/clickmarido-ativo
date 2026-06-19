import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { PaymentModule } from '../src/modules/payments/payment.module';
import { JwtGuard } from '../src/shared/guards/jwt.guard';

describe('PaymentController (e2e)', () => {
  let app: INestApplication;
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
      imports: [PaymentModule],
    })
      .overrideGuard(JwtGuard).useValue(mockJwtGuard)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  let createdPaymentId = '';

  it('/payments (POST) - Create PIX Payment', () => {
    return request(app.getHttpServer())
      .post('/payments')
      .set('x-tenant-id', TENANT_A)
      .send({
        serviceOrderId: 'os-123',
        method: 'pix',
        amount: 250
      })
      .expect(201)
      .then(res => {
        expect(res.body.id).toBeDefined();
        expect(res.body.qr_code).toContain('br.gov.bcb.pix');
        expect(res.body.status).toBe('pending');
        createdPaymentId = res.body.id;
      });
  });

  it('/webhooks/mercadopago (POST) - Should REJECT missing signature', () => {
    return request(app.getHttpServer())
      .post('/webhooks/mercadopago')
      .send({
        action: 'payment.updated',
        data: { id: 'pref_mock_os-123', status: 'approved' }
      })
      .expect(403);
  });

  it('/webhooks/mercadopago (POST) - Should ACCEPT valid signature', () => {
    return request(app.getHttpServer())
      .post('/webhooks/mercadopago')
      .set('x-signature', 'mock_valid_signature') // By-pass test hash
      .set('x-request-id', 'req_1234')
      .send({
        action: 'payment.updated',
        data: { id: 'pref_mock_os-123', status: 'approved' } // Preference associada ao OS 123
      })
      .expect(201) // Nest POST defaults to 201
      .then(res => {
        expect(res.body.received).toBe(true);
      });
  });

  // Dá um tempinho para o mock BullMQ rodar o setTimeout
  it('/payments/:id (GET) - Check if webhook updated status to approved', async () => {
    await new Promise(resolve => setTimeout(resolve, 300)); // Espera a queue processar
    
    return request(app.getHttpServer())
      .get(`/payments/${createdPaymentId}`)
      .set('x-tenant-id', TENANT_A)
      .expect(200)
      .then(res => {
        expect(res.body.status).toBe('aprovado');
        expect(res.body.paid_at).toBeDefined();
      });
  });
});
