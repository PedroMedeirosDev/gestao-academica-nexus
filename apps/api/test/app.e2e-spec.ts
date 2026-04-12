import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { ApiExceptionFilter } from './../src/common/filters/api-exception.filter';
import { validationExceptionFactory } from './../src/common/pipes/validation-exception.factory';

describe('API (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    process.env.JWT_SECRET =
      process.env.JWT_SECRET ?? 'e2e-jwt-secret-must-be-at-least-32-chars';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalFilters(new ApiExceptionFilter());
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
        exceptionFactory: validationExceptionFactory,
      }),
    );
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('GET /api/v1/health', () => {
    return request(app.getHttpServer())
      .get('/api/v1/health')
      .expect(200)
      .expect((res) => {
        expect(res.body.ok).toBe(true);
      });
  });

  it('GET /api/v1/academic-years sem token → 401 (envelope)', () => {
    return request(app.getHttpServer())
      .get('/api/v1/academic-years')
      .expect(401)
      .expect((res) => {
        expect(res.body.error?.code).toBe('UNAUTHORIZED');
      });
  });
});
