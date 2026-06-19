import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { QuotationsModule } from '../src/modules/quotations/quotations.module';
import { JwtGuard } from '../src/shared/guards/jwt.guard';

describe('QuotationsController (e2e)', () => {
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
      imports: [QuotationsModule],
    })
      .overrideGuard(JwtGuard).useValue(mockJwtGuard)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  let createdQuotationId = '';
  let approvalToken = '';

  it('/quotations (POST) - Create Quotation', () => {
    // A data válida deve estar no futuro
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 30);

    return request(app.getHttpServer())
      .post('/quotations')
      .set('x-tenant-id', TENANT_A)
      .send({
        customer_id: 'cust-123',
        items: [{ name: 'Instalação Ar Condicionado', quantity: 1, unit_price: 300 }],
        discount: 50,
        valid_until: futureDate.toISOString()
      })
      .expect(201)
      .then(res => {
        expect(res.body.id).toBeDefined();
        expect(res.body.approval_link).toBeDefined();
        expect(res.body.total).toBe(250); // 300 - 50
        createdQuotationId = res.body.id;
        approvalToken = res.body.approval_link;
      });
  });

  it('/quotations/:id/send (POST) - Envia orçamento (SMS mock)', () => {
    return request(app.getHttpServer())
      .post(`/quotations/${createdQuotationId}/send`)
      .set('x-tenant-id', TENANT_A)
      .send({ method: 'whatsapp' })
      .expect(201)
      .then(res => {
        expect(res.body.status).toBe('sent');
      });
  });

  it('/quotations/public/:token (GET) - SEM AUTH - Sucesso', () => {
    return request(app.getHttpServer())
      .get(`/quotations/public/${approvalToken}`)
      .expect(200)
      .then(res => {
        expect(res.body.total).toBe(250);
        expect(res.body.status).toBe('sent');
      });
  });

  it('/quotations/public/:token/approve (POST) - Aprovação do Cliente', () => {
    return request(app.getHttpServer())
      .post(`/quotations/public/${approvalToken}/approve`)
      .expect(201)
      .then(res => {
        expect(res.body.status).toBe('approved');
      });
  });

  it('/quotations/:id (PATCH) - Falha ao tentar atualizar orçamento aprovado', () => {
    return request(app.getHttpServer())
      .patch(`/quotations/${createdQuotationId}`)
      .set('x-tenant-id', TENANT_A)
      .send({ discount: 100 })
      .expect(400); // Bad Request (only draft allowed)
  });
});
