import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { ServiceOrdersModule } from '../src/modules/service-orders/service-orders.module';
import { JwtGuard } from '../src/shared/guards/jwt.guard';

describe('ServiceOrdersController (e2e)', () => {
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
      imports: [ServiceOrdersModule],
    })
      .overrideGuard(JwtGuard).useValue(mockJwtGuard)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  let createdOsId = '';

  it('/service-orders (POST) - Create OS & Auto-Assign Technician', () => {
    // Strategy should prioritize least busy. With 0 load, picks first.
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 1);

    return request(app.getHttpServer())
      .post('/service-orders')
      .set('x-tenant-id', TENANT_A)
      .send({
        quotation_id: 'q-123',
        scheduled_date: futureDate.toISOString(),
        scheduled_time: '14:00'
      })
      .expect(201)
      .then(res => {
        expect(res.body.id).toBeDefined();
        expect(res.body.technician_id).toBeDefined();
        expect(res.body.status).toBe('agendada');
        createdOsId = res.body.id;
      });
  });

  it('/service-orders/:id/start (POST) - Start OS', () => {
    return request(app.getHttpServer())
      .post(`/service-orders/${createdOsId}/start`)
      .set('x-tenant-id', TENANT_A)
      .expect(201)
      .then(res => {
        expect(res.body.status).toBe('em_progresso');
        expect(res.body.arrival_time).toBeDefined();
      });
  });

  it('/service-orders/:id/photos (POST) - Upload Before/After Photos', () => {
    return request(app.getHttpServer())
      .post(`/service-orders/${createdOsId}/photos`)
      .set('x-tenant-id', TENANT_A)
      .send({
        before_photos: ['http://res.cloudinary.com/demo/image/upload/sample.jpg'],
        after_photos: []
      })
      .expect(201)
      .then(res => {
        expect(res.body.before_photos.length).toBe(1);
      });
  });

  it('/service-orders/:id/complete (POST) - Complete OS', () => {
    return request(app.getHttpServer())
      .post(`/service-orders/${createdOsId}/complete`)
      .set('x-tenant-id', TENANT_A)
      .send({
        finalTotal: 500,
        notes: 'Serviço executado com sucesso'
      })
      .expect(201)
      .then(res => {
        expect(res.body.status).toBe('concluida');
        expect(res.body.completion_time).toBeDefined();
        expect(res.body.final_total).toBe(500);
      });
  });

  it('/service-orders/:id/start (POST) - Try starting a completed OS (Should fail)', () => {
    return request(app.getHttpServer())
      .post(`/service-orders/${createdOsId}/start`)
      .set('x-tenant-id', TENANT_A)
      .expect(400);
  });
});
