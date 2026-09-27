import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request = require('supertest');
import { AppModule } from '../src/app.module';
import { configureApplication } from '../src/configure-application';
import { CorePaymentService } from '../src/payments/core-payment.service';

describe('Pagos - POST /payments', () => {
  let app: INestApplication;
  const corePaymentService = {
    createPayment: jest.fn(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
      return { paymentId: 'payment-123', status: 'confirmed' as const };
    }),
  };

  beforeAll(async () => {
    process.env.INTEGRATION_JWT_SECRET = 'test-secret-that-is-long-enough';
    process.env.INTEGRATION_JWT_ISSUER = 'trusted-integration';
    process.env.INTEGRATION_JWT_AUDIENCE = 'payment-service';

    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(CorePaymentService)
      .useValue(corePaymentService)
      .compile();

    app = moduleRef.createNestApplication();
    configureApplication(app);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    corePaymentService.createPayment.mockClear();
  });

  it('agrupa solicitudes simultáneas con la misma clave de idempotencia', async () => {
    const paymentRequest = { amountInMinorUnits: 1250, currency: 'GTQ' };

    const [first, second] = await Promise.all([
      request(app.getHttpServer())
        .post('/payments')
        .set('Idempotency-Key', 'same-payment')
        .send(paymentRequest),
      request(app.getHttpServer())
        .post('/payments')
        .set('Idempotency-Key', 'same-payment')
        .send(paymentRequest),
    ]);

    expect(first.status).toBe(201);
    expect(second.status).toBe(201);
    expect(second.body).toEqual(first.body);
    expect(corePaymentService.createPayment).toHaveBeenCalledTimes(1);
  });

  it('rechaza reutilizar una clave con datos de pago diferentes', async () => {
    await request(app.getHttpServer())
      .post('/payments')
      .set('Idempotency-Key', 'conflicting-payment')
      .send({ amountInMinorUnits: 1250, currency: 'GTQ' })
      .expect(201);

    await request(app.getHttpServer())
      .post('/payments')
      .set('Idempotency-Key', 'conflicting-payment')
      .send({ amountInMinorUnits: 2500, currency: 'GTQ' })
      .expect(409);

    expect(corePaymentService.createPayment).toHaveBeenCalledTimes(1);
  });

  it('devuelve el contrato público de error para datos de pago inválidos', async () => {
    const response = await request(app.getHttpServer())
      .post('/payments')
      .set('Idempotency-Key', 'invalid-payment')
      .send({ amountInMinorUnits: 0, currency: 'Q' })
      .expect(400);

    expect(response.body).toMatchObject({
      statusCode: 400,
      code: 'VALIDATION_ERROR',
      message: 'Request validation failed',
      path: '/payments',
    });
    expect(response.body.details).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ field: 'amountInMinorUnits' }),
        expect.objectContaining({ field: 'currency' }),
      ]),
    );
    expect(response.body.timestamp).toEqual(expect.any(String));
  });

  it('no expone detalles del parser cuando el JSON está malformado', async () => {
    const response = await request(app.getHttpServer())
      .post('/payments')
      .set('Content-Type', 'application/json')
      .set('Idempotency-Key', 'malformed-request')
      .send('{"amountInMinorUnits":')
      .expect(400);

    expect(response.body).toMatchObject({
      statusCode: 400,
      code: 'BAD_REQUEST',
      message: 'Request is invalid',
      details: [],
      path: '/payments',
    });
    expect(response.body.message).not.toContain('JSON');
  });
});
