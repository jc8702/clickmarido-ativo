import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, Controller, Get, UseGuards } from '@nestjs/common';
import * as request from 'supertest';
import { AuthModule } from '../src/modules/auth/auth.module';
import { JwtGuard } from '../src/shared/guards/jwt.guard';

// Controller mockado para testar rotas protegidas
@Controller('protected')
class ProtectedController {
  @Get()
  @UseGuards(JwtGuard)
  getProtected() {
    return { ok: true };
  }
}

describe('AuthController (e2e)', () => {
  let app: INestApplication;
  const TENANT_ID = '00000000-0000-0000-0000-000000000001';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AuthModule],
      controllers: [ProtectedController],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  let validRefreshToken = '';
  let validAccessToken = '';

  it('/auth/register (POST) - Sucesso', () => {
    return request(app.getHttpServer())
      .post('/auth/register')
      .set('x-tenant-id', TENANT_ID)
      .send({
        email: 'test@example.com',
        password: 'Password123!',
        name: 'Test User',
        phone: '11999999999'
      })
      .expect(201)
      .then((res) => {
        expect(res.body.accessToken).toBeDefined();
        expect(res.body.refreshToken).toBeDefined();
        validRefreshToken = res.body.refreshToken;
        validAccessToken = res.body.accessToken;
      });
  });

  it('/auth/register (POST) - Falha (email duplicado) = 409', () => {
    return request(app.getHttpServer())
      .post('/auth/register')
      .set('x-tenant-id', TENANT_ID)
      .send({
        email: 'test@example.com',
        password: 'Password123!',
        name: 'Test User',
        phone: '11999999999'
      })
      .expect(409);
  });

  it('/auth/login (POST) - Falha (senha errada) = 401', () => {
    return request(app.getHttpServer())
      .post('/auth/login')
      .set('x-tenant-id', TENANT_ID)
      .send({
        email: 'test@example.com',
        password: 'wrongpassword'
      })
      .expect(401);
  });

  it('/protected (GET) - Sucesso com JWT válido = 200', () => {
    return request(app.getHttpServer())
      .get('/protected')
      .set('Authorization', `Bearer ${validAccessToken}`)
      .expect(200);
  });

  it('/protected (GET) - Falha com JWT inválido/expirado = 401', () => {
    return request(app.getHttpServer())
      .get('/protected')
      .set('Authorization', `Bearer invalidtoken`)
      .expect(401);
  });

  it('/auth/refresh (POST) - Falha (token inválido/expirado) = 401', () => {
    return request(app.getHttpServer())
      .post('/auth/refresh')
      .set('x-tenant-id', TENANT_ID)
      .send({
        refreshToken: 'invalidrefresh'
      })
      .expect(401);
  });
  
  it('/auth/refresh (POST) - Sucesso', () => {
    return request(app.getHttpServer())
      .post('/auth/refresh')
      .set('x-tenant-id', TENANT_ID)
      .send({
        refreshToken: validRefreshToken
      })
      .expect(200)
      .then((res) => {
        expect(res.body.accessToken).toBeDefined();
      });
  });
});
